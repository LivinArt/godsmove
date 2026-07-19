'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ArrowLeftRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import styles from './CompareBar.module.css';

export default function CompareBar() {
  const { compare, toggleCompare, clearCompare } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!compare || compare.length === 0) return null;

  return (
    <>
      {/* Slide-up Comparison Bar */}
      <div className={styles.bar}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', gap: '16px' }}>
          <div className={styles.left}>
            <div className={styles.iconWrap}>
              <ArrowLeftRight size={16} />
            </div>
            <span className={styles.title}>
              Compare ({compare.length}/3)
            </span>
          </div>

          <div className={styles.center}>
            {compare.map((product) => {
              const baseVariant = product.variants?.[0];
              const price = baseVariant?.price ? Number(baseVariant.price) : 0;
              const imgUrl = product.images?.[0]?.url || product.frontImageUrl || '/placeholder.png';

              return (
                <div key={product.id} className={styles.itemCard}>
                  <div className={styles.thumbWrap}>
                    <img src={imgUrl} alt={product.name} className={styles.thumb} />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => toggleCompare(product)}
                      aria-label={`Remove ${product.name}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemName}>{product.name}</span>
                    <span className={styles.itemPrice}>₹{price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.right}>
            <button type="button" className={styles.clearBtn} onClick={clearCompare}>
              Clear
            </button>
            <button type="button" className="btn btn-primary" style={{ padding: '0 20px', height: '40px', fontSize: '11px', letterSpacing: '0.1em' }} onClick={() => setIsOpen(true)}>
              COMPARE NOW
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Modal Overlay */}
      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Product Comparison</h3>
                <p className={styles.modalSubtitle}>Evaluating craftsmanship, design specs, and materials.</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close Comparison">
                <X size={20} />
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Attributes</th>
                    {compare.map((product) => {
                      const imgUrl = product.images?.[0]?.url || product.frontImageUrl || '/placeholder.png';
                      return (
                        <th key={product.id} className={styles.productTh}>
                          <div className={styles.thContent}>
                            <div className={styles.modalImageWrap}>
                              <img src={imgUrl} alt={product.name} className={styles.modalImage} />
                            </div>
                            <Link href={`/product/${product.slug}`} className={styles.modalProductName} onClick={() => setIsOpen(false)}>
                              {product.name}
                            </Link>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr>
                    <td>Price</td>
                    {compare.map((product) => {
                      const baseVariant = product.variants?.[0];
                      const price = baseVariant?.price ? Number(baseVariant.price) : 0;
                      return <td key={product.id} className={styles.tdPrice}>₹{price.toLocaleString('en-IN')}</td>;
                    })}
                  </tr>
                  {/* Category */}
                  <tr>
                    <td>Collection / Drop</td>
                    {compare.map((product) => (
                      <td key={product.id}>{product.collectionName || product.drop?.name || 'Permanent Collection'}</td>
                    ))}
                  </tr>
                  {/* Material */}
                  <tr>
                    <td>Material</td>
                    {compare.map((product) => (
                      <td key={product.id}>{product.material || 'Premium Fabrics'}</td>
                    ))}
                  </tr>
                  {/* Silhouette */}
                  <tr>
                    <td>Silhouette / Fit</td>
                    {compare.map((product) => (
                      <td key={product.id}>{product.fit || 'Regular Fit'}</td>
                    ))}
                  </tr>
                  {/* Fabric Weight */}
                  <tr>
                    <td>Fabric Detail</td>
                    {compare.map((product) => (
                      <td key={product.id}>{product.fabricName || 'Premium Yarn'}</td>
                    ))}
                  </tr>
                  {/* Craftsmanship */}
                  <tr>
                    <td>Craftsmanship Detail</td>
                    {compare.map((product) => (
                      <td key={product.id}>{product.constructionName || 'Precision Tailored'}</td>
                    ))}
                  </tr>
                  {/* Origin */}
                  <tr>
                    <td>Origin</td>
                    {compare.map((product) => (
                      <td key={product.id}>{product.origin || 'In-House Studio'}</td>
                    ))}
                  </tr>
                  {/* Action */}
                  <tr>
                    <td>Curation</td>
                    {compare.map((product) => (
                      <td key={product.id}>
                        <Link href={`/product/${product.slug}`} className="btn btn-secondary" style={{ width: '100%', height: '40px', justifyContent: 'center', fontSize: '11px', letterSpacing: '0.05em' }} onClick={() => setIsOpen(false)}>
                          VIEW DETAILS
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
