import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupees } from "@/lib/units";
import { 
  Beaker, 
  Clock, 
  IndianRupee, 
  Users, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Database queries
  const totalProducts = await prisma.product.count();
  const pendingOrders = await prisma.order.count({
    where: { status: "PENDING" }
  });
  const confirmedOrders = await prisma.order.findMany({
    where: { status: "CONFIRMED" },
    select: { totalPricePaise: true }
  });
  const totalRevenuePaise = confirmedOrders.reduce((sum, o) => sum + o.totalPricePaise, 0n);

  const totalSellers = await prisma.user.count({
    where: { role: "USER" }
  });

  const lowStockCount = await prisma.product.count({
    where: {
      stockInBaseUnit: {
        lt: 100 // low stock threshold
      }
    }
  });

  const kpis = [
    {
      name: "Total Products",
      value: totalProducts,
      desc: "Chemicals cataloged",
      icon: Beaker,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      href: "/admin/products"
    },
    {
      name: "Pending Approvals",
      value: pendingOrders,
      desc: "Orders awaiting review",
      icon: Clock,
      color: pendingOrders > 0 
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse" 
        : "text-slate-400 bg-slate-500/10 border-slate-500/20",
      href: "/admin/orders"
    },
    {
      name: "Total Revenue",
      value: formatRupees(totalRevenuePaise),
      desc: "Confirmed sales total",
      icon: IndianRupee,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      mono: true,
      href: "/admin/orders"
    },
    {
      name: "Active Sellers",
      value: totalSellers,
      desc: "Registered user accounts",
      icon: Users,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
      href: "/admin"
    }
  ];

  // Fetch pending orders to display in review panel
  const pendingOrdersList = await prisma.order.findMany({
    where: { status: "PENDING" },
    take: 5,
    include: {
      user: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            Administrative Control Panel
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            System metrics, products CRUD catalog, chemical stock warnings, and transaction verification.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Link 
            href={kpi.href}
            key={kpi.name}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl block hover:border-slate-700 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {kpi.name}
              </span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className={`text-2xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors ${kpi.mono ? "font-mono" : ""}`}>
                {kpi.value}
              </h4>
              <p className="text-xs text-slate-450 mt-1">{kpi.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-100">Review Pending Orders</h4>
            <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              {pendingOrders} Awaiting
            </span>
          </div>

          {pendingOrdersList.length === 0 ? (
            <div className="py-16 text-center bg-slate-950/40 rounded-xl border border-slate-850">
              <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No pending orders to approve.</p>
              <p className="text-slate-600 text-xs mt-1">Excellent! All transactions are up to date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrdersList.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });
                const itemsList = order.items.map(i => `${i.product.name} (${Number(i.orderedQuantity)} ${i.orderedUnit})`).join(", ");
                return (
                  <div key={order.id} className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                    <div className="space-y-1 max-w-[70%]">
                      <p className="text-sm font-bold text-slate-250 truncate">
                        Request by {order.user.name} ({order.user.email})
                      </p>
                      <p className="text-xs text-slate-450 truncate" title={itemsList}>
                        Items: {itemsList}
                      </p>
                      <p className="text-[10px] text-slate-550 font-mono">
                        Date: {dateStr} | ID: {order.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {formatRupees(order.totalPricePaise)}
                      </span>
                      <Link 
                        href="/admin/orders" 
                        className="text-[11px] text-indigo-400 hover:text-indigo-350 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Inspect
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* System Warnings Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="font-bold text-slate-100">Critical Stock Warning</h4>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                lowStockCount > 0 
                  ? "bg-red-500/10 border-red-500/20 text-red-400" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}>
                {lowStockCount > 0 ? (
                  <>
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold">Low-Stock Alert</h5>
                      <p className="text-xs text-slate-400 mt-1">
                        There are <span className="font-bold text-red-400">{lowStockCount}</span> products with stock levels below the 100-unit threshold.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold">All Stocks Healthy</h5>
                      <p className="text-xs text-slate-400 mt-1">
                        All chemicals and reagents have stock levels above the warning threshold.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-indigo-400">Database Engine</span>
                <p className="text-xs text-slate-400 flex justify-between">
                  Prisma Client: <span className="font-mono text-slate-200">v7.8.0</span>
                </p>
                <p className="text-xs text-slate-400 flex justify-between">
                  ORM Provider: <span className="text-slate-200">postgresql</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <p className="text-[11px] text-slate-500">
              Orders approve transactions automatically deduct inventories. Orders reject restores it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
