import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Shipping Policy | GODSMOVE',
  description: 'Logistics and delivery timelines for your statement pieces.',
};

export default function ShippingPage() {
  return (
    <LegalLayout
      title="Shipping Policy"
      subtitle="Logistics and delivery timelines."
    >
      <h2>Order Processing</h2>
      <p>
        Every piece is inspected for quality before dispatch. Orders are typically processed within 24 to 48 hours of confirmation, excluding weekends and public holidays. High-demand drops may require an additional 48 hours for fulfillment.
      </p>

      <h2>Dispatch Timeline</h2>
      <p>
        Once processed, your order will be handed over to our premium logistics partners. You will receive an email containing tracking information the moment the package is scanned at the carrier facility.
      </p>

      <h2>Domestic Shipping (India)</h2>
      <p>
        We offer Pan-India shipping. Deliveries to metropolitan areas usually arrive within 3-5 business days. Tier 2 and Tier 3 cities may take between 5-7 business days.
      </p>

      <h2>Tracking Information</h2>
      <p>
        Real-time tracking is available through your profile dashboard under "Order History", or via the secure link sent to your registered email address. Please allow up to 24 hours for the tracking link to activate after receiving the dispatch notification.
      </p>

      <h2>Delays and Force Majeure</h2>
      <p>
        While we strive to ensure precise delivery times, GODSMOVE is not liable for delays caused by severe weather, logistical strikes, or other unforeseen events beyond our immediate control. If an irregular delay occurs, our team will proactively notify you.
      </p>

      <h2>Contact Support</h2>
      <p>
        For any inquiries regarding an active shipment, reach out directly at support@godsmove.in with your Order ID.
      </p>
    </LegalLayout>
  );
}
