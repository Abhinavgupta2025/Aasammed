"use client";

import React, { useState, useEffect } from "react";
import {
  Unit,
  toBase,
  fromBase,
  calcLineTotal,
  formatINR,
  COMPATIBLE_UNITS,
  TO_BASE_FACTOR,
} from "@/lib/units";
import { AlertCircle, ShoppingCart } from "lucide-react";

interface QuantitySelectorProps {
  product: {
    base_unit?: Unit;
    baseUnit?: Unit;
    base_price_paise?: number | bigint | string;
    basePricePaise?: number | bigint | string;
    stock_in_base_unit?: number;
    stockInBaseUnit?: number;
    name: string;
  };
  onAdd: (qty: number, unit: Unit, totalPaise: number) => void;
}

export default function QuantitySelector({ product, onAdd }: QuantitySelectorProps) {
  // Normalize parameters to support both camelCase (db) and snake_case (prompt specs)
  const baseUnit = (product.base_unit || product.baseUnit || "unit") as Unit;
  const basePricePaise = Number(product.base_price_paise || product.basePricePaise || 0);
  const stockInBaseUnit = Number(
    product.stock_in_base_unit !== undefined
      ? product.stock_in_base_unit
      : product.stockInBaseUnit !== undefined
      ? product.stockInBaseUnit
      : 0
  );

  // States
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [selectedUnit, setSelectedUnit] = useState<Unit>(baseUnit);

  // Compatible units list
  const compatibleUnits = COMPATIBLE_UNITS[baseUnit] || [baseUnit];

  // Sync unit when baseUnit changes
  useEffect(() => {
    setSelectedUnit(baseUnit);
  }, [baseUnit]);

  // Derived Calculations
  const qty = parseFloat(quantityInput);
  const isValidQty = !isNaN(qty) && qty > 0;
  
  const qtyInBase = isValidQty ? toBase(qty, selectedUnit) : 0;
  const isInsufficientStock = qtyInBase > stockInBaseUnit;
  
  const lineTotalPaise = isValidQty ? calcLineTotal(qty, selectedUnit, basePricePaise) : 0;

  // Stock representation in selected unit
  const stockInSelectedUnit = fromBase(stockInBaseUnit, selectedUnit);

  const handleAdd = () => {
    if (!isValidQty || isInsufficientStock) return;
    onAdd(qty, selectedUnit, lineTotalPaise);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 text-slate-300">
      <div>
        <label htmlFor="quantity" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Quantity
        </label>
        
        <div className="flex gap-3">
          <input
            id="quantity"
            type="number"
            min="0"
            step="any"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-3 px-4 font-semibold font-mono text-slate-200 focus:outline-none transition-colors"
          />
          
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value as Unit)}
            className="bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-3 px-4 font-semibold text-slate-200 focus:outline-none transition-colors"
          >
            {compatibleUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conversion Breakdown Box */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-2">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1">
          Conversion Breakdown
        </span>
        
        {isValidQty ? (
          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <div>
              {qty} {selectedUnit} × {TO_BASE_FACTOR[selectedUnit].toLocaleString()} = {qtyInBase.toLocaleString()} {baseUnit}
            </div>
            <div>
              Rate: {formatINR(basePricePaise)} per {baseUnit}
            </div>
            <div className="border-t border-slate-800/80 my-2 pt-2">
              <div className="flex justify-between items-baseline font-sans text-sm">
                <span className="text-slate-400">Total:</span>
                <span className="text-lg font-bold font-mono text-primary">
                  {formatINR(lineTotalPaise)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-2">
            Enter a valid quantity to view breakdown.
          </div>
        )}
      </div>

      {/* Stock level information */}
      <div className="text-xs flex flex-col gap-1">
        <span className="text-slate-400 font-medium">
          Stock: {stockInBaseUnit.toLocaleString()} {baseUnit} available (= {stockInSelectedUnit.toLocaleString()} {selectedUnit})
        </span>
        
        {isInsufficientStock && (
          <div className="flex items-center gap-1.5 text-danger font-semibold mt-1 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Insufficient stock</span>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={!isValidQty || isInsufficientStock}
        className="w-full bg-primary hover:bg-primary/90 active:bg-primary/95 disabled:bg-slate-800 text-white disabled:text-slate-400 font-bold py-3.5 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:cursor-not-allowed transition-all"
      >
        <ShoppingCart className="w-5 h-5" />
        Add to Cart
      </button>
    </div>
  );
}
