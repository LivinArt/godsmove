'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/admin-auth';
import { calculateProductInventoryState } from '@/lib/inventory-service';

export async function getAdminPreBookingsData() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email || !isSuperAdminEmail(user.email)) {
      return { success: false, error: 'Unauthorized admin access' };
    }

    const now = new Date();

    // Fetch all products configured for pre-booking (active, historical, or scheduled)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { isPreBooking: true },
          { maxPreBooking: { not: null } },
          { preBookingOpenDateTime: { not: null } },
        ],
      },
      include: {
        category: true,
        variants: {
          include: {
            inventory: true,
          },
        },
        _count: {
          select: {
            interests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all pre-booking orders
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderType: 'PRE_BOOKING' },
          { isPreBooking: true },
        ],
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            godsmoveId: true,
          },
        },
        items: {
          include: {
            variant: {
              select: {
                productId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate aggregated KPI metrics based strictly on PAID confirmed orders
    const paidPreBookingOrders = orders.filter(o => o.paymentStatus === 'PAID');
    const totalActivePreBookings = paidPreBookingOrders.length;
    const totalReservedVolume = paidPreBookingOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalUnitsRingFenced = paidPreBookingOrders.reduce((sum, o) => {
      return sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 1), 0);
    }, 0);

    const totalInterestCount = products.reduce((sum, p) => sum + (p._count?.interests || 0), 0);
    const conversionRate = totalInterestCount > 0 ? Math.round((totalActivePreBookings / totalInterestCount) * 100) : 100;

    const formattedProducts = products.map(p => {
      const launchTime = p.launchDateTime ? new Date(p.launchDateTime) : null;
      const openTime = p.preBookingOpenDateTime ? new Date(p.preBookingOpenDateTime) : null;
      const invState = calculateProductInventoryState(p);
      const maxLimit = invState.preBookingAllocation;
      const currentBooked = invState.paidPreBookings;

      let computedStatus: 'UPCOMING' | 'OPEN' | 'SOLD_OUT' | 'CLOSED' | 'LAUNCHED' = 'CLOSED';

      if (launchTime && launchTime <= now) {
        computedStatus = 'LAUNCHED';
      } else if (openTime && openTime > now) {
        computedStatus = 'UPCOMING';
      } else if (p.isPreBooking) {
        if (maxLimit > 0 && currentBooked >= maxLimit) {
          computedStatus = 'SOLD_OUT';
        } else {
          computedStatus = 'OPEN';
        }
      } else {
        computedStatus = 'CLOSED';
      }

      const totalInventory = p.variants.reduce((acc, v) => acc + (v.inventory?.totalStock || 0), 0);
      const soldInventory = p.variants.reduce((acc, v) => acc + (v.inventory?.soldStock || 0), 0);
      const reservedInventory = p.variants.reduce((acc, v) => acc + (v.inventory?.reservedStock || 0), 0);
      const remainingInventory = Math.max(0, totalInventory - soldInventory - reservedInventory);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        channel: p.channel,
        frontImageUrl: p.frontImageUrl,
        price: p.variants?.[0]?.price ? Number(p.variants[0].price) : 0,
        preBookingExpectedDispatch: p.customExpectedDispatch || p.expectedDispatch || 'Within 24 Hours of Launch',
        launchDateTime: p.launchDateTime ? p.launchDateTime.toISOString() : null,
        preBookingOpenDateTime: p.preBookingOpenDateTime ? p.preBookingOpenDateTime.toISOString() : null,
        maxPreBooking: maxLimit,
        currentPreBookings: currentBooked,
        remainingAllocation: Math.max(0, maxLimit - currentBooked),
        remainingInventory,
        interestCount: p._count?.interests || 0,
        isPreBookingOpen: p.isPreBooking,
        computedStatus,
        categoryName: p.category?.name || 'Collection',
      };
    });

    const formattedOrders = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt.toISOString(),
      customerName: o.profile ? `${o.profile.firstName || ''} ${o.profile.lastName || ''}`.trim() : o.email,
      email: o.email,
      total: Number(o.total || 0),
      status: o.status,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentMethod: o.paymentMethod,
      isPaid: o.paymentStatus === 'PAID',
      items: o.items.map(i => ({
        id: i.id,
        productId: i.variant?.productId || i.variantId,
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        price: Number(i.price),
      })),
    }));

    return {
      success: true,
      metrics: {
        totalActivePreBookings,
        totalReservedVolume,
        totalUnitsRingFenced,
        conversionRate,
        totalInterestCount,
        openReleasesCount: formattedProducts.filter(p => p.computedStatus === 'OPEN').length,
        upcomingReleasesCount: formattedProducts.filter(p => p.computedStatus === 'UPCOMING').length,
        launchedReleasesCount: formattedProducts.filter(p => p.computedStatus === 'LAUNCHED').length,
        soldOutReleasesCount: formattedProducts.filter(p => p.computedStatus === 'SOLD_OUT').length,
      },
      products: formattedProducts,
      orders: formattedOrders,
    };
  } catch (error: any) {
    console.error('Error fetching admin pre-bookings data:', error);
    return { success: false, error: error.message || 'Failed to load pre-bookings' };
  }
}

export async function getProductPreBookingInsightAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email || !isSuperAdminEmail(user.email)) {
      return { success: false, error: 'Unauthorized admin access' };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        variants: {
          include: {
            inventory: true,
          },
        },
        interests: {
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderType: 'PRE_BOOKING' },
          { isPreBooking: true },
        ],
        items: {
          some: { variant: { productId } },
        },
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          where: { variant: { productId } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
    const unpaidAttempts = orders.filter(o => o.paymentStatus !== 'PAID');

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        channel: product.channel,
        frontImageUrl: product.frontImageUrl,
        price: product.variants?.[0]?.price ? Number(product.variants[0].price) : 0,
        launchDateTime: product.launchDateTime ? product.launchDateTime.toISOString() : null,
        maxPreBooking: calculateProductInventoryState(product).preBookingAllocation,
        currentPreBookings: calculateProductInventoryState(product).paidPreBookings,
      },
      paidCustomers: paidOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        customerName: o.profile ? `${o.profile.firstName || ''} ${o.profile.lastName || ''}`.trim() : o.email,
        email: o.email,
        phone: o.profile?.phone || 'N/A',
        total: Number(o.total || 0),
        paymentStatus: o.paymentStatus,
        status: o.status,
        size: o.items[0]?.size || 'STD',
        quantity: o.items[0]?.quantity || 1,
      })),
      unpaidAttempts: unpaidAttempts.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toISOString(),
        customerName: o.profile ? `${o.profile.firstName || ''} ${o.profile.lastName || ''}`.trim() : o.email,
        email: o.email,
        total: Number(o.total || 0),
        paymentStatus: o.paymentStatus,
        status: o.status,
        reason: o.paymentStatus === 'FAILED' ? 'Payment Failed' : 'Checkout Abandoned',
      })),
      interestedUsers: product.interests.map(i => ({
        id: i.id,
        createdAt: i.createdAt.toISOString(),
        customerName: i.profile ? `${i.profile.firstName || ''} ${i.profile.lastName || ''}`.trim() : 'Guest',
        email: i.profile?.email || 'N/A',
        phone: i.profile?.phone || 'N/A',
      })),
    };
  } catch (error: any) {
    console.error('Error fetching prebooking insight:', error);
    return { success: false, error: error.message || 'Failed to load insight' };
  }
}
