"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, ShieldCheck, ArrowUpDown, Search, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  baseUnit: string;
  stockInBaseUnit: number;
  isActive: boolean;
}

type SortField = "name" | "stock" | "category";
type SortOrder = "asc" | "desc";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("stock");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${search}`);
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (error: any) {
      toast.error(error.message || "Failed to load stock levels");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, fetchProducts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // 100 units threshold for low stock warning
  const LOW_STOCK_THRESHOLD = 100.0;

  // Process sorting and filtering
  const processedProducts = products
    .filter((p) => {
      if (filterLowStock) {
        return p.stockInBaseUnit < LOW_STOCK_THRESHOLD;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "category") {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === "stock") {
        comparison = a.stockInBaseUnit - b.stockInBaseUnit;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Aggregate counts
  const totalItemsCount = products.length;
  const criticalItemsCount = products.filter((p) => p.stockInBaseUnit < LOW_STOCK_THRESHOLD).length;

  return (
    <div className="space-y-6">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Monitored Items</p>
            <h4 className="text-xl font-bold text-slate-200 mt-0.5">{totalItemsCount} Products</h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Critical Stock Levels</p>
            <h4 className={`text-xl font-bold mt-0.5 ${criticalItemsCount > 0 ? "text-red-400" : "text-slate-200"}`}>
              {criticalItemsCount} Warnings
            </h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Normal Stock Levels</p>
            <h4 className="text-xl font-bold text-slate-200 mt-0.5">
              {totalItemsCount - criticalItemsCount} Healthy
            </h4>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search catalog stocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Warning checkbox filter */}
        <div className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            id="filterLowStock"
            checked={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.checked)}
            className="w-4 h-4 bg-slate-950 border border-slate-800 focus:ring-amber-500 rounded text-amber-500"
          />
          <label htmlFor="filterLowStock" className="text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer">
            Show only low stock items (&lt; 100 units)
          </label>
        </div>
      </div>

      {/* Stock level list table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="mt-3 text-slate-450 text-xs">Computing stock level data...</p>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="py-24 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-850 mx-auto mb-4" />
            <h4 className="text-slate-350 font-bold">No Stock Alerts</h4>
            <p className="text-slate-550 text-sm mt-1">There are no products matching the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-450 uppercase tracking-wider bg-slate-900/50">
                  <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-850" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1.5">
                      Chemical Specification
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5">SKU</th>
                  <th className="py-3.5 px-5 cursor-pointer hover:bg-slate-850" onClick={() => handleSort("category")}>
                    <div className="flex items-center gap-1.5">
                      Category
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-right cursor-pointer hover:bg-slate-850" onClick={() => handleSort("stock")}>
                    <div className="flex items-center justify-end gap-1.5">
                      Current Stock Level
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-center">Threshold Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                {processedProducts.map((product) => {
                  const isLowStock = product.stockInBaseUnit < LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={product.id} className="hover:bg-slate-850/20 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-5 font-bold text-slate-200">
                        {product.name}
                      </td>
                      {/* SKU */}
                      <td className="py-4 px-5 font-mono text-xs text-indigo-400 select-all">
                        {product.sku}
                      </td>
                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {product.category}
                        </span>
                      </td>
                      {/* Stock level */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-250">
                        {product.stockInBaseUnit}
                        <span className="text-[10px] text-slate-500 font-normal ml-1">{product.baseUnit}</span>
                      </td>
                      {/* Warning status badge */}
                      <td className="py-4 px-5 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            Stock Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
