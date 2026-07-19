export interface LogisticsShipmentData {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[];
}

export interface LogisticsResult {
  awb: string;
  carrier: string;
  trackingUrl: string;
}

export interface LogisticsProvider {
  name: string;
  createShipment(data: LogisticsShipmentData): Promise<LogisticsResult>;
  cancelShipment(awb: string): Promise<boolean>;
  trackShipment(awb: string): Promise<{
    awb: string;
    carrier: string;
    status: string;
    events: {
      status: string;
      description: string;
      location: string;
      timestamp: Date;
    }[];
  }>;
  createReversePickup(data: {
    returnReqId: string;
    customerName: string;
    phone: string;
    pincode: string;
    address: string;
    items: { name: string; quantity: number }[];
  }): Promise<{ awb: string; carrier: string }>;
}

// 1. Delhivery Provider Implementation
export class DelhiveryProvider implements LogisticsProvider {
  name = 'Delhivery';

  async createShipment(data: LogisticsShipmentData): Promise<LogisticsResult> {
    // Mimic API connection with credentials check
    console.log(`Connecting to Delhivery API with credentials: ${process.env.DELHIVERY_API_KEY ? 'Present' : 'Missing (using sandbox)'}`);
    const randomAwb = `DELIV-${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      awb: randomAwb,
      carrier: 'Delhivery',
      trackingUrl: `https://www.delhivery.com/track/package/${randomAwb}`,
    };
  }

  async cancelShipment(awb: string): Promise<boolean> {
    console.log(`Delhivery: Cancelling shipment ${awb}`);
    return true;
  }

  async trackShipment(awb: string) {
    const timestamp = new Date();
    return {
      awb,
      carrier: 'Delhivery',
      status: 'DELIVERED',
      events: [
        { status: 'CREATED', description: 'Shipment registered successfully', location: 'Delhi Hub', timestamp: new Date(timestamp.getTime() - 86400000 * 3) },
        { status: 'PACKED', description: 'Item packed in premium luxury GODSMOVE sleeve', location: 'Warehouse 1', timestamp: new Date(timestamp.getTime() - 86400000 * 2.5) },
        { status: 'PICKUP_SCHEDULED', description: 'Pickup scheduled with Delhivery courier agent', location: 'Warehouse 1', timestamp: new Date(timestamp.getTime() - 86400000 * 2) },
        { status: 'PICKED_UP', description: 'Shipment scanned and picked up by Delhivery agent', location: 'Delhi Hub', timestamp: new Date(timestamp.getTime() - 86400000 * 1.8) },
        { status: 'IN_TRANSIT', description: 'In transit to customer destination city', location: 'Transit Center', timestamp: new Date(timestamp.getTime() - 86400000 * 1) },
        { status: 'OUT_FOR_DELIVERY', description: 'Out for delivery. Premium courier delivery agent assigned', location: 'Destination Hub', timestamp: new Date(timestamp.getTime() - 3600000 * 4) },
        { status: 'DELIVERED', description: 'Delivered securely to recipient. Signature verified', location: 'Customer Doorstep', timestamp: timestamp },
      ],
    };
  }

  async createReversePickup(data: any): Promise<{ awb: string; carrier: string }> {
    const randomAwb = `DELIV-REV-${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      awb: randomAwb,
      carrier: 'Delhivery Reverse',
    };
  }
}

// 2. Shiprocket Provider Implementation
export class ShiprocketProvider implements LogisticsProvider {
  name = 'Shiprocket';

  async createShipment(data: LogisticsShipmentData): Promise<LogisticsResult> {
    console.log(`Connecting to Shiprocket API with credentials: ${process.env.SHIPROCKET_API_KEY ? 'Present' : 'Missing (using sandbox)'}`);
    const randomAwb = `SR-${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      awb: randomAwb,
      carrier: 'Shiprocket',
      trackingUrl: `https://shiprocket.co/tracking/${randomAwb}`,
    };
  }

  async cancelShipment(awb: string): Promise<boolean> {
    console.log(`Shiprocket: Cancelling shipment ${awb}`);
    return true;
  }

  async trackShipment(awb: string) {
    const timestamp = new Date();
    return {
      awb,
      carrier: 'Shiprocket',
      status: 'DELIVERED',
      events: [
        { status: 'CREATED', description: 'Shipment logged on Shiprocket panel', location: 'HQ Warehouse', timestamp: new Date(timestamp.getTime() - 86400000 * 2.5) },
        { status: 'PICKED_UP', description: 'Scanned at regional fulfillment center', location: 'Fulfillment Center', timestamp: new Date(timestamp.getTime() - 86400000 * 1.5) },
        { status: 'IN_TRANSIT', description: 'In transit', location: 'In Transit', timestamp: new Date(timestamp.getTime() - 86400000 * 0.8) },
        { status: 'DELIVERED', description: 'Delivered successfully', location: 'Customer Doorstep', timestamp: timestamp },
      ],
    };
  }

  async createReversePickup(data: any): Promise<{ awb: string; carrier: string }> {
    const randomAwb = `SR-REV-${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      awb: randomAwb,
      carrier: 'Shiprocket Reverse',
    };
  }
}

// 3. Blue Dart Provider Implementation
export class BlueDartProvider implements LogisticsProvider {
  name = 'Blue Dart';

  async createShipment(data: LogisticsShipmentData): Promise<LogisticsResult> {
    console.log(`Connecting to Blue Dart API with credentials: ${process.env.BLUEDART_API_KEY ? 'Present' : 'Missing (using sandbox)'}`);
    const randomAwb = `BD-${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      awb: randomAwb,
      carrier: 'Blue Dart',
      trackingUrl: `https://www.bluedart.com/tracking?awb=${randomAwb}`,
    };
  }

  async cancelShipment(awb: string): Promise<boolean> {
    console.log(`Blue Dart: Cancelling shipment ${awb}`);
    return true;
  }

  async trackShipment(awb: string) {
    const timestamp = new Date();
    return {
      awb,
      carrier: 'Blue Dart',
      status: 'DELIVERED',
      events: [
        { status: 'CREATED', description: 'Courier pickup booked via Blue Dart Enterprise account', location: 'Warehouse Hub', timestamp: new Date(timestamp.getTime() - 86400000 * 2) },
        { status: 'PICKED_UP', description: 'Collected and sorted at main city distribution terminal', location: 'Cargo Center', timestamp: new Date(timestamp.getTime() - 86400000 * 1.2) },
        { status: 'IN_TRANSIT', description: 'Dispatched via premium air freight carrier network', location: 'Transit Center', timestamp: new Date(timestamp.getTime() - 86400000 * 0.6) },
        { status: 'DELIVERED', description: 'Delivered securely to Customer Doorstep', location: 'Customer Doorstep', timestamp: timestamp },
      ],
    };
  }

  async createReversePickup(data: any): Promise<{ awb: string; carrier: string }> {
    const randomAwb = `BD-REV-${Math.floor(100000000 + Math.random() * 900000000)}`;
    return {
      awb: randomAwb,
      carrier: 'Blue Dart Reverse',
    };
  }
}

