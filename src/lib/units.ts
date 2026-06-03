export type Unit = 'g' | 'kg' | 'mL' | 'L' | 'unit';

export const BASE_UNIT: Record<string, 'g' | 'mL' | 'unit'> = {
  g: 'g', kg: 'g',
  mL: 'mL', L: 'mL',
  unit: 'unit',
};

// All factors convert TO the base unit
export const TO_BASE_FACTOR: Record<Unit, number> = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  unit: 1,
};

export const COMPATIBLE_UNITS: Record<string, Unit[]> = {
  g:    ['g', 'kg'],
  kg:   ['g', 'kg'],
  mL:   ['mL', 'L'],
  L:    ['mL', 'L'],
  unit: ['unit'],
};

export function toBase(qty: number, fromUnit: Unit): number {
  return qty * TO_BASE_FACTOR[fromUnit];
}

export function fromBase(qty: number, toUnit: Unit): number {
  return qty / TO_BASE_FACTOR[toUnit];
}

export function calcLineTotal(
  qty: number,
  fromUnit: Unit,
  pricePerBasePaise: number
): number {
  // Returns total in paise
  return toBase(qty, fromUnit) * pricePerBasePaise;
}

export function formatINR(paise: number | bigint | string): string {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
}

// ==========================================
// Compatibility Aliases for the rest of the app
// ==========================================
export function convertToBase(quantity: number, fromUnit: string, baseUnit: string): number {
  return toBase(quantity, fromUnit as Unit);
}

export function convertFromBase(quantity: number, baseUnit: string, toUnit: string): number {
  return fromBase(quantity, toUnit as Unit);
}

export function getCompatibleUnits(baseUnit: string): string[] {
  return COMPATIBLE_UNITS[baseUnit] || [];
}

export function calculateLineTotal(
  quantity: number,
  fromUnit: string,
  product: { baseUnit: string; basePricePaise: number | bigint | string }
): number {
  return calcLineTotal(quantity, fromUnit as Unit, Number(product.basePricePaise));
}

export function formatRupees(paise: number | bigint | string): string {
  return formatINR(paise);
}
