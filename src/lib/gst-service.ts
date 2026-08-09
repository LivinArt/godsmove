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
   * Determine GST rate based on configured product rate or fallback to standard apparel tier.
   */
  getGstRate(netUnitPrice: number, configuredPercentage?: number | null): number {
    if (configuredPercentage != null && configuredPercentage > 0) {
      return configuredPercentage / 100;
    }
    return netUnitPrice <= 1000 ? 0.05 : 0.12;
  },

  /**
   * Calculate inclusive GST from net paid value for an item.
   * inclusiveGst = netValue - (netValue / (1 + rate))
   */
  calculateInclusiveItemGst(
    netLineValue: number,
    quantity: number,
    shippingState: string,
    configuredGstPercentage?: number | null
  ): GstSplit {
    const netUnitPrice = quantity > 0 ? netLineValue / quantity : netLineValue;
    const rate = this.getGstRate(netUnitPrice, configuredGstPercentage);
    
    const taxableAmount = Math.round((netLineValue / (1 + rate)) * 100) / 100;
    const gstAmount = Math.round((netLineValue - taxableAmount) * 100) / 100;

    const isLocal = shippingState.trim().toUpperCase() === COMPANY_STATE;

    return {
      taxableAmount,
      gstAmount,
      cgst: isLocal ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      sgst: isLocal ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      igst: isLocal ? 0 : gstAmount,
      rate,
    };
  },

  /**
   * Calculate GST split for shipping costs.
   */
  calculateInclusiveShippingGst(shippingCost: number, shippingState: string): GstSplit {
    const rate = 0.18;
    const taxableAmount = Math.round((shippingCost / (1 + rate)) * 100) / 100;
    const gstAmount = Math.round((shippingCost - taxableAmount) * 100) / 100;
    
    const isLocal = shippingState.trim().toUpperCase() === COMPANY_STATE;

    return {
      taxableAmount,
      gstAmount,
      cgst: isLocal ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      sgst: isLocal ? Math.round((gstAmount / 2) * 100) / 100 : 0,
      igst: isLocal ? 0 : gstAmount,
      rate,
    };
  }
};
