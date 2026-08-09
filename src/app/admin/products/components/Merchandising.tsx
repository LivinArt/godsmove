'use client';

import React from 'react';
import { ExpectedDispatch, PreBookingOfferType } from '@/types/launch';

interface MerchandisingProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  badgeType: string;
  setBadgeType: (val: string) => void;
  customBadgeText: string;
  setCustomBadgeText: (val: string) => void;
}

export function Merchandising({
  formData,
  onChange,
  setFormData,
  badgeType,
  setBadgeType,
  customBadgeText,
  setCustomBadgeText
}: MerchandisingProps) {
  const isExclusiveRack = formData.isExclusiveRack || formData.channel === 'EXCLUSIVE_RACK';
  const isPreBooking = Boolean(formData.isPreBooking);
  const preBookingAvailabilityType = formData.preBookingAvailabilityType || 'IMMEDIATELY';
  const hasPreBookingOffer = Boolean(formData.hasPreBookingOffer);

  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
        3. Merchandising & Launch Curation
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Feature on Homepage Checkbox */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="showOnHomepage"
              name="showOnHomepage"
              checked={Boolean(formData.showOnHomepage)}
              onChange={onChange}
              style={{ width: '16px', height: '16px', accentColor: '#c8a46a', cursor: 'pointer' }}
            />
            <label htmlFor="showOnHomepage" style={{ fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Feature on Homepage
            </label>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--admin-muted)', marginTop: '8px', margin: '8px 0 0 26px' }}>
            {isExclusiveRack
              ? 'When checked, this Exclusive Rack product will be highlighted in the Homepage Vault section.'
              : 'When checked, this Drop product will appear in Homepage Releases (New Arrivals).'}
          </p>
        </div>

        {/* PRE BOOKING & LAUNCH CONFIGURATION */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="isPreBooking"
              name="isPreBooking"
              checked={isPreBooking}
              onChange={onChange}
              style={{ width: '16px', height: '16px', accentColor: '#c8a46a', cursor: 'pointer' }}
            />
            <label htmlFor="isPreBooking" style={{ fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Open Pre Booking
            </label>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--admin-muted)', marginTop: '8px', margin: '8px 0 0 26px' }}>
            Enable pre-booking so customers can reserve this piece before official launch release.
          </p>

          {/* EXPANDABLE LAUNCH CONFIGURATION PANEL */}
          {isPreBooking && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c8a46a', margin: 0 }}>
                LAUNCH SCHEDULER & SETTINGS
              </h3>

              {/* Launch Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Launch Date *</label>
                  <input
                    type="date"
                    name="launchDate"
                    value={formData.launchDate || ''}
                    onChange={onChange}
                    className="admin-input"
                    required={isPreBooking}
                  />
                </div>

                <div>
                  <label className="form-label">Launch Time *</label>
                  <input
                    type="time"
                    name="launchTime"
                    value={formData.launchTime || ''}
                    onChange={onChange}
                    className="admin-input"
                    required={isPreBooking}
                  />
                </div>

                <div>
                  <label className="form-label">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone || 'IST'}
                    onChange={onChange}
                    className="admin-input admin-select"
                  >
                    <option value="IST">IST (India Standard Time - UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                  </select>
                </div>
              </div>

              {/* Pre Booking Availability Window */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>Pre Booking Availability</label>
                <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="preBookingAvailabilityType"
                      value="IMMEDIATELY"
                      checked={preBookingAvailabilityType === 'IMMEDIATELY'}
                      onChange={onChange}
                      style={{ accentColor: '#c8a46a' }}
                    />
                    Open Immediately
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="preBookingAvailabilityType"
                      value="CUSTOM"
                      checked={preBookingAvailabilityType === 'CUSTOM'}
                      onChange={onChange}
                      style={{ accentColor: '#c8a46a' }}
                    />
                    Custom Opening Date
                  </label>
                </div>

                {preBookingAvailabilityType === 'CUSTOM' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    <div>
                      <label className="form-label">Opening Date</label>
                      <input
                        type="date"
                        name="preBookingOpenDate"
                        value={formData.preBookingOpenDate || ''}
                        onChange={onChange}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Opening Time</label>
                      <input
                        type="time"
                        name="preBookingOpenTime"
                        value={formData.preBookingOpenTime || ''}
                        onChange={onChange}
                        className="admin-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Dispatch & Limit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Expected Dispatch</label>
                  <select
                    name="expectedDispatch"
                    value={formData.expectedDispatch || ExpectedDispatch.IMMEDIATELY}
                    onChange={onChange}
                    className="admin-input admin-select"
                  >
                    <option value={ExpectedDispatch.IMMEDIATELY}>Immediately After Launch</option>
                    <option value={ExpectedDispatch.WITHIN_24H}>Within 24 Hours</option>
                    <option value={ExpectedDispatch.WITHIN_3D}>Within 3 Days</option>
                    <option value={ExpectedDispatch.WITHIN_7D}>Within 7 Days</option>
                    <option value={ExpectedDispatch.CUSTOM}>Custom...</option>
                  </select>

                  {formData.expectedDispatch === ExpectedDispatch.CUSTOM && (
                    <input
                      type="text"
                      name="customExpectedDispatch"
                      value={formData.customExpectedDispatch || ''}
                      onChange={onChange}
                      className="admin-input"
                      style={{ marginTop: '8px' }}
                      placeholder="e.g. Ships on Oct 15th"
                    />
                  )}
                </div>

                <div>
                  <label className="form-label">Maximum Pre Booking Quantity (Optional)</label>
                  <input
                    type="number"
                    name="maxPreBooking"
                    value={formData.maxPreBooking || ''}
                    onChange={onChange}
                    className="admin-input"
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>

              {/* PRE BOOKING PROMOTIONAL OFFER */}
              <div style={{ padding: '16px', background: 'rgba(200, 164, 106, 0.05)', border: '1px solid rgba(200, 164, 106, 0.2)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="hasPreBookingOffer"
                    name="hasPreBookingOffer"
                    checked={hasPreBookingOffer}
                    onChange={onChange}
                    style={{ width: '16px', height: '16px', accentColor: '#c8a46a', cursor: 'pointer' }}
                  />
                  <label htmlFor="hasPreBookingOffer" style={{ fontSize: '12px', fontWeight: 700, color: '#c8a46a', cursor: 'pointer', letterSpacing: '0.05em' }}>
                    Enable Pre Booking Promotional Offer
                  </label>
                </div>

                {hasPreBookingOffer && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="preBookingOfferType"
                          value={PreBookingOfferType.PERCENTAGE}
                          checked={(formData.preBookingOfferType || PreBookingOfferType.PERCENTAGE) === PreBookingOfferType.PERCENTAGE}
                          onChange={onChange}
                          style={{ accentColor: '#c8a46a' }}
                        />
                        Percentage Discount (%)
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="preBookingOfferType"
                          value={PreBookingOfferType.FIXED}
                          checked={formData.preBookingOfferType === PreBookingOfferType.FIXED}
                          onChange={onChange}
                          style={{ accentColor: '#c8a46a' }}
                        />
                        Fixed Amount Discount (INR ₹)
                      </label>
                    </div>

                    <div style={{ width: '220px' }}>
                      <label className="form-label">
                        {formData.preBookingOfferType === PreBookingOfferType.FIXED ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
                      </label>
                      <input
                        type="number"
                        name="preBookingOfferValue"
                        value={formData.preBookingOfferValue || ''}
                        onChange={onChange}
                        className="admin-input"
                        placeholder={formData.preBookingOfferType === PreBookingOfferType.FIXED ? 'e.g. 500' : 'e.g. 15'}
                        min="1"
                        step="any"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Badge Curation */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '4px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>Editorial Product Badge</label>
          <select
            value={badgeType}
            onChange={e => setBadgeType(e.target.value)}
            className="admin-input admin-select"
          >
            <option value="None">No Badge</option>
            <option value="Editor's Pick">Editor's Pick</option>
            <option value="Limited">Limited</option>
            <option value="Signature">Signature</option>
            <option value="Archive">Archive</option>
            <option value="Exclusive">Exclusive</option>
            <option value="Members Only">Members Only</option>
            <option value="Custom">Custom Badge...</option>
          </select>

          {badgeType === 'Custom' && (
            <div style={{ marginTop: '12px' }}>
              <label className="form-label">Custom Badge Text</label>
              <input
                type="text"
                value={customBadgeText}
                onChange={e => setCustomBadgeText(e.target.value)}
                className="admin-input"
                placeholder="e.g. RARE THREADS"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
