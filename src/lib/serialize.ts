export function serializeProduct(product: any) {
  if (!product) return null;
  return {
    ...product,
    basePricePaise: product.basePricePaise.toString(),
    stockInBaseUnit: Number(product.stockInBaseUnit),
  };
}

export function serializeOrder(order: any) {
  if (!order) return null;
  return {
    ...order,
    totalPricePaise: order.totalPricePaise.toString(),
    user: order.user ? {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
    } : undefined,
    items: order.items ? order.items.map((item: any) => ({
      ...item,
      orderedQuantity: Number(item.orderedQuantity),
      quantityInBaseUnit: Number(item.quantityInBaseUnit),
      unitPricePaise: item.unitPricePaise.toString(),
      lineTotalPaise: item.lineTotalPaise.toString(),
      product: item.product ? serializeProduct(item.product) : undefined,
    })) : undefined,
  };
}
