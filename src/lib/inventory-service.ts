import { isPreBookingActive } from '@/lib/launch-engine-core';

/**
 * GODSMOVE AUTHORITATIVE CANONICAL INVENTORY SERVICE
 * Single source of truth for physical inventory, pre-booking allocation, reservations, returns, and available stock.
 * 
 * ACCOUNTING MODEL INVARIANTS:
 * 1. TOTAL PHYSICAL INVENTORY = Sum of variant.inventory.totalStock
 * 2. PRE-BOOK ALLOCATION = Configured maxPreBooking for product (0 if not pre-booking)
 * 3. PRE-BOOK RESERVED = Quantity of successful placed pre-booking orders
 * 4. ORDERS = Quantity of successful regular product sales outside/after pre-booking
 * 5. SOLD = PRE-BOOK RESERVED + ORDERS
 * 6. RETURN = Quantity of physical units returned & physically received at warehouse
 * 7. AVAILABLE = TOTAL - SOLD + RETURN
 * 8. REMAINING PRE-BOOK ALLOC = Math.max(0, PRE-BOOK ALLOCATION - PRE-BOOK RESERVED)
 */

/**
 * Helper to determine if an order represents a successfully placed order
 * that commits inventory.
 */
export function isCommittedOrder(order: any): boolean {
  if (!order) return false;
  const status = String(order.status || '').toUpperCase();
  const paymentStatus = String(order.paymentStatus || '').toUpperCase();
  const paymentMethod = String(order.paymentMethod || '').toUpperCase();

  // Cancelled or failed orders are NEVER committed
  if (status === 'CANCELLED' || paymentStatus === 'FAILED') return false;

  // Online orders (e.g. Razorpay) that are still PENDING & UNPAID before payment completion are NOT committed
  if (status === 'PENDING' && paymentStatus === 'UNPAID' && paymentMethod !== 'COD') {
    return false;
  }

  // All active non-cancelled placed orders (COD placed, zero-payable credit, paid online, confirmed/fulfillment statuses) are committed
  return true;
}

export interface ProductInventoryState {
  totalInventory: number;                  // Physical stock pool across all variants (sum of totalStock)
  preBookAllocation: number;               // Pre-booking allocation cap configured by admin
  preBookReserved: number;                 // Confirmed / placed pre-booking orders
  normalOrders: number;                    // Confirmed / placed regular orders (post-launch / non-prebooking)
  sold: number;                            // PRE-BOOK RESERVED + ORDERS (Total Committed)
  returnUnits: number;                     // Physical returned units received back at warehouse
  incomingStock: number;                   // Incoming stock en route from suppliers
  available: number;                       // AVAILABLE = TOTAL - SOLD + RETURN
  remainingPreBookingAllocation: number;   // Math.max(0, preBookAllocation - preBookReserved)
  normalLaunchAvailable: number;           // Unused pre-booking allocation + normal launch inventory = TOTAL - preBookReserved - normalOrders
  
  // Legacy aliases for backward compatibility
  totalSold: number;                       // Alias for sold
  totalReserved: number;                   // Alias for preBookReserved
  preBookingAllocation: number;            // Alias for preBookAllocation
  paidPreBookings: number;                 // Alias for preBookReserved
  remainingPhysicalInventory: number;     // Alias for available
  isPreBookingFull: boolean;               // preBookAllocation > 0 && remainingPreBookingAllocation <= 0
  isSoldOut: boolean;                      // available <= 0
  status: 'AVAILABLE' | 'PRE_BOOKING_FULL' | 'SOLD_OUT';
}

