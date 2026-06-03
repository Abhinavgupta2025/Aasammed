import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/units";
import { ClipboardList, Calendar, DollarSign, Clock, CheckCircle2, XCircle, Beaker } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UserOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "USER") {
    redirect("/login");
  }

  // Fetch this user's orders including order items and products
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-xl">
          <ClipboardList className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-slate-350">No Orders Found</h4>
          <p className="text-slate-500 text-sm mt-1">You haven&apos;t submitted any order requests yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all duration-300"
              >
                {/* Order header row */}
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Order ID
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-400 select-all">
                        {order.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted on {dateStr}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded border ${
                      order.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : order.status === "CONFIRMED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {order.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {order.status === "CONFIRMED" && <CheckCircle2 className="w-3 h-3" />}
                      {order.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                      {order.status}
                    </span>

                    {/* Total Price */}
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-semibold text-slate-500">Order Total</p>
                      <p className="text-md font-bold font-mono text-slate-200 mt-0.5">
                        {formatRupees(order.totalPricePaise)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items block */}
                <div className="p-6 space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chemicals Ordered</h5>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="pb-2 px-3">Chemical Specs</th>
                          <th className="pb-2 px-3 text-right">Ordered Qty</th>
                          <th className="pb-2 px-3 text-right">Base Conversion</th>
                          <th className="pb-2 px-3 text-right">Base Price</th>
                          <th className="pb-2 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30 text-xs text-slate-300">
                        {order.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-950/20 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-200">{item.product.name}</span>
                              <span className="text-[10px] font-mono text-slate-500 block mt-0.5 select-all">
                                SKU: {item.product.sku}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium">
                              {Number(item.orderedQuantity)} {item.orderedUnit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              {Number(item.quantityInBaseUnit)} {item.product.baseUnit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              {formatRupees(item.unitPricePaise)}/{item.product.baseUnit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-200">
                              {formatRupees(item.lineTotalPaise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="bg-slate-950/50 p-4 border border-slate-800/80 rounded-xl mt-4">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Order Notes / Specifications
                      </span>
                      <p className="text-xs text-slate-350 italic">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
