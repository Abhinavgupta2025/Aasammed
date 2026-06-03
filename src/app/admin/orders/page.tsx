"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { ClipboardCheck, Calendar, User as UserIcon, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2, RefreshCcw } from "lucide-react";
import { formatINR, Unit, TO_BASE_FACTOR } from "@/lib/units";

interface OrderItem {
  id: string;
  orderedUnit: string;
  orderedQuantity: number;
  quantityInBaseUnit: number;
  unitPricePaise: string;
  lineTotalPaise: string;
  product: {
    name: string;
    sku: string;
    category: string;
    baseUnit: string;
    basePricePaise: string;
  };
}

interface Order {
  id: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  totalPricePaise: string;
  notes?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/orders${query}`);
      if (!res.ok) {
        throw new Error("Failed to fetch system orders");
      }
      const data = await res.json();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleUpdateStatus = async (orderId: string, newStatus: "CONFIRMED" | "REJECTED") => {
    setSubmitting((prev) => ({ ...prev, [orderId]: true }));
    const loadingToast = toast.loading(`Updating order status to ${newStatus}...`);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      toast.dismiss(loadingToast);
      toast.success(newStatus === "CONFIRMED" ? "Order approved successfully!" : "Order rejected. Reserved stock returned.");
      fetchOrders();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to update order status");
    } finally {
      setSubmitting((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-amber-500" />
          Filter Order Requests
        </h3>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-4 text-xs text-slate-200 focus:outline-none transition-colors"
          >
            <option value="">All Orders</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          
          <button
            onClick={fetchOrders}
            className="bg-slate-950 hover:bg-slate-850 text-slate-400 p-2.5 border border-slate-800 rounded-xl transition-all active:scale-95"
            title="Refresh list"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders List Container */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-3 text-slate-450 text-xs">Fetching transactions from system database...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <ClipboardCheck className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <h4 className="text-slate-350 font-bold">No Orders Found</h4>
          <p className="text-slate-550 text-sm mt-1">There are no order requests matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {orders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            const isSubmitting = !!submitting[order.id];
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700/80 transition-all duration-300"
              >
                {/* Header info bar */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-6 cursor-pointer hover:bg-slate-850/20 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between select-none"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {order.user.name} ({order.user.email})
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 select-all" onClick={(e) => e.stopPropagation()}>
                        ID: {order.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-4 text-left md:text-right">
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-slate-550">Date Submitted</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{dateStr}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-slate-550">Grand Total</p>
                        <p className="text-sm font-bold font-mono text-warning mt-0.5">
                          {formatINR(order.totalPricePaise)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                        order.status === "PENDING"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : order.status === "CONFIRMED"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-danger/10 text-danger border-danger/20"
                      }`}>
                        {order.status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-6 border-t border-slate-800/80 bg-slate-950/20 space-y-6 animate-slideDown">
                    {/* Conversion Audit Cards */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion Audit Trail</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.items.map((item) => {
                          const multiplier = TO_BASE_FACTOR[item.orderedUnit as Unit] || 1;
                          return (
                            <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-sm">
                              {/* Header */}
                              <div className="bg-slate-900/60 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center">
                                <span className="font-bold text-slate-200">{item.product.name}</span>
                                <span className="font-mono text-[10px] text-slate-500 select-all">SKU: {item.product.sku}</span>
                              </div>
                              
                              {/* Audit details */}
                              <div className="p-4 space-y-2 font-mono text-xs text-slate-350">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">User ordered:</span>
                                  <span className="font-semibold text-slate-200">{item.orderedQuantity} {item.orderedUnit}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Converted to:</span>
                                  <span className="font-semibold text-slate-200">
                                    {Number(item.quantityInBaseUnit).toLocaleString()} {item.product.baseUnit}{" "}
                                    <span className="text-slate-500 font-normal">(× {multiplier.toLocaleString()})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Rate:</span>
                                  <span className="font-semibold text-slate-200">
                                    {formatINR(item.product.basePricePaise)} per {item.product.baseUnit}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-slate-900 pt-2 text-sm font-sans">
                                  <span className="text-slate-500 font-semibold uppercase text-xs">Line total:</span>
                                  <span className="font-mono font-bold text-primary">
                                    {formatINR(item.lineTotalPaise)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes block */}
                    {order.notes && (
                      <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Seller Special Instructions / Notes
                        </span>
                        <p className="text-xs text-slate-350 italic">{order.notes}</p>
                      </div>
                    )}

                    {/* Approve/Reject Controls (Visible only for PENDING orders) */}
                    {order.status === "PENDING" && (
                      <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleUpdateStatus(order.id, "REJECTED")}
                          className="bg-danger/10 hover:bg-danger/20 active:scale-95 text-danger border border-danger/20 rounded-xl py-2 px-5 text-xs font-bold transition-all"
                        >
                          Reject Order
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                          className="bg-success hover:bg-success/90 active:bg-success/95 text-white rounded-xl py-2 px-5 text-xs font-bold transition-all active:scale-95 shadow-md shadow-success/10"
                        >
                          Approve Request
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
