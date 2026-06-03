import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toBase, calcLineTotal, Unit as AppUnit } from "@/lib/units";
import { Unit } from "@prisma/client";
import { serializeOrder } from "@/lib/serialize";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  try {
    const whereClause: any = {};
    
    // Filter by role: users only see their own orders
    if (session.user.role !== "ADMIN") {
      whereClause.userId = session.user.id;
    }

    // Optional status filter
    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedOrders = orders.map(serializeOrder);
    return NextResponse.json(serializedOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Only USER (Seller) can place orders as per prompt requirements: "POST /api/orders -> place order (USER)"
  if (!session || session.user.role !== "USER") {
    return NextResponse.json({ error: "Forbidden: USER (Seller) only" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { items, notes } = body; // items: Array<{ productId, quantity, unit }>

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // We run the order placement inside a database transaction to prevent race conditions on stock levels
    const order = await prisma.$transaction(async (tx) => {
      let totalPricePaise = 0n;
      const orderItemsToCreate: any[] = [];
      const productsToUpdate: any[] = [];

      for (const item of items) {
        const { productId, quantity, unit } = item;

        if (!productId || !unit || quantity === undefined || quantity <= 0) {
          throw new Error("Invalid order item parameters");
        }

        // Fetch product within transaction
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product not found`);
        }

        if (!product.isActive) {
          throw new Error(`Product ${product.name} is no longer active`);
        }

        // Calculate base unit quantity using the pure toBase utility
        const qtyInBase = toBase(quantity, unit as AppUnit);
        
        // Stock check
        const currentStock = Number(product.stockInBaseUnit);
        if (qtyInBase > currentStock) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${currentStock} ${product.baseUnit}, Requested: ${qtyInBase} ${product.baseUnit}`
          );
        }

        // Calculate price server-side (never trust client-sent totals)
        const lineTotalPaise = BigInt(Math.round(qtyInBase * Number(product.basePricePaise)));
        totalPricePaise += lineTotalPaise;

        // Prep data for creation
        orderItemsToCreate.push({
          productId,
          orderedUnit: unit as Unit,
          orderedQuantity: quantity,
          quantityInBaseUnit: qtyInBase,
          unitPricePaise: product.basePricePaise,
          lineTotalPaise: lineTotalPaise,
        });

        // Prep stock decrement
        productsToUpdate.push({
          id: productId,
          newStock: currentStock - qtyInBase,
        });
      }

      // 1. Decrement product stocks
      for (const prod of productsToUpdate) {
        await tx.product.update({
          where: { id: prod.id },
          data: {
            stockInBaseUnit: prod.newStock,
          },
        });
      }

      // 2. Create the main Order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          totalPricePaise,
          notes: notes || "",
        },
      });

      // 3. Create the OrderItems linked to this order
      for (const orderItem of orderItemsToCreate) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            ...orderItem,
          },
        });
      }

      // Fetch full order for output
      return await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to place order" }, { status: 400 });
  }
}
