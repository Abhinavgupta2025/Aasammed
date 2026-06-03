"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2, ShoppingCart, Loader2, ArrowRight, Clipboard, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Unit, toBase, calcLineTotal, formatINR, COMPATIBLE_UNITS } from "@/lib/units";

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: Unit;
  basePricePaise: string;
  orderedQuantity: number;
  orderedUnit: Unit;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hydrate cart from localStorage on mount
    try {
      const stored = localStorage.getItem("medchem_cart");
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (error) {
      toast.error("Failed to load cart items");
    } finally {
      setHydrated(true);
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("medchem_cart", JSON.stringify(newCart));
  };

  const handleRemove = (productId: string, orderedUnit: Unit) => {
    const updated = cart.filter(
      (item) => !(item.productId === productId && item.orderedUnit === orderedUnit)
    );
    saveCart(updated);
    toast.success("Item removed from cart");
  };

  const handleQuantityChange = (productId: string, orderedUnit: Unit, newQty: number) => {
    if (isNaN(newQty) || newQty <= 0) return;
    const updated = cart.map((item) => {
      if (item.productId === productId && item.orderedUnit === orderedUnit) {
        return { ...item, orderedQuantity: newQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const handleUnitChange = (productId: string, oldUnit: Unit, newUnit: Unit) => {
    const updated = cart.map((item) => {
      if (item.productId === productId && item.orderedUnit === oldUnit) {
        return { ...item, orderedUnit: newUnit };
      }
      return item;
    });
    saveCart(updated);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    const loadingToast = toast.loading("Submitting order request...");

    try {
      // Map payload keys to match backend expected parameters: { productId, quantity, unit }
      const payload = {
        notes,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.orderedQuantity,
          unit: item.orderedUnit,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      toast.dismiss(loadingToast);
      toast.success("Order request submitted successfully!");
      
      // Clear local cart
      localStorage.removeItem("medchem_cart");
      setCart([]);
      
      // Redirect to orders
      router.push("/dashboard/orders");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "An error occurred while submitting order");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-2 text-slate-400 text-sm font-medium">Hydrating shopping cart...</p>
      </div>
    );
  }

  // Calculate lines and grand total using the pure functions
  const cartWithTotals = cart.map((item) => {
    const lineTotal = calcLineTotal(
      item.orderedQuantity,
      item.orderedUnit,
      Number(item.basePricePaise)
    );
    const qtyInBase = toBase(item.orderedQuantity, item.orderedUnit);
    return { ...item, lineTotal, qtyInBase };
  });

  const grandTotal = cartWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <div className="space-y-6">
      {cart.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-xl">
          <ShoppingCart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-slate-200">Your Cart is Empty</h4>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Browse our chemicals catalog and add reagents to your order request.
          </p>
          <Link
            href="/dashboard/products"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Table List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2 shadow-xl">
            <h4 className="font-bold text-slate-100 mb-6">Review Selected Items</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Chemical Spec</th>
                    <th className="py-3 px-4">Conversion & Price Breakdown</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                  {cartWithTotals.map((item) => {
                    const compatibleUnits = COMPATIBLE_UNITS[item.baseUnit] || [item.baseUnit];
                    return (
                      <tr key={`${item.productId}-${item.orderedUnit}`} className="hover:bg-slate-850/20 transition-colors">
                        {/* Name and SKU */}
                        <td className="py-4 px-4 align-top w-1/2">
                          <div>
                            <p className="font-bold text-slate-200 text-base">{item.name}</p>
                            <span className="text-[10px] font-mono text-slate-500 block mt-1 select-all">
                              SKU: {item.sku}
                            </span>
                          </div>
                        </td>
                        
                        {/* Conversion Breakdown Details */}
                        <td className="py-4 px-4 align-top text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold">Ordered:</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.orderedQuantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.productId,
                                  item.orderedUnit,
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-16 bg-slate-950 border border-slate-800 focus:border-primary rounded-lg py-1 px-2 text-slate-200 font-mono text-center focus:outline-none text-xs"
                            />
                            <select
                              value={item.orderedUnit}
                              onChange={(e) =>
                                handleUnitChange(item.productId, item.orderedUnit, e.target.value as Unit)
                              }
                              className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-slate-300 text-xs focus:outline-none focus:border-primary font-medium"
                            >
                              {compatibleUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1 text-xs text-slate-450">
                            <div>
                              <span className="text-slate-500">Equivalent: </span>
                              <span className="font-mono text-slate-350">{item.qtyInBase.toLocaleString()} {item.baseUnit} (base unit)</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Rate: </span>
                              <span className="font-mono text-slate-350">
                                {formatINR(item.basePricePaise)}/{item.baseUnit}
                              </span>
                            </div>
                             <div className="font-semibold text-slate-300 pt-1 border-t border-slate-850/40">
                              <span>Line total: </span>
                              <span className="font-mono text-primary font-bold">
                                {formatINR(item.lineTotal)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-4 align-top text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(item.productId, item.orderedUnit)}
                            className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-950 transition-all"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Checkout Summary Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between h-fit space-y-6">
            <div className="space-y-6">
              <h4 className="font-bold text-slate-100">Checkout Summary</h4>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Clipboard className="w-3.5 h-3.5" />
                  Order Notes (Optional)
                </label>
                <textarea
                  placeholder="Special handling requirements, delivery instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none h-24 resize-none transition-colors"
                />
              </div>

              {/* Totals */}
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3 font-mono">
                <div className="flex justify-between text-xs text-slate-500 font-sans">
                  <span>Cart Items Count</span>
                  <span className="font-mono text-slate-355">{cart.length}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm font-bold border-t border-slate-800/80 pt-3">
                  <span className="font-sans text-slate-400">Grand Total</span>
                  <span className="text-xl text-primary">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 active:bg-primary/95 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Placing Order Request...
                </>
              ) : (
                <>
                  Submit Order Request
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
