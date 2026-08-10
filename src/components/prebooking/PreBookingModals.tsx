'use client';

import React from 'react';
import PreBookingInfoModal from './PreBookingInfoModal';

interface PreBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export function PreBookingBenefitsModal({ isOpen, onClose, product }: PreBookingModalProps) {
  return (
    <PreBookingInfoModal
      isOpen={isOpen}
      onClose={onClose}
      initialTab="benefits"
      product={product}
    />
  );
}

export function PreBookingTermsModal({ isOpen, onClose, product }: PreBookingModalProps) {
  return (
    <PreBookingInfoModal
      isOpen={isOpen}
      onClose={onClose}
      initialTab="terms"
      product={product}
    />
  );
}

export default PreBookingInfoModal;
