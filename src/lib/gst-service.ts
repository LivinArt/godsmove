/**
 * GSTService — Dynamic Indian GST Calculator
 * Compliant with Indian invoicing standards for apparel.
 * Company state: Haryana (Intra-state if customer shipping is in Haryana, else Inter-state).
 */

export interface GstSplit {
  taxableAmount: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  rate: number;
}

export const COMPANY_STATE = 'HARYANA';

export const GSTService = {
  /**
   * Determine GST rate based on net transaction value.
   * Standard apparel rates:
   * - 5% if net price <= ₹1,000
   * - 12% if net price > ₹1,000
   */
  getGstRate(netUnitPrice: number): number {
    return netUnitPrice <= 1000 ? 0.05 : 0.12;
  },

  /**
   * Calculate inclusive GST from net paid value for an item.
   * inclusiveGst = netValue - (netValue / (1 + rate))
   */
  calculateInclusiveItemGst(netLineValue: number, quantity: number, shippingState: string): GstSplit {
    const netUnitPrice = netLineValue / quantity;
    const rate = this.getGstRate(netUnitPrice);
    
    const taxableAmount = netLineValue / (1 + rate);
    const gstAmount = netLineValue - taxableAmount;

    const isLocal = shippingState.trim().toUpperCase() === COMPANY_STATE;

    return {
      taxableAmount,
      gstAmount,
      cgst: isLocal ? gstAmount / 2 : 0,
      sgst: isLocal ? gstAmount / 2 : 0,
      igst: isLocal ? 0 : gstAmount,
      rate,
    };
  },

  /**
   * Calculate GST split for shipping costs.
   * Standard service tax / transport tax is 18% inclusive (or we can use standard 18%).
   * Let's apply 18% inclusive GST for shipping services.
   */
  calculateInclusiveShippingGst(shippingCost: number, shippingState: string): GstSplit {
    const rate = 0.18;
    const taxableAmount = shippingCost / (1 + rate);
    const gstAmount = shippingCost - taxableAmount;
    
    const isLocal = shippingState.trim().toUpperCase() === COMPANY_STATE;

    return {
      taxableAmount,
      gstAmount,
      cgst: isLocal ? gstAmount / 2 : 0,
      sgst: isLocal ? gstAmount / 2 : 0,
      igst: isLocal ? 0 : gstAmount,
      rate,
    };
  }
};
