/**
 * GODSMOVE — Pre Booking & Scheduled Launch System Enums & Types
 * Centralized, production-grade source of truth for product lifecycles.
 */

export enum LaunchState {
  DRAFT = 'DRAFT',
  PRE_BOOKING = 'PRE_BOOKING',
  LIVE = 'LIVE',
  SOLD_OUT = 'SOLD_OUT',
  ARCHIVED = 'ARCHIVED',
}

export enum PurchaseMode {
  BUY_NOW = 'BUY_NOW',
  PRE_BOOK = 'PRE_BOOK',
  SOLD_OUT = 'SOLD_OUT',
  COMING_SOON = 'COMING_SOON',
}

export enum OrderType {
  REGULAR = 'REGULAR',
  PRE_BOOKING = 'PRE_BOOKING',
}

export enum ExpectedDispatch {
  IMMEDIATELY = 'IMMEDIATELY',
  WITHIN_24H = 'WITHIN_24H',
  WITHIN_3D = 'WITHIN_3D',
  WITHIN_7D = 'WITHIN_7D',
  CUSTOM = 'CUSTOM',
}

export enum PreBookingOfferType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export interface PreBookingConfig {
  isPreBooking: boolean;
  launchDateTime?: string | Date | null;
  preBookingOpenDateTime?: string | Date | null;
  expectedDispatch?: ExpectedDispatch | string | null;
  customExpectedDispatch?: string | null;
  maxPreBooking?: number | null;
  currentPreBookings?: number;
  hasPreBookingOffer?: boolean;
  preBookingOfferType?: PreBookingOfferType | string | null;
  preBookingOfferValue?: number | null;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
  totalSecondsRemaining: number;
}
