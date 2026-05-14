import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Terms & Conditions | GODSMOVE',
  description: 'The definitive terms governing the use of the GODSMOVE platform.',
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="The definitive framework governing your use of our platform."
      showDisclaimer={true}
    >
      <h2>1. General Agreement</h2>
      <p>
        By accessing the GODSMOVE platform and participating in our drops, you agree to comply with and be bound by the following Terms and Conditions. These terms apply to all visitors, users, and others who access the service.
      </p>

      <h2>2. Orders & Availability</h2>
      <p>
        All orders are subject to acceptance and availability. Items in your shopping cart are not reserved and may be purchased by other customers until checkout is complete. We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies in product or pricing information, or problems identified by our fraud mitigation systems.
      </p>

      <h2>3. Pricing & Payments</h2>
      <p>
        Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue a product without notice. All payments are processed securely through certified gateways. You agree to provide current, complete, and accurate purchase and account information for all purchases made on our platform.
      </p>

      <h2>4. Intellectual Property</h2>
      <p>
        All content included on this site, such as text, graphics, logos, images, audio clips, digital downloads, and software, is the exclusive property of GODSMOVE or its content suppliers and is protected by international copyright and trademark laws. Unauthorized reproduction or distribution is strictly prohibited.
      </p>

      <h2>5. Product Representation</h2>
      <p>
        We have made every effort to display as accurately as possible the colors and images of our products. We cannot guarantee that your computer monitor's display of any color will be perfectly accurate. 
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        In no case shall GODSMOVE, our directors, officers, employees, affiliates, agents, contractors, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, arising from your use of any of the service or any products procured using the service.
      </p>

      <h2>7. Governing Law</h2>
      <p>
        These Terms and Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the applicable laws of India.
      </p>
    </LegalLayout>
  );
}
