import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/units";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  CreditCard,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "USER") {
    redirect("/login");
  }

  // Query database directly
  const totalProducts = await prisma.product.count({
    where: { isActive: true }
  });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const confirmedOrders = orders.filter(o => o.status === "CONFIRMED");
  const totalSpendPaise = confirmedOrders.reduce((sum, o) => sum + o.totalPricePaise, 0n);
  const recentOrders = orders.slice(0, 5);

  const stats = [
    {
      name: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      name: "Pending Approvals",
      value: pendingOrders,
      icon: Clock,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      name: "Confirmed Orders",
      value: confirmedOrders.length,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      name: "Total Expenditure",
      value: formatRupees(totalSpendPaise),
      icon: CreditCard,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
      mono: true
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Welcome to your Seller Dashboard</h3>
          <p className="text-slate-400 text-sm mt-1">Manage, search chemicals catalog, request orders, and track approvals.</p>
        </div>
        <Link 
          href="/dashboard/products" 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Browse Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-5 hover:border-slate-700 transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{stat.name}</p>
              <h4 className={`text-2xl font-bold text-slate-100 mt-1 ${stat.mono ? "font-mono" : ""}`}>
                {stat.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-100">Recent Orders</h4>
            <Link href="/dashboard/orders" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View All Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No orders placed yet.</p>
              <Link href="/dashboard/products" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                Start shopping now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                  {recentOrders.map((order) => {
                    const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });
                    const itemsSummary = order.items.map(i => `${i.product.name} (${Number(i.orderedQuantity)} ${i.orderedUnit})`).join(", ");
                    return (
                      <tr key={order.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs select-all text-indigo-400">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-3.5 px-4">{dateStr}</td>
                        <td className="py-3.5 px-4 max-w-[200px] truncate" title={itemsSummary}>
                          {itemsSummary}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            order.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : order.status === "CONFIRMED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                          {formatRupees(order.totalPricePaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Catalog Categories Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-100 mb-2">Inventory System Info</h4>
            <p className="text-xs text-slate-400 mb-6">Overview of current system parameters and configurations.</p>
            
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Active Chemicals Catalog</span>
                <span className="text-sm font-bold text-slate-200">{totalProducts} Products</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Default Currency</span>
                <span className="text-sm font-semibold text-indigo-400 font-mono">INR (₹)</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Compatible Units</span>
                <span className="text-xs font-semibold text-emerald-400">g, kg, L, mL, unit</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <p className="text-[11px] text-slate-500">
              Conversions are automated in the Cart page. Prices are tracked to paise integers (1/100 INR) to ensure transaction accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