export function calculateProductInventoryState(product: any): ProductInventoryState {
  if (!product) {
    return {
      totalInventory: 0,
      preBookAllocation: 0,
      preBookReserved: 0,
      normalOrders: 0,
      sold: 0,
      returnUnits: 0,
      incomingStock: 0,
      available: 0,
      remainingPreBookingAllocation: 0,
      normalLaunchAvailable: 0,
      totalSold: 0,
      totalReserved: 0,
      preBookingAllocation: 0,
      paidPreBookings: 0,
      remainingPhysicalInventory: 0,
      isPreBookingFull: false,
      isSoldOut: true,
      status: 'SOLD_OUT',
    };
  }

  // 1. Calculate physical inventory metrics across variants
  const variants = Array.isArray(product.variants) ? product.variants : [];
  let totalInventory = 0;
  let totalSoldFromDb = 0;
  let totalReservedFromDb = 0;
  let incomingStock = 0;
  let returnUnits = 0;
  let normalOrders = 0;

  if (variants.length > 0) {
    variants.forEach((v: any) => {
      const inv = v.inventory;
      if (inv) {
        totalInventory += Number(inv.totalStock ?? 0);
        totalSoldFromDb += Number(inv.soldStock ?? 0);
        totalReservedFromDb += Number(inv.reservedStock ?? 0);
        incomingStock += Number(inv.incomingStock ?? 0);
      }

      // Sum returned units physically received back at warehouse
      if (Array.isArray(v.orderItems)) {
        v.orderItems.forEach((item: any) => {
          if (Array.isArray(item.returnItems)) {
            item.returnItems.forEach((ri: any) => {
              const reqStatus = ri.returnReq?.status;
              if (['RECEIVED', 'INSPECTION', 'REFUND_PROCESSED', 'WALLET_CREDITED', 'COMPLETED'].includes(reqStatus)) {
                returnUnits += Number(ri.quantity ?? 0);
              }
            });
          }
        });
      }
    });
  } else {
    totalInventory = Number(product.initialStock ?? product.totalStock ?? 0);
    totalSoldFromDb = Number(product.soldStock ?? 0);
    totalReservedFromDb = Number(product.reservedStock ?? 0);
    incomingStock = Number(product.incomingStock ?? 0);
    returnUnits = Number(product.returnUnits ?? 0);
  }

  // 2. Pre-Booking vs Normal Orders Breakdown
  const isPreBookingConfigured = Boolean(product.isPreBooking);
  const rawMaxPreBooking = product.maxPreBooking != null ? Number(product.maxPreBooking) : null;
  
  let calculatedPreBookReserved = 0;
  let calculatedNormalOrders = 0;
  let hasCalculatedOrderItems = false;

  if (variants.length > 0) {
    variants.forEach((v: any) => {
      if (Array.isArray(v.orderItems)) {
        v.orderItems.forEach((item: any) => {
          const o = item.order;
          if (o && isCommittedOrder(o)) {
            hasCalculatedOrderItems = true;
            const isPb = Boolean(o.isPreBooking || o.orderType === 'PRE_BOOKING');
            if (isPb) {
              calculatedPreBookReserved += Number(item.quantity ?? 1);
            } else {
              calculatedNormalOrders += Number(item.quantity ?? 1);
            }
          }
        });
      }
    });
  }

  // Canonical PRE-BOOK RESERVED formula:
  const preBookReserved = hasCalculatedOrderItems
    ? calculatedPreBookReserved
    : Number(product.currentPreBookings ?? 0);

  let preBookAllocation = 0;
  if (isPreBookingConfigured) {
    if (rawMaxPreBooking != null && rawMaxPreBooking > 0) {
      preBookAllocation = Math.min(rawMaxPreBooking, totalInventory > 0 ? totalInventory : rawMaxPreBooking);
    } else {
      preBookAllocation = totalInventory;
    }
  } else if (rawMaxPreBooking != null && rawMaxPreBooking > 0) {
    preBookAllocation = Math.min(rawMaxPreBooking, totalInventory > 0 ? totalInventory : rawMaxPreBooking);
  }

  // Normal / regular orders
  normalOrders = hasCalculatedOrderItems
    ? calculatedNormalOrders
    : Math.max(0, (totalSoldFromDb + totalReservedFromDb) - preBookReserved);

  if (product.normalOrdersCount != null) {
    normalOrders = Number(product.normalOrdersCount);
  }

  // Canonical Sold formula: SOLD = PRE-BOOK RESERVED + ORDERS
  const sold = preBookReserved + normalOrders;

  // Canonical Available formula: AVAILABLE = TOTAL - SOLD + RETURN
  const available = Math.max(0, totalInventory - sold + returnUnits);

  const remainingPreBookingAllocation = isPreBookingConfigured || preBookAllocation > 0
    ? Math.max(0, preBookAllocation - preBookReserved)
    : 0;

  // At launch, unused pre-booking allocation becomes normal launch inventory
  const normalLaunchAvailable = Math.max(0, totalInventory - preBookReserved - normalOrders + returnUnits);

  const activePb = isPreBookingActive(product);
  const isPreBookingFull = activePb && preBookAllocation > 0 && remainingPreBookingAllocation <= 0;
  const isSoldOut = available <= 0;

  let status: 'AVAILABLE' | 'PRE_BOOKING_FULL' | 'SOLD_OUT' = 'AVAILABLE';
  if (isSoldOut) {
    status = 'SOLD_OUT';
  } else if (isPreBookingFull) {
    status = 'PRE_BOOKING_FULL';
  }

  return {
    totalInventory,
    preBookAllocation,
    preBookReserved,
    normalOrders,
    sold,
    returnUnits,
    incomingStock,
    available,
    remainingPreBookingAllocation,
    normalLaunchAvailable,
    totalSold: sold,
    totalReserved: preBookReserved,
    preBookingAllocation: preBookAllocation,
    paidPreBookings: preBookReserved,
    remainingPhysicalInventory: available,
    isPreBookingFull,
    isSoldOut,
    status,
  };
}

