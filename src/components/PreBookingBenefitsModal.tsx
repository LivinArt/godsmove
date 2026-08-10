'use client';

import React from 'react';
import PreBookingInfoModal from './prebooking/PreBookingInfoModal';

interface PreBookingBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  product?: any;
}

export default function PreBookingBenefitsModal({
  isOpen,
  onClose,
  product,
}: PreBookingBenefitsModalProps) {
  return (
    <PreBookingInfoModal
      isOpen={isOpen}
      onClose={onClose}
      initialTab="benefits"
      product={product}
    />
  );
}
