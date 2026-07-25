import { Metadata } from 'next';
import LegalLayout from '@/components/LegalLayout';
import { constructMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Sizing Guide & Oversized Measurements | GODSMOVE',
  description: 'Detailed measurement charts and boxy fit guides for GODSMOVE drop-shoulder tees, heavy fleece hoodies, and statement apparel.',
  path: '/sizing',
  keywords: ['GODSMOVE sizing guide', 'oversized tee measurements', 'drop shoulder fit guide', 'chest length chart'],
});

export default function SizingPage() {
  return (
    <LegalLayout
      title="Sizing Guide"
      subtitle="Designed to fit the way statement pieces should."
    >
      <h2>Measurement Instructions</h2>
      <p>
        To ensure the intended drape and silhouette, we recommend comparing our measurements to a similar piece of clothing you already own.
      </p>
      <ul>
        <li><strong>Chest:</strong> Measure across the chest, 1 inch below the armhole when laid flat.</li>
        <li><strong>Length:</strong> Measure from the highest point of the shoulder down to the bottom hem.</li>
        <li><strong>Sleeve:</strong> Measure from the center back of the neck, over the shoulder, down to the cuff.</li>
      </ul>

      <h2>T-Shirts (Oversized Fit)</h2>
      <p>Our tees are cut with an intentional drop-shoulder and an exaggerated, boxy frame. We recommend taking your true size for our signature look.</p>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Chest (in)</th>
            <th>Length (in)</th>
            <th>Sleeve (in)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S</td>
            <td>22.5</td>
            <td>28.0</td>
            <td>18.5</td>
          </tr>
          <tr>
            <td>M</td>
            <td>23.5</td>
            <td>29.0</td>
            <td>19.5</td>
          </tr>
          <tr>
            <td>L</td>
            <td>24.5</td>
            <td>30.0</td>
            <td>20.5</td>
          </tr>
          <tr>
            <td>XL</td>
            <td>25.5</td>
            <td>31.0</td>
            <td>21.5</td>
          </tr>
        </tbody>
      </table>

      <h2>Hoodies (Heavyweight)</h2>
      <p>Engineered with 450+ GSM fleece. The fit is cropped slightly at the waist with heavily stacked sleeves.</p>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Chest (in)</th>
            <th>Length (in)</th>
            <th>Sleeve (in)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S</td>
            <td>24.0</td>
            <td>25.0</td>
            <td>33.0</td>
          </tr>
          <tr>
            <td>M</td>
            <td>25.0</td>
            <td>26.0</td>
            <td>34.0</td>
          </tr>
          <tr>
            <td>L</td>
            <td>26.0</td>
            <td>27.0</td>
            <td>35.0</td>
          </tr>
          <tr>
            <td>XL</td>
            <td>27.0</td>
            <td>28.0</td>
            <td>36.0</td>
          </tr>
        </tbody>
      </table>

      <h2>Care Notes</h2>
      <p>
        Our fabrics are pre-shrunk, but due to the heavyweight nature of the cotton, slight shrinkage may occur with heat. Always wash inside out on cold and hang dry to preserve the density and graphic integrity.
      </p>
    </LegalLayout>
  );
}