// Factory Service Dispatcher
export const LogisticsService = {
  getProvider(providerName?: string): LogisticsProvider {
    const active = providerName || process.env.LOGISTICS_PROVIDER || 'Delhivery';
    switch (active.toLowerCase()) {
      case 'shiprocket':
        return new ShiprocketProvider();
      case 'bluedart':
      case 'blue dart':
        return new BlueDartProvider();
      case 'delhivery':
      default:
        return new DelhiveryProvider();
    }
  },
};

/**
 * Calculates the Estimated Delivery Date (ETA) based on:
 * - Origin pincode (e.g. Warehouse in Delhi)
 * - Destination pincode (pincode of destination address)
 * - Carrier name (Delhivery, Blue Dart, Shiprocket, Manual, etc.)
 * - Business days constraint (Sundays are not delivery days)
 */
export function calculateETA(originPincode: string, destPincode: string, carrier: string): Date {
  const now = new Date();
  let transitDays = 3; // base default transit days
  
  const cleanDest = (destPincode || '').trim();
  if (cleanDest.length >= 2) {
    const originPrefix = originPincode.substring(0, 2);
    const destPrefix = cleanDest.substring(0, 2);
    
    if (originPrefix === destPrefix) {
      transitDays = 1; // local (same state/NCR)
    } else {
      const region1 = originPincode.charAt(0);
      const region2 = cleanDest.charAt(0);
      if (region1 === region2) {
        transitDays = 2; // regional (adjacent states)
      } else {
        transitDays = 4; // national (long distance)
      }
    }
  }

  // Adjust by carrier
  const lcCarrier = carrier.toLowerCase();
  if (lcCarrier.includes('blue dart') || lcCarrier.includes('bluedart')) {
    transitDays = Math.max(1, transitDays - 1); // Blue Dart is faster (air freight)
  } else if (lcCarrier.includes('manual')) {
    transitDays += 1; // Manual dispatch is slower
  }

  // Calculate ETA date by skipping Sundays
  let daysAdded = 0;
  const etaDate = new Date(now);
  while (daysAdded < transitDays) {
    etaDate.setDate(etaDate.getDate() + 1);
    const dayOfWeek = etaDate.getDay(); // 0 is Sunday
    if (dayOfWeek !== 0) { // Sunday is non-business delivery day
      daysAdded++;
    }
  }
  return etaDate;
}

