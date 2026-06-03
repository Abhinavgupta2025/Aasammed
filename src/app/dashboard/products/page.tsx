"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useDebounce } from "@/lib/useDebounce";
import { formatINR } from "@/lib/units";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  baseUnit: string;
  basePricePaise: string;
  stockInBaseUnit: number;
}

// Wraps matched substring in <mark> tag styled with bg-teal-500/20
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-teal-100 text-teal-800 px-0.5 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function ProductSearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search input local state
  const urlQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(urlQ);
  
  // Debounce the search input by 300ms
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Other filters read directly from URL
  const selectedCategory = searchParams.get("category") || "";
  const selectedUnit = searchParams.get("unit") || "";
  const inStockOnly = searchParams.get("inStock") === "true";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // API Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check if any filter is active
  const isFilterActive = !!(urlQ || selectedCategory || selectedUnit || inStockOnly);

  // Sync searchQuery input with URL search param changes (e.g. back navigation or clear filters)
  useEffect(() => {
    setSearchQuery(urlQ);
  }, [urlQ]);

  // Update URL Query Params helper
  const updateFilters = useCallback((newFilters: {
    q?: string;
    category?: string;
    unit?: string;
    inStock?: boolean;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.q !== undefined) {
      if (newFilters.q) params.set("q", newFilters.q);
      else params.delete("q");
    }

    if (newFilters.category !== undefined) {
      if (newFilters.category) params.set("category", newFilters.category);
      else params.delete("category");
    }

    if (newFilters.unit !== undefined) {
      if (newFilters.unit) params.set("unit", newFilters.unit);
      else params.delete("unit");
    }

    if (newFilters.inStock !== undefined) {
      if (newFilters.inStock) params.set("inStock", "true");
      else params.delete("inStock");
    }

    if (newFilters.page !== undefined) {
      if (newFilters.page > 1) params.set("page", newFilters.page.toString());
      else params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearch !== urlQ) {
      updateFilters({ q: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, urlQ, updateFilters]);

  // Fetch products from database
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        q: urlQ,
        category: selectedCategory,
        unit: selectedUnit,
        inStock: inStockOnly ? "true" : "false",
        page: currentPage.toString(),
        limit: "12",
      });

      const res = await fetch(`/api/products?${query.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await res.json();
      
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      setTotalPages(data.totalPages || 1);
      
      // Dynamically populate category dropdown from DB
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      toast.error(err.message || "Error searching products");
    } finally {
      setLoading(false);
    }
  }, [urlQ, selectedCategory, selectedUnit, inStockOnly, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setIsDrawerOpen(false);
    router.push(pathname); // navigate back to root path without params
  };

  // Render the filter controls
  const renderFilters = (isMobile = false) => {
    return (
      <div className={`flex ${isMobile ? "flex-col gap-5" : "flex-row flex-wrap items-center gap-4 text-sm"}`}>
        {/* Category Dropdown */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          {!isMobile && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>}
          <select
            value={selectedCategory}
            onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Dropdown */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          {!isMobile && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit type</label>}
          <select
            value={selectedUnit}
            onChange={(e) => updateFilters({ unit: e.target.value, page: 1 })}
            className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none transition-colors"
          >
            <option value="">All Units</option>
            <option value="g">g / kg</option>
            <option value="mL">mL / L</option>
            <option value="unit">unit</option>
          </select>
        </div>

        {/* In Stock Toggle */}
        <div className="flex items-center gap-3 py-2 px-2 min-w-[160px]">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => updateFilters({ inStock: e.target.checked, page: 1 })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer border border-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-primary after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary/20 peer-checked:border-primary/50"></div>
            <span className="ml-3 text-xs font-semibold text-slate-300 uppercase tracking-wider select-none">
              In Stock Only
            </span>
          </label>
        </div>

        {/* Clear Filters */}
        {isFilterActive && (
          <button
            onClick={handleClearFilters}
            className={`font-semibold text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-2.5 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-all ${
              isMobile ? "mt-4 justify-center" : "self-end"
            }`}
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Full-Width Search Input */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          placeholder="Search chemical name, SKU, category, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-primary rounded-2xl py-4 pl-12 pr-12 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-xl transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Desktop Filters Panel */}
      <div className="hidden md:block bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-lg">
        {renderFilters(false)}
      </div>

      {/* Mobile Filters Trigger */}
      <div className="md:hidden flex items-center gap-3">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex-grow bg-slate-900 border border-slate-800/80 hover:border-primary text-slate-200 font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          Filters {isFilterActive && <span className="w-2 h-2 bg-primary rounded-full" />}
        </button>
        {isFilterActive && (
          <button
            onClick={handleClearFilters}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-3 rounded-xl border border-rose-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Result Count & Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 tracking-wider uppercase font-semibold">
        <div>
          {loading ? (
            <span>Searching inventory...</span>
          ) : (
            <span>
              Showing {products.length} of {totalProducts} products
            </span>
          )}
        </div>
      </div>

      {/* 4. Products Grid */}
      {loading ? (
        // Loading State: 6 Skeleton Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800/60 p-6 rounded-2xl h-60 animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="h-5 bg-slate-800 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-slate-800 rounded w-2/3 mb-3"></div>
                <div className="h-3 bg-slate-800 rounded w-full mb-1.5"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              </div>
              <div className="pt-4 border-t border-slate-800/40 flex justify-between items-center">
                <div className="h-6 bg-slate-800 rounded w-1/4"></div>
                <div className="h-9 bg-slate-800 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        // Empty State
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center shadow-lg max-w-lg mx-auto">
          <Package className="w-16 h-16 text-slate-700 mx-auto mb-5" />
          <h4 className="text-lg font-bold text-slate-200">No products found</h4>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            No products match &quot;{urlQ || "your query"}&quot;. Try a different name, SKU, or category filter.
          </p>
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="mt-6 bg-accent hover:bg-accent/90 active:bg-accent text-white font-bold px-6 py-2.5 rounded-xl transition-all"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        // Cards Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            // Stock Level Indicators
            let stockColor = "text-success";
            let stockLabel = "In Stock";
            
            if (product.stockInBaseUnit < 10) {
              stockColor = "text-danger";
              stockLabel = "Critically Low";
            } else if (product.stockInBaseUnit >= 10 && product.stockInBaseUnit <= 100) {
              stockColor = "text-warning";
              stockLabel = "Low Stock";
            }

            return (
              <div
                key={product.id}
                className="bg-slate-900 border border-slate-800/80 hover:border-primary/40 p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:shadow-primary/[0.02] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div>
                  {/* Category and SKU Badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {product.category}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {product.baseUnit}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 select-all tracking-tight">
                      <HighlightText text={product.sku} query={urlQ} />
                    </span>
                  </div>

                  {/* Product Name */}
                  <h4 className="text-lg font-bold text-slate-100 group-hover:text-primary transition-colors">
                    <HighlightText text={product.name} query={urlQ} />
                  </h4>
                  
                  {/* Product Description */}
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 h-8 leading-relaxed">
                    {product.description || "No description provided."}
                  </p>
                </div>

                {/* Pricing, Unit and Stock */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-sm font-bold text-slate-200 font-mono">
                        Price: {formatINR(product.basePricePaise)} per {product.baseUnit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Stock</span>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-mono font-bold ${stockColor}`}>
                          {product.stockInBaseUnit.toLocaleString()} {product.baseUnit}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {stockLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Order Button */}
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    Add to Order
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => updateFilters({ page: currentPage - 1 })}
            disabled={currentPage === 1}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:text-slate-600 disabled:hover:bg-slate-900 disabled:border-slate-850 px-4 py-2 rounded-xl text-xs font-semibold disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => updateFilters({ page: currentPage + 1 })}
            disabled={currentPage === totalPages}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:text-slate-600 disabled:hover:bg-slate-900 disabled:border-slate-850 px-4 py-2 rounded-xl text-xs font-semibold disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* 6. Mobile Bottom Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Drawer Panel */}
          <div className="absolute inset-x-0 bottom-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 shadow-2xl transition-transform transform duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Filter Products
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderFilters(true)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductSearch() {
  return (
    <React.Suspense fallback={
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="mt-3 text-slate-400 text-xs font-semibold">Loading chemical catalog search...</p>
      </div>
    }>
      <ProductSearchContent />
    </React.Suspense>
  );
}
