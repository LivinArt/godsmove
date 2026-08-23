/**
 * CustomerSegmentService — Reusable CRM Segmentation and Combinable Filtering Engine
 */

export interface CustomerRecord {
  id: string;
  email: string;
  godsmoveId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string; // ISO string
  ordersCount: number;
  lifetimeSpend: number;
  walletBalance: number;
  emailConfirmed: boolean;
  lastLogin: string | null; // ISO string
  loginMethod: string;
  isBlocked: boolean;
  dob: string | null; // ISO string (Date of Birth)
  tier: string; // STANDARD, VIP, INNER_CIRCLE
  lastPurchaseDate: string | null; // ISO string
  isMemberActive?: boolean;
  earlyAccessRegistered?: boolean;
  earlyAccessRegisteredAt?: string | null;
  earlyAccessBenefitsEligible?: boolean;
  membership?: {
    id: string;
    status: string;
    source: string;
    activatedAt: string | Date | null;
    expiresAt: string | Date | null;
  } | null;
}

export const CustomerSegmentService = {
  /**
   * Filter customer list based on multiple active combinable filter tags/checkboxes.
   */
  filterCustomers(
    customers: CustomerRecord[],
    activeFilters: string[],
    customDateRange?: { start?: string | null; end?: string | null }
  ): CustomerRecord[] {
    if (activeFilters.length === 0 || activeFilters.includes('ALL')) {
      // If "All Customers" is selected and no other combinable filters are active, or if nothing is checked
      if (!customDateRange?.start && !customDateRange?.end) {
        return customers;
      }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find start/end of this week (Sunday to Saturday)
    const sunday = new Date(startOfToday);
    sunday.setDate(startOfToday.getDate() - startOfToday.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return customers.filter((customer) => {
      const customerCreated = new Date(customer.createdAt);
      // Evaluate each active filter. If any active filter returns false, the customer is excluded (AND logic).
      for (const filter of activeFilters) {
        if (filter === 'ALL') continue;

        // 1. Registered Today
        if (filter === 'REGISTERED_TODAY') {
          if (customerCreated < startOfToday) return false;
        }

        // 2. Registered This Week
        if (filter === 'REGISTERED_THIS_WEEK') {
          if (customerCreated < sunday || customerCreated > saturday) return false;
        }

        // 3. Registered This Month
        if (filter === 'REGISTERED_THIS_MONTH') {
          if (customerCreated < startOfThisMonth) return false;
        }

        // 4. New Customers (registered in last 30 days)
        if (filter === 'NEW_CUSTOMERS') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (customerCreated < thirtyDaysAgo) return false;
        }

        // 5. First Purchase Customers (exactly 1 paid order)
        if (filter === 'FIRST_PURCHASE') {
          if (customer.ordersCount !== 1) return false;
        }

        // 6. Repeat Customers (2 or more paid orders)
        if (filter === 'REPEAT_CUSTOMERS') {
          if (customer.ordersCount < 2) return false;
        }

        // 7. High Value Customers (lifetimeSpend >= 10,000)
        if (filter === 'HIGH_VALUE') {
          if (customer.lifetimeSpend < 10000) return false;
        }

        // 8. VIP Customers (tier VIP or INNER_CIRCLE)
        if (filter === 'VIP') {
          if (customer.tier !== 'VIP' && customer.tier !== 'INNER_CIRCLE') return false;
        }

        // 9. No Orders (ordersCount === 0)
        if (filter === 'NO_ORDERS') {
          if (customer.ordersCount > 0) return false;
        }

        // 10. Inactive Customers (no login in last 30 days, or lastLogin null)
        if (filter === 'INACTIVE') {
          if (!customer.lastLogin) return false;
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (new Date(customer.lastLogin) >= thirtyDaysAgo) return false;
        }

        // 11. Birthday Today
        if (filter === 'BIRTHDAY_TODAY') {
          if (!customer.dob) return false;
          const bday = new Date(customer.dob);
          if (bday.getDate() !== now.getDate() || bday.getMonth() !== now.getMonth()) return false;
        }

        // 12. Birthday This Week
        if (filter === 'BIRTHDAY_THIS_WEEK') {
          if (!customer.dob) return false;
          const bday = new Date(customer.dob);
          const currentYear = now.getFullYear();
          
          // Construct birthday in current year, previous year, and next year to handle week crossovers
          const datesToCheck = [
            new Date(currentYear, bday.getMonth(), bday.getDate()),
            new Date(currentYear - 1, bday.getMonth(), bday.getDate()),
            new Date(currentYear + 1, bday.getMonth(), bday.getDate()),
          ];

          const inWeek = datesToCheck.some(d => d >= sunday && d <= saturday);
          if (!inWeek) return false;
        }

        // 13. Birthday This Month
        if (filter === 'BIRTHDAY_THIS_MONTH') {
          if (!customer.dob) return false;
          const bday = new Date(customer.dob);
          if (bday.getMonth() !== now.getMonth()) return false;
        }

        // 14. Wallet Balance > 0
        if (filter === 'WALLET_BALANCE_GT_0') {
          if (customer.walletBalance <= 0) return false;
        }

        // 15. GODSMOVE Credits Available (Alias for balance > 0)
        if (filter === 'CREDITS_AVAILABLE') {
          if (customer.walletBalance <= 0) return false;
        }

        // 16. Recently Purchased (order placed in last 7 days)
        if (filter === 'RECENTLY_PURCHASED') {
          if (!customer.lastPurchaseDate) return false;
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (new Date(customer.lastPurchaseDate) < sevenDaysAgo) return false;
        }

        // 17. Early Access Registered Users
        if (filter === 'EARLY_ACCESS') {
          if (!customer.earlyAccessRegistered) return false;
        }

        // 18. Non-Early Access Users
        if (filter === 'NON_EARLY_ACCESS') {
          if (customer.earlyAccessRegistered) return false;
        }
      }

      // 17. Custom Date Range (Joined date filter)
      if (customDateRange?.start) {
        const start = new Date(customDateRange.start);
        if (customerCreated < start) return false;
      }
      if (customDateRange?.end) {
        const end = new Date(customDateRange.end);
        end.setHours(23, 59, 59, 999);
        if (customerCreated > end) return false;
      }

      return true;
    });
  }
};
