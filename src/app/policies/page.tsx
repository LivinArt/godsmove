import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Our Policies | GODSMOVE',
  description: 'Unified reference center for privacy, data, and exchange policies.',
};

export default function PoliciesPage() {
  return (
    <LegalLayout
      title="Our Policies"
      subtitle="Unified reference center for privacy, data, and exchange protocols."
      showDisclaimer={true}
    >
      <h2>Privacy & Data Usage Policy</h2>
      <p>
        We respect your privacy and are committed to protecting it. We collect personal information solely for the purpose of fulfilling orders, enhancing the user experience, and communicating brand updates. We do not sell or rent your personal information to third parties. Your payment data is never stored on our servers; it is processed via encrypted, industry-standard secure gateways.
      </p>

      <h2>Refund and Exchange Policy</h2>
      <p>
        Due to the limited nature of our drops, all sales are final unless an item is defective or an incorrect item was shipped. If you receive a flawed piece, you must initiate a return request within 7 days of delivery. The garment must be unworn, unwashed, and in its original packaging with all tags attached.
      </p>
      <p>
        We currently do not offer direct exchanges. If an exception is made, the return will be processed as store credit, allowing you to secure an alternative size or piece in a future drop.
      </p>

      <h2>Customer Rights</h2>
      <p>
        You have the right to request access to the personal data we hold about you, request corrections, or ask for deletion, subject to legal and operational constraints (e.g., retaining records for tax purposes). Contact our support team for any data-related inquiries.
      </p>

      <h2>Shipping Notes</h2>
      <p>
        Once an item is marked as "Delivered" by the courier, GODSMOVE assumes no responsibility for lost or stolen packages. Please ensure your delivery address is secure and accurate prior to completing checkout.
      </p>
    </LegalLayout>
  );
}
