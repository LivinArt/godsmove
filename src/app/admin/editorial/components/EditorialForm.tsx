'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createArchivePost, updateArchivePost, deleteArchivePost } from '@/actions/editorial.actions';
import styles from './EditorialForm.module.css';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
}

interface EditorialFormProps {
  initialData?: any;
  products?: ProductItem[];
}

export type BlockType = 'text' | 'image' | 'quote' | 'cta' | 'productRef';

export interface ContentBlock {
  id: string;
  type: BlockType;
  heading?: string;
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
  credit?: string;
  quote?: string;
  attribution?: string;
  source?: string;
  eyebrow?: string;
  buttonText?: string;
  targetUrl?: string;
  productId?: string;
}

const CATEGORY_OPTIONS = [
  'CRAFTSMANSHIP',
  'NEW RELEASES',
  'COLLECTIONS',
  'GARMENT KNOWLEDGE',
  'DESIGN',
  'STORIES',
  'CULTURE',
];

export default function EditorialForm({ initialData, products = [] }: EditorialFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [category, setCategory] = useState(initialData?.category || 'CRAFTSMANSHIP');
  const [type, setType] = useState(initialData?.type || 'EDITORIAL');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT');
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [authorName, setAuthorName] = useState(initialData?.authorName || 'GODSMOVE Editorial');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [readingTime, setReadingTime] = useState(initialData?.readingTime || '3 min read');

  // Modular Blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    if (Array.isArray(initialData?.contentBlocks)) return initialData.contentBlocks;
    if (initialData?.body) {
      return [{ id: 'b-init', type: 'text', heading: '', text: initialData.body }];
    }
    return [{ id: 'b-1', type: 'text', heading: 'Introduction', text: '' }];
  });

  // Dedicated SEO Panel
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');
  const [seoKeywordsStr, setSeoKeywordsStr] = useState<string>(
    Array.isArray(initialData?.seoKeywords) ? initialData.seoKeywords.join(', ') : ''
  );
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || '');
  const [ogTitle, setOgTitle] = useState(initialData?.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(initialData?.ogDescription || '');
  const [ogImage, setOgImage] = useState(initialData?.ogImage || '');
  const [noIndex, setNoIndex] = useState(initialData?.noIndex || false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSeoPanel, setShowSeoPanel] = useState(false);

  // Auto slug generation
  const handleAutoSlug = () => {
    const generated = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(generated);
  };

  // Block management
  const addBlock = (blockType: BlockType) => {
    const newBlock: ContentBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: blockType,
      heading: '',
      text: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setBlocks(copy);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  // Word count & Reading time calculation
  const calculateReadingTime = (blocksList: ContentBlock[]) => {
    let wordCount = excerpt.split(/\s+/).filter(Boolean).length;
    blocksList.forEach((b) => {
      if (b.text) wordCount += b.text.split(/\s+/).filter(Boolean).length;
      if (b.heading) wordCount += b.heading.split(/\s+/).filter(Boolean).length;
      if (b.quote) wordCount += b.quote.split(/\s+/).filter(Boolean).length;
    });
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    setReadingTime(`${minutes} min read`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Article Title is required.');
      setLoading(false);
      return;
    }

    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
      setErrorMsg('Valid slug is required (lowercase letters, numbers, hyphens only).');
      setLoading(false);
      return;
    }

    if (!excerpt.trim()) {
      setErrorMsg('Short Excerpt / Summary is required.');
      setLoading(false);
      return;
    }

    // Validate image blocks alt text
    const invalidImageBlock = blocks.find((b) => b.type === 'image' && !b.alt?.trim());
    if (invalidImageBlock) {
      setErrorMsg('All image blocks require non-empty Alt Text for SEO & Accessibility.');
      setLoading(false);
      return;
    }

    const payload = {
      title,
      subtitle: subtitle || null,
      slug,
      type,
      category,
      status,
      isFeatured,
      authorName: authorName || 'GODSMOVE Editorial',
      readingTime: readingTime || '3 min read',
      excerpt,
      coverImage: coverImage || null,
      contentBlocks: blocks,
      body: blocks.map((b) => b.text || b.heading || b.quote || '').join('\n\n'),
      tags: [category, type].filter(Boolean),
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywordsStr.split(',').map((k) => k.trim()).filter(Boolean),
      canonicalUrl: canonicalUrl || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || coverImage || null,
      noIndex,
    };

    try {
      if (isEdit) {
        await updateArchivePost(initialData.id, payload);
      } else {
        await createArchivePost(payload as any);
      }
      router.push('/admin/editorial');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to save article:', err);
      setErrorMsg(err.message || 'An error occurred while saving the article.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm('Are you sure you want to delete this Library article?')) return;
    setLoading(true);
    try {
      await deleteArchivePost(initialData.id);
      router.push('/admin/editorial');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete article.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <div className={styles.topBar}>
        <div>
          <Link href="/admin/editorial" className={styles.backLink}>← Back to Library Admin</Link>
          <h1 className={styles.pageTitle}>{isEdit ? 'Edit Library Article' : 'Create New Library Article'}</h1>
        </div>
        <div className={styles.topActions}>
          {isEdit && (
            <button type="button" onClick={handleDelete} className={styles.btnDanger} disabled={loading}>
              Delete Article
            </button>
          )}
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Saving...' : status === 'PUBLISHED' ? 'Publish Article' : 'Save Draft'}
          </button>
        </div>
      </div>

      {errorMsg && <div className={styles.errorBox}>❌ {errorMsg}</div>}

      <div className={styles.gridColumns}>
        {/* Main Column */}
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Core Article Details</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Article Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Inside the Craftsmanship of Our Signature Heavyweight Tee"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Subtitle / Dek</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short editorial lead deck placed below headline"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>URL Slug *</label>
                <button type="button" onClick={handleAutoSlug} className={styles.linkBtn}>Auto-generate from Title</button>
              </div>
              <div className={styles.inputPrefixWrap}>
                <span className={styles.prefix}>https://www.godsmove.in/library/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="inside-craftsmanship-heavyweight-tee"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Short Excerpt / Summary *</label>
              <textarea
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  calculateReadingTime(blocks);
                }}
                rows={3}
                placeholder="Clear editorial summary used on Library cards, social previews, and search snippets."
                className={styles.textarea}
                required
              />
            </div>
          </div>

          {/* Modular Content Block Builder */}
          <div className={styles.card}>
            <div className={styles.labelRow}>
              <h2 className={styles.cardTitle}>Editorial Content Blocks</h2>
              <div className={styles.addBlockBar}>
                <span>Add Block:</span>
                <button type="button" onClick={() => addBlock('text')} className={styles.btnMini}>+ Text</button>
                <button type="button" onClick={() => addBlock('image')} className={styles.btnMini}>+ Image</button>
                <button type="button" onClick={() => addBlock('quote')} className={styles.btnMini}>+ Quote</button>
                <button type="button" onClick={() => addBlock('cta')} className={styles.btnMini}>+ CTA Card</button>
                <button type="button" onClick={() => addBlock('productRef')} className={styles.btnMini}>+ Product</button>
              </div>
            </div>

            <div className={styles.blocksList}>
              {blocks.map((block, index) => (
                <div key={block.id} className={styles.blockCard}>
                  <div className={styles.blockHeader}>
                    <span className={styles.blockBadge}>{index + 1}. {block.type.toUpperCase()} BLOCK</span>
                    <div className={styles.blockTools}>
                      <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className={styles.toolBtn}>↑</button>
                      <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className={styles.toolBtn}>↓</button>
                      <button type="button" onClick={() => removeBlock(block.id)} className={styles.toolBtnDanger}>✕</button>
                    </div>
                  </div>

                  {block.type === 'text' && (
                    <div>
                      <input
                        type="text"
                        value={block.heading || ''}
                        onChange={(e) => updateBlock(block.id, { heading: e.target.value })}
                        placeholder="Section Heading (H2 optional)"
                        className={styles.inputSmall}
                      />
                      <textarea
                        value={block.text || ''}
                        onChange={(e) => {
                          updateBlock(block.id, { text: e.target.value });
                          calculateReadingTime(blocks);
                        }}
                        rows={5}
                        placeholder="Paragraph copy..."
                        className={styles.textarea}
                      />
                    </div>
                  )}

                  {block.type === 'image' && (
                    <div className={styles.blockFieldsGrid}>
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Image URL (e.g. /images/campaign/editorial-01.png or HTTPS URL)"
                        className={styles.inputSmall}
                      />
                      <input
                        type="text"
                        value={block.alt || ''}
                        onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                        placeholder="Alt Text (REQUIRED for SEO/Accessibility)"
                        className={styles.inputSmall}
                        required
                      />
                      <input
                        type="text"
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder="Caption (shown under image)"
                        className={styles.inputSmall}
                      />
                      <input
                        type="text"
                        value={block.credit || ''}
                        onChange={(e) => updateBlock(block.id, { credit: e.target.value })}
                        placeholder="Photo Credit (optional)"
                        className={styles.inputSmall}
                      />
                    </div>
                  )}

                  {block.type === 'quote' && (
                    <div className={styles.blockFieldsGrid}>
                      <textarea
                        value={block.quote || ''}
                        onChange={(e) => updateBlock(block.id, { quote: e.target.value })}
                        rows={3}
                        placeholder="Editorial Quote text..."
                        className={styles.textarea}
                      />
                      <input
                        type="text"
                        value={block.attribution || ''}
                        onChange={(e) => updateBlock(block.id, { attribution: e.target.value })}
                        placeholder="Attribution (e.g. Master Atelier Designer)"
                        className={styles.inputSmall}
                      />
                      <input
                        type="text"
                        value={block.source || ''}
                        onChange={(e) => updateBlock(block.id, { source: e.target.value })}
                        placeholder="Source / Context (optional)"
                        className={styles.inputSmall}
                      />
                    </div>
                  )}

                  {block.type === 'cta' && (
                    <div className={styles.blockFieldsGrid}>
                      <input
                        type="text"
                        value={block.eyebrow || ''}
                        onChange={(e) => updateBlock(block.id, { eyebrow: e.target.value })}
                        placeholder="CTA Eyebrow (e.g. CURATED SELECTION)"
                        className={styles.inputSmall}
                      />
                      <input
                        type="text"
                        value={block.heading || ''}
                        onChange={(e) => updateBlock(block.id, { heading: e.target.value })}
                        placeholder="CTA Heading (e.g. Explore the Denim Edit)"
                        className={styles.inputSmall}
                      />
                      <input
                        type="text"
                        value={block.buttonText || ''}
                        onChange={(e) => updateBlock(block.id, { buttonText: e.target.value })}
                        placeholder="Button Label (e.g. Shop Collection)"
                        className={styles.inputSmall}
                      />
                      <input
                        type="text"
                        value={block.targetUrl || ''}
                        onChange={(e) => updateBlock(block.id, { targetUrl: e.target.value })}
                        placeholder="Destination URL (e.g. /drops or /exclusive-rack)"
                        className={styles.inputSmall}
                      />
                    </div>
                  )}

                  {block.type === 'productRef' && (
                    <div>
                      <label className={styles.labelSmall}>Select Referenced Product:</label>
                      <select
                        value={block.productId || ''}
                        onChange={(e) => updateBlock(block.id, { productId: e.target.value })}
                        className={styles.select}
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated SEO Control Panel */}
          <div className={styles.card}>
            <div className={styles.labelRow} style={{ cursor: 'pointer' }} onClick={() => setShowSeoPanel(!showSeoPanel)}>
              <h2 className={styles.cardTitle}>🔍 Dedicated SEO Control Panel</h2>
              <span className={styles.toggleIcon}>{showSeoPanel ? '▲ Hide' : '▼ Expand'}</span>
            </div>

            {showSeoPanel && (
              <div className={styles.seoPanelBody}>
                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>SEO Title</label>
                    <span className={styles.counter}>{seoTitle.length} / 60 chars</span>
                  </div>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title ? `${title} | GODSMOVE Library` : 'Defaults to Article Title | GODSMOVE Library'}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>SEO Meta Description</label>
                    <span className={styles.counter}>{seoDescription.length} / 160 chars</span>
                  </div>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    placeholder={excerpt || 'Defaults to Article Excerpt'}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>SEO Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    value={seoKeywordsStr}
                    onChange={(e) => setSeoKeywordsStr(e.target.value)}
                    placeholder="craftsmanship, garment design, GODSMOVE library, denim jacket"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Canonical URL</label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder={`https://www.godsmove.in/library/${slug || 'article-slug'}`}
                    className={styles.input}
                  />
                </div>

                <div className={styles.rowTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>OpenGraph Title</label>
                    <input
                      type="text"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      placeholder={seoTitle || title}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>OpenGraph Image URL</label>
                    <input
                      type="text"
                      value={ogImage}
                      onChange={(e) => setOgImage(e.target.value)}
                      placeholder={coverImage || 'https://www.godsmove.in/images/editorial.png'}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="noIndex"
                    checked={noIndex}
                    onChange={(e) => setNoIndex(e.target.checked)}
                  />
                  <label htmlFor="noIndex">Prevent Search Engine Indexing (noIndex)</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className={styles.sideCol}>
          <div className={styles.card}>
            <h3 className={styles.sideTitle}>Publishing Settings</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={styles.select}
              >
                <option value="DRAFT">DRAFT (Unpublished)</option>
                <option value="PUBLISHED">PUBLISHED (Live on Storefront)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category Taxonomy</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={styles.select}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Editorial Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={styles.select}
              >
                <option value="EDITORIAL">EDITORIAL</option>
                <option value="MOODBOARD">MOODBOARD</option>
                <option value="OBSERVATION">OBSERVATION</option>
                <option value="ARTIFACT">ARTIFACT</option>
                <option value="CAMPAIGN">CAMPAIGN</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Author</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cover Image URL</label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/images/campaign/editorial-01.png"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Estimated Reading Time</label>
              <input
                type="text"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <label htmlFor="isFeatured">Featured Story (Hero Banner)</label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
