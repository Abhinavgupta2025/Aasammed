import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Unit } from "@prisma/client";
import { serializeProduct } from "@/lib/serialize";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const unit = searchParams.get("unit") || "";
  const inStock = searchParams.get("inStock");
  
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "12", 10));

  try {
    const where: any = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(category && { category }),
      ...(unit && { baseUnit: unit as any }),
      ...(inStock === "true" && { stockInBaseUnit: { gt: 0 } }),
    };

    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });

    const distinctCategories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    });
    const categoryList = distinctCategories.map(c => c.category);

    const serializedProducts = products.map(serializeProduct);

    return NextResponse.json({
      products: serializedProducts,
      total,
      page,
      totalPages,
      categories: categoryList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: ADMIN only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, sku, description, category, baseUnit, basePricePaise, stockInBaseUnit, isActive } = body;

    // Validations
    if (!name || !sku || !category || !baseUnit || basePricePaise === undefined || stockInBaseUnit === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SKU unique check
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });
    if (existingProduct) {
      return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        sku,
        description: description || "",
        category,
        baseUnit: baseUnit as Unit,
        basePricePaise: BigInt(basePricePaise),
        stockInBaseUnit: Number(stockInBaseUnit),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(serializeProduct(newProduct), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
