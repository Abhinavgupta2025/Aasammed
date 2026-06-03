"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Edit2, Trash2, X, Beaker, Check, HelpCircle, Loader2 } from "lucide-react";
import { formatRupees } from "@/lib/units";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  baseUnit: string;
  basePricePaise: string; // From API it comes as a string representing BigInt
  stockInBaseUnit: number;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [baseUnit, setBaseUnit] = useState("g");
  const [priceInRupees, setPriceInRupees] = useState("");
  const [stockInBaseUnit, setStockInBaseUnit] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete Confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      toast.error(error.message || "Failed to load products");
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

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName("");
    setSku("");
    setDescription("");
    setCategory("Reagents");
    setBaseUnit("g");
    setPriceInRupees("");
    setStockInBaseUnit("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku);
    setDescription(product.description || "");
    setCategory(product.category);
    setBaseUnit(product.baseUnit);
    // Convert paise to rupees for input
    setPriceInRupees((Number(product.basePricePaise) / 100).toFixed(2));
    setStockInBaseUnit(product.stockInBaseUnit.toString());
    setIsActive(product.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || !category || !baseUnit || !priceInRupees || !stockInBaseUnit) {
      toast.error("Please fill in all required fields");
      return;
    }

    const priceRupeesVal = parseFloat(priceInRupees);
    const stockVal = parseFloat(stockInBaseUnit);

    if (isNaN(priceRupeesVal) || priceRupeesVal < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (isNaN(stockVal) || stockVal < 0) {
      toast.error("Please enter a valid stock value");
      return;
    }

    // Convert price to paise
    const basePricePaise = Math.round(priceRupeesVal * 100);

    setSubmitting(true);
    const loadingToast = toast.loading("Saving product specifications...");

    try {
      const payload = {
        name,
        sku,
        description,
        category,
        baseUnit,
        basePricePaise,
        stockInBaseUnit: stockVal,
        isActive,
      };

      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      toast.dismiss(loadingToast);
      toast.success(editingId ? "Product updated successfully!" : "Product created successfully!");
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    const loadingToast = toast.loading("Deleting product...");
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      toast.dismiss(loadingToast);
      toast.success("Product deleted successfully");
      setDeleteConfirmId(null);
      fetchProducts();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Could not delete product");
      setDeleteConfirmId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-100 font-bold rounded-xl py-2.5 px-5 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          Add Chemical Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="mt-3 text-slate-450 text-sm">Fetching catalog inventories...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <Beaker className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <h4 className="text-slate-350 font-bold">No Products Found</h4>
            <p className="text-slate-550 text-sm mt-1">Add items or update search queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-450 uppercase tracking-wider bg-slate-900/50">
                  <th className="py-3.5 px-5">Chemical Info</th>
                  <th className="py-3.5 px-5">SKU</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5 text-right">Base Unit Price</th>
                  <th className="py-3.5 px-5 text-right">Stock</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-850/20 transition-colors">
                    {/* Name & Desc */}
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-bold text-slate-200">{product.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]" title={product.description}>
                          {product.description || "No description provided."}
                        </p>
                      </div>
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
                    {/* Base unit price */}
                    <td className="py-4 px-5 text-right font-mono font-semibold text-slate-250">
                      {formatRupees(product.basePricePaise)}
                      <span className="text-[10px] text-slate-500 font-normal">/{product.baseUnit}</span>
                    </td>
                    {/* Stock level */}
                    <td className="py-4 px-5 text-right font-mono font-medium">
                      {product.stockInBaseUnit}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">{product.baseUnit}</span>
                    </td>
                    {/* Active State */}
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                        product.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-950 text-slate-500 border-slate-850"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right">
                      {deleteConfirmId === product.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-all active:scale-95"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-lg px-2.5 py-1 text-xs transition-all active:scale-95 border border-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-950/80 transition-all active:scale-95"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-950/80 transition-all active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 sticky top-0 rounded-t-2xl z-10 backdrop-blur-md">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Beaker className="w-5 h-5 text-amber-400" />
                {editingId ? "Modify Product Specifications" : "Add Chemical Specification"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Chemical Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Sodium Bicarbonate"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Product SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="REA-NaHCO3-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  />
                </div>

                {/* Category selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Chemical Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="Reagents">Reagents</option>
                    <option value="Solvents">Solvents</option>
                    <option value="Lab Supplies">Lab Supplies</option>
                  </select>
                </div>

                {/* Base Unit selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Base Storage Unit *
                  </label>
                  <select
                    value={baseUnit}
                    onChange={(e) => setBaseUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="L">Liters (L)</option>
                    <option value="mL">Milliliters (mL)</option>
                    <option value="unit">Individual Units (unit)</option>
                  </select>
                </div>

                {/* Base Price in Rupees */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Base Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="E.g., 0.50"
                    value={priceInRupees}
                    onChange={(e) => setPriceInRupees(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  />
                </div>

                {/* Stock In Base Unit */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Stock in Base Unit *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="E.g., 1000"
                    value={stockInBaseUnit}
                    onChange={(e) => setStockInBaseUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Product Description (Optional)
                  </label>
                  <textarea
                    placeholder="Specify chemical grade, properties, thermal safety guidelines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none h-20 resize-none"
                  />
                </div>

                {/* Is Active Checkbox */}
                <div className="col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 bg-slate-950 border border-slate-800 focus:ring-amber-500 rounded text-amber-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none cursor-pointer">
                    Publish Active in Catalog (Visible to Sellers)
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-6 border-t border-slate-800/80 flex justify-end gap-3 sticky bottom-0 bg-slate-900 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-450 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold active:scale-95 transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-100 font-bold rounded-xl py-2.5 px-5 text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
