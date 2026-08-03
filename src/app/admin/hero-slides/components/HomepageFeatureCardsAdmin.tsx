'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Save, Layers } from 'lucide-react';
import { SingleImageUploader } from '@/app/admin/products/components/SingleImageUploader';
import { updateHomepageFeatureCardsData } from '@/actions/feature-cards.actions';
import styles from './HomepageFeatureCardsAdmin.module.css';

interface HomepageFeatureCardsAdminProps {
  initialContent?: Record<string, string>;
}

export default function HomepageFeatureCardsAdmin({ initialContent = {} }: HomepageFeatureCardsAdminProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Card 1 state
  const [card1Title, setCard1Title] = useState(initialContent.feature_card_1_title || 'DROPS');
  const [card1Desc, setCard1Desc] = useState(initialContent.feature_card_1_desc || 'Discover the latest limited releases.');
  const [card1Image, setCard1Image] = useState(initialContent.feature_card_1_image || '/images/campaign/editorial-01.png');

  // Card 2 state
  const [card2Title, setCard2Title] = useState(initialContent.feature_card_2_title || 'EXCLUSIVE RACK');
  const [card2Desc, setCard2Desc] = useState(initialContent.feature_card_2_desc || 'Reserved pieces available only to verified members.');
  const [card2Image, setCard2Image] = useState(initialContent.feature_card_2_image || '/images/campaign/editorial-02.png');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatusMsg(null);

    try {
      await updateHomepageFeatureCardsData({
        card1Image,
        card1Title,
        card1Desc,
        card2Image,
        card2Title,
        card2Desc,
      });

      setStatusMsg({ type: 'success', text: 'Feature cards updated! Homepage updated.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to save feature cards.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.container}>
      <div 
        className={styles.accordionHeader}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
      >
        <div>
          <h2 className={styles.headerTitle}>
            <Layers size={18} style={{ color: '#c8a46a' }} />
            Homepage Feature Cards
          </h2>
          <p className={styles.headerSubtitle}>
            Configure the dual feature cards (DROPS & EXCLUSIVE RACK) displayed below the hero banner.
          </p>
        </div>
        <div>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSave} className={styles.content}>
          <div className={styles.grid}>
            {/* Feature Card 1 (DROPS) */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Feature Card 1 — Left</span>
                <span className={styles.fixedCtaBadge}>CTA: Explore → (/drops)</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={card1Title}
                  onChange={(e) => setCard1Title(e.target.value)}
                  placeholder="DROPS"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={card1Desc}
                  onChange={(e) => setCard1Desc(e.target.value)}
                  placeholder="Discover the latest limited releases."
                  required
                />
              </div>

              <div className={styles.field}>
                <SingleImageUploader
                  label="Card 1 Cover Image"
                  description="Recommended 16:9 ratio (e.g. 1200×675). High resolution campaign photography."
                  value={card1Image}
                  onChange={(url) => setCard1Image(url || '')}
                />
              </div>
            </div>

            {/* Feature Card 2 (EXCLUSIVE RACK) */}
            <div className={styles.cardBox}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Feature Card 2 — Right</span>
                <span className={styles.fixedCtaBadge}>CTA: Enter the Rack → (/exclusive-rack)</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={card2Title}
                  onChange={(e) => setCard2Title(e.target.value)}
                  placeholder="EXCLUSIVE RACK"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={card2Desc}
                  onChange={(e) => setCard2Desc(e.target.value)}
                  placeholder="Reserved pieces available only to verified members."
                  required
                />
              </div>

              <div className={styles.field}>
                <SingleImageUploader
                  label="Card 2 Cover Image"
                  description="Recommended 16:9 ratio (e.g. 1200×675). High resolution campaign photography."
                  value={card2Image}
                  onChange={(url) => setCard2Image(url || '')}
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <div>
              {statusMsg && (
                <span className={statusMsg.type === 'success' ? styles.success : styles.error}>
                  {statusMsg.text}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={pending}
              className={styles.saveBtn}
            >
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Feature Cards
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