export interface StorefrontInventoryDisplay {
  isPreBookingActive: boolean;            // Product is in active pre-booking phase
  numerator: number;                     // Displayed numerator (preBookReserved when pre-booking, sold when normal)
  denominator: number;                   // Displayed denominator (preBookAllocation when pre-booking, totalInventory when normal)
  remaining: number;                     // Remaining allocation (if pre-booking) or remaining physical stock (if normal)
  formattedText: string;                 // e.g. "4 / 30 PRE-BOOKED" or "7 / 100 SOLD"
  badgeText: string;                     // e.g. "PRE-BOOKING ALLOCATION" or "EXCLUSIVE RACK ALLOCATION"
  allocationLabel: string;               // e.g. "RESERVED" or "COMMITTED" / "SOLD"
  isAllocationFull: boolean;             // preBookAllocation > 0 && remaining <= 0
  isSoldOut: boolean;                      // physical available <= 0
}

export function getStorefrontInventoryDisplay(product: any): StorefrontInventoryDisplay {
  const invState = calculateProductInventoryState(product);
  
  // Active pre-booking check using time-derived launch engine rule
  const activePreBooking = isPreBookingActive(product);
  const isExclusiveRack = Boolean(
    product?.isExclusiveRack ||
    product?.destination === 'EXCLUSIVE_RACK' ||
    product?.channel === 'EXCLUSIVE_RACK'
  );

  if (activePreBooking) {
    const numerator = invState.preBookReserved;
    const denominator = invState.preBookAllocation > 0 ? invState.preBookAllocation : (invState.totalInventory > 0 ? invState.totalInventory : 30);
    const remaining = Math.max(0, denominator - numerator);
    const isAllocationFull = denominator > 0 && remaining <= 0;
    const isSoldOut = invState.available <= 0;

    return {
      isPreBookingActive: true,
      numerator,
      denominator,
      remaining,
      formattedText: `${numerator} / ${denominator} PRE-BOOKED`,
      badgeText: 'PRE-BOOKING ALLOCATION',
      allocationLabel: 'RESERVED',
      isAllocationFull,
      isSoldOut,
    };
  }

  // Normal / Launched Product Display
  const numerator = invState.sold;
  const denominator = invState.totalInventory > 0 ? invState.totalInventory : 100;
  const remaining = invState.available;
  const isSoldOut = invState.available <= 0;

  return {
    isPreBookingActive: false,
    numerator,
    denominator,
    remaining,
    formattedText: isExclusiveRack ? `${numerator} / ${denominator} COMMITTED` : `${numerator} / ${denominator} SOLD`,
    badgeText: isExclusiveRack ? 'EXCLUSIVE RACK ALLOCATION' : 'LIMITED EDITION',
    allocationLabel: isExclusiveRack ? 'COMMITTED' : 'SOLD',
    isAllocationFull: false,
    isSoldOut,
  };
}

