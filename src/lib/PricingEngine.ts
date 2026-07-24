export interface PricingSplits {
  sellingPrice: number;
  costPrice: number;
  gstRate: number;
  gstAmount: number;
  taxableValue: number;
  netRevenue: number;
  profit: number;
  margin: number;
  markup: number;
}

export function calculatePricing(sellingPrice: number, costPrice: number, gstRate: number): PricingSplits {
  const sp = Number(sellingPrice) || 0;
  const cp = Number(costPrice) || 0;
  const rate = Number(gstRate) || 0;

  // Assuming sellingPrice is GST inclusive
  // Taxable Value (Net Price) = Selling Price / (1 + GST % / 100)
  const taxableValue = sp / (1 + rate / 100);
  const gstAmount = sp - taxableValue;
  const netRevenue = taxableValue;
  
  // Profit = Taxable Value - Cost Price
  const profit = netRevenue - cp;
  
  // Margin = (Profit / Net Revenue) * 100
  const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;
  
  // Markup = (Profit / Cost Price) * 100
  const markup = cp > 0 ? (profit / cp) * 100 : 0;

  return {
    sellingPrice: sp,
    costPrice: cp,
    gstRate: rate,
    gstAmount: Number(gstAmount.toFixed(2)),
    taxableValue: Number(taxableValue.toFixed(2)),
    netRevenue: Number(netRevenue.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    margin: Number(margin.toFixed(1)),
    markup: Number(markup.toFixed(1)),
  };
}
