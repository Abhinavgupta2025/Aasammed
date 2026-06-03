import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serialize";
import { Unit } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(serializeProduct(product));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: ADMIN only" }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { name, sku, description, category, baseUnit, basePricePaise, stockInBaseUnit, isActive } = body;

    // Validation
    if (!name || !sku || !category || !baseUnit || basePricePaise === undefined || stockInBaseUnit === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // SKU unique check (excluding self)
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku,
        NOT: { id },
      },
    });
    if (existingProduct) {
      return NextResponse.json({ error: "Product with this SKU already exists" }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
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

    return NextResponse.json(serializeProduct(updatedProduct));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: ADMIN only" }, { status: 403 });
  }

  const { id } = params;

  try {
    // Check if product is referenced in order items
    const referencedItemsCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (referencedItemsCount > 0) {
      // Rather than deleting, we can deactivate the product to maintain order history
      // Or we can return a constraint error if the prompt specifically demands hard delete.
      // Let's allow hard deletion of unreferenced items, but for referenced items suggest deactivation
      // or we can allow deleting and it cascade deletes. But wait, in schema we defined:
      // "productId String @map("product_id") @db.Uuid"
      // "product Product @relation(fields: [productId], references: [id], onDelete: Cascade)"
      // Ah! We have Cascade delete in the database schema relation. So deleting a product will cascade delete its order items.
      // However, to prevent unintended loss of orders records, we can reject it if there are orders, or just proceed with deleting.
      // Let's warn or reject to be safe, or just let cascade happen but inform the user.
      // Wait, let's reject to maintain history integrity, which is best practice in inventory systems.
      return NextResponse.json(
        { error: "Cannot delete product because it has associated order history. Deactivate it instead." },
        { status: 400 }
      );
    }

    const deletedProduct = await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(serializeProduct(deletedProduct));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
