"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Beaker } from "lucide-react";
import Link from "next/link";
import { formatINR, Unit } from "@/lib/units";
import QuantitySelector from "@/components/QuantitySelector";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  baseUnit: Unit;
  basePricePaise: string;
  stockInBaseUnit: number;
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        throw new Error("Product not found");
      }
      const data = await res.json();
      setProduct(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load product details");
      router.push("/dashboard/products");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = (qty: number, unit: Unit, totalPaise: number) => {
    if (!product) return;

    try {
      const existingCartRaw = localStorage.getItem("medchem_cart");
      let cart = existingCartRaw ? JSON.parse(existingCartRaw) : [];

      if (!Array.isArray(cart)) {
        cart = [];
      }

      // Check if product with same unit is already in cart
      const existingIndex = cart.findIndex(
        (item: any) => item.productId === product.id && item.orderedUnit === unit
      );

      if (existingIndex > -1) {
        cart[existingIndex].orderedQuantity = Number(cart[existingIndex].orderedQuantity) + qty;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          baseUnit: product.baseUnit,
          basePricePaise: product.basePricePaise,
          orderedQuantity: qty,
          orderedUnit: unit,
        });
      }

      localStorage.setItem("medchem_cart", JSON.stringify(cart));
      toast.success(`${product.name} (${qty} ${unit}) added to cart!`);
      router.push("/dashboard/products");
    } catch (err: any) {
      toast.error("Failed to add item to cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-2 text-slate-400 text-sm">Loading product specifications...</p>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Product specs card */}
        <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-2xl md:col-span-3 space-y-6 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                {product.category}
              </span>
              <span className="text-xs font-mono text-slate-500 select-all tracking-tight">
                SKU: {product.sku}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">{product.name}</h3>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Description</h5>
            <p className="text-sm text-slate-350 leading-relaxed bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl">
              {product.description || "No description specified for this product."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-800/60">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Unit Storage</p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-slate-950 text-sm font-semibold border border-slate-800">
                <Beaker className="w-4 h-4 text-primary" />
                {product.baseUnit}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Stock</p>
              <p className="text-lg font-bold font-mono text-slate-200 mt-1">
                {product.stockInBaseUnit.toLocaleString()} {product.baseUnit}
              </p>
            </div>
          </div>
        </div>

        {/* Quantity selector / Cart controls card */}
        <div className="md:col-span-2">
          <QuantitySelector product={product} onAdd={handleAddToCart} />
        </div>
      </div>
    </div>
  );
}
