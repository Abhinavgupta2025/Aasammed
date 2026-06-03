import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serialize";

export async function PATCH(
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
    const { status } = body; // PENDING, CONFIRMED, REJECTED

    if (!status || !["PENDING", "CONFIRMED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // If status is unchanged, just return
      if (order.status === status) {
        return order;
      }

      // If order was PENDING and is now being REJECTED, restore product stock
      if (order.status === "PENDING" && status === "REJECTED") {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockInBaseUnit: Number(product.stockInBaseUnit) + Number(item.quantityInBaseUnit),
              },
            });
          }
        }
      }

      // If order was REJECTED and is now being moved back to CONFIRMED/PENDING (rare but possible), decrement stock again
      if (order.status === "REJECTED" && (status === "CONFIRMED" || status === "PENDING")) {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const currentStock = Number(product.stockInBaseUnit);
            const reqStock = Number(item.quantityInBaseUnit);
            if (currentStock < reqStock) {
              throw new Error(`Cannot reactivate order: Insufficient stock for ${product.name}. Available: ${currentStock}, Needs: ${reqStock}`);
            }

            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockInBaseUnit: currentStock - reqStock,
              },
            });
          }
        }
      }

      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updated;
    });

    return NextResponse.json(serializeOrder(updatedOrder));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order" }, { status: 400 });
  }
}
