'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Menu,
  CheckCircle,
  Plus,
  Eye
} from 'lucide-react';

import {
  UpsertProductSchema,
  type UpsertProductInput,
  type FormVariantInput,
  type ProductImageInput
} from '@/lib/validations/product';
import { upsertProductRecord, createCategory, isSlugAvailable } from '@/actions/product.actions';
import { createDrop } from '@/actions/drop.actions';

// Import newly refactored subcomponents
import ProductClient from '@/app/product/[slug]/ProductClient';
import { ProductIdentity } from './ProductIdentity';
import { ProductStory } from './ProductStory';
import { VariantManager } from './VariantManager';
import { Merchandising } from './Merchandising';
import { MediaManager } from './MediaManager';

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  drops: any[];
}

export function ProductForm({ initialData, categories, drops }: ProductFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists for local inline additions
  const [localCategories, setLocalCategories] = useState(categories);
  const [localDrops, setLocalDrops] = useState(drops);
  const [localCollections, setLocalCollections] = useState<any[]>([]);

  useEffect(() => {
    import('@/actions/collection.actions').then(({ getCollections }) => {
      getCollections().then(cols => setLocalCollections(cols)).catch(() => {});
    });
  }, []);

  // Active PIM navigation step (6 steps)
  const [activeStep, setActiveStep] = useState<
    'identity' | 'story' | 'variants' | 'merchandising' | 'media' | 'audit'
  >('identity');

  // Sidebar collapsing toggle (Responsiveness)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Slug check status
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Inline Creation Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  const [showDropModal, setShowDropModal] = useState(false);
  const [newDropName, setNewDropName] = useState('');
  const [newDropSlug, setNewDropSlug] = useState('');

  const [showColModal, setShowColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColStory, setNewColStory] = useState('');

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPublishingFromModal, setIsPublishingFromModal] = useState(false);

  // Primary fields with V4.0 additions
  const [formData, setFormData] = useState<any>({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    tagline: initialData?.tagline || '',
    shortDesc: initialData?.shortDesc || '',
    description: initialData?.description || '',
    symbolism: initialData?.symbolism || '',
    status: initialData?.status || 'DRAFT',
    isFeatured: initialData?.isFeatured || false,
    categoryId: initialData?.categoryId || categories[0]?.id || '',
    dropId: initialData?.dropId || '',
    channel: initialData?.channel || 'DROP',
    unlockTeaser: initialData?.unlockTeaser || '',
    exclusiveStory: initialData?.exclusiveStory || '',
    countdownDurationDays: initialData?.countdownDurationDays ?? 10,
    winnerCount: initialData?.winnerCount ?? 3,
    reservationPrice: initialData?.reservationPrice ? Number(initialData.reservationPrice) : undefined,
    refundNonWinnersToWallet: initialData?.refundNonWinnersToWallet ?? true,
    refundWinnersToWallet: initialData?.refundWinnersToWallet ?? true,
    exclusiveBadgeText: initialData?.exclusiveBadgeText || 'Member Access',
    unlockButtonText: initialData?.unlockButtonText || 'Unlock Access',
    reserveButtonText: initialData?.reserveButtonText || 'Reserve This Drop',
    enableImageToggle: initialData?.enableImageToggle || false,
    frontImageUrl: initialData?.frontImageUrl || '',
    backImageUrl: initialData?.backImageUrl || '',
    defaultImageSide: initialData?.defaultImageSide || 'front',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',

    // Merchandising
    isExclusiveRack: initialData?.isExclusiveRack || false,
    showOnHomepage: initialData?.showOnHomepage || false,
    showOnExclusivePage: initialData?.showOnExclusivePage || false,
    featuredPriority: initialData?.featuredPriority ?? 0,
    featuredBadge: initialData?.featuredBadge || '',
    featuredHeadline: initialData?.featuredHeadline || '',
    featuredDescription: initialData?.featuredDescription || '',
    editorStory: initialData?.editorStory || '',
    collectionName: initialData?.collectionName || '',
    collectionBanner: initialData?.collectionBanner || '',
    collectionHeroImage: initialData?.collectionHeroImage || '',
    collectionHeroVideo: initialData?.collectionHeroVideo || '',
    featuredFrom: initialData?.featuredFrom ? new Date(initialData.featuredFrom).toISOString().slice(0, 16) : '',
    featuredUntil: initialData?.featuredUntil ? new Date(initialData.featuredUntil).toISOString().slice(0, 16) : '',
    theme: initialData?.theme || 'Black',

    // Editorial Storytelling
    whyWeMadeThis: initialData?.whyWeMadeThis || '',
    fabricName: initialData?.fabricName || '',
    fabricWhy: initialData?.fabricWhy || '',
    constructionName: initialData?.constructionName || '',
    constructionWhy: initialData?.constructionWhy || '',
    printName: initialData?.printName || '',
    printWhy: initialData?.printWhy || '',

    // Technical Specs
    material: initialData?.material || '',
    fit: initialData?.fit || '',
    origin: initialData?.origin || '',
    washCare: initialData?.washCare || '',
    country: initialData?.country || '',
    manufacturer: initialData?.manufacturer || '',
    mrp: initialData?.mrp ? Number(initialData.mrp) : undefined,
    hsn: initialData?.hsn || '',
    netQuantity: initialData?.netQuantity ?? 1,
    styleWithIds: initialData?.styleWithIds || [],

    // PIM Columns
    barcode: initialData?.barcode || '',
    costPrice: initialData?.costPrice ? Number(initialData.costPrice) : undefined,
    gstPercentage: initialData?.gstPercentage !== undefined && initialData?.gstPercentage !== null ? Number(initialData.gstPercentage) : 18,
    weight: initialData?.weight ? Number(initialData.weight) : undefined,
    weightWithPackaging: initialData?.weightWithPackaging ? Number(initialData.weightWithPackaging) : undefined,
    dimensions: initialData?.dimensions || '',
    shippingClass: initialData?.shippingClass || 'Standard Shipping',
    returnEligible: initialData?.returnEligible ?? true,
    returnWindowDays: initialData?.returnWindowDays ?? 7,
    metadata: initialData?.metadata || {},

    // PIM V3.0 Guided attributes
    brand: initialData?.brand || 'GODSMOVE',
    warehouse: initialData?.warehouse || 'Main Warehouse',
    lowStockThreshold: initialData?.lowStockThreshold ?? 5,
    currency: initialData?.currency || 'INR',
    lifestyleImages: initialData?.lifestyleImages || [],
    editorialImages: initialData?.editorialImages || [],
    videos: initialData?.videos || [],
    packaging: initialData?.packaging || '',
    warranty: initialData?.warranty || '',
    ownershipInfo: initialData?.ownershipInfo || '',
    editorialNotes: initialData?.editorialNotes || '',
    garmentLifeCycle: initialData?.garmentLifeCycle || '',
    useCoverImage: initialData?.useCoverImage ?? true,
    seoCanonicalUrl: initialData?.seoCanonicalUrl || '',
    seoOgImage: initialData?.seoOgImage || '',
    seoTwitterTitle: initialData?.seoTwitterTitle || '',
    seoTwitterDesc: initialData?.seoTwitterDesc || '',
  });

  const [images, setImages] = useState<ProductImageInput[]>(
    initialData?.images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
      isCover: img.isCover,
    })) || []
  );

  // Variant manager internal settings
  const [variants, setVariants] = useState<FormVariantInput[]>(
    initialData?.variants?.map((v: any) => ({
      sku: v.sku,
      size: v.size,
      alphaSize: v.alphaSize || null,
      numericSize: v.numericSize || null,
      measurements: v.measurements || null,
      color: v.color,
      colorHex: v.colorHex,
      price: Number(v.price),
      comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
      position: v.position,
      isActive: v.isActive,
      initialStock: v.inventory?.totalStock || 0,
    })) || []
  );

  // Garment Life Cycle State Builder (exactly 6 steps)
  const defaultStages = [
    { title: 'Concept Curation', desc: 'Narrative sketching in our design studio.', icon: 'Compass' },
    { title: 'Material Sourcing', desc: 'Acquiring premium double-weave cotton.', icon: 'Layers' },
    { title: 'Pattern Sculpting', desc: 'Precision grading and prototyping cuts.', icon: 'Scissors' },
    { title: 'Technical Construction', desc: 'High-density reinforcing stitchwork.', icon: 'Cpu' },
    { title: 'Quality Auditing', desc: 'Tensile test and dimensional validation.', icon: 'ShieldCheck' },
    { title: 'Archival Packaging', desc: 'Boxed in matte linen collection slips.', icon: 'Package' },
  ];

  const [stages, setStages] = useState<{ title: string; desc: string; icon: string }[]>(() => {
    if (initialData?.garmentLifeCycle) {
      try {
        const parsed = JSON.parse(initialData.garmentLifeCycle);
        if (Array.isArray(parsed) && parsed.length === 6) {
          return parsed;
        }
      } catch {}
    }
    return defaultStages;
  });

  // Badge curation helper
  const [badgeType, setBadgeType] = useState<string>(() => {
    if (initialData?.featuredBadge) {
      const standardBadges = ["Editor's Pick", "Limited", "Signature", "Archive", "Exclusive", "Members Only"];
      if (standardBadges.includes(initialData.featuredBadge)) {
        return initialData.featuredBadge;
      }
      return "Custom";
    }
    return "None";
  });

  const [customBadgeText, setCustomBadgeText] = useState(
    initialData?.featuredBadge && !["Editor's Pick", "Limited", "Signature", "Archive", "Exclusive", "Members Only"].includes(initialData.featuredBadge)
      ? initialData.featuredBadge
      : ''
  );

  // Synchronize custom badge text back to form data state
  useEffect(() => {
    let finalBadge = '';
    if (badgeType === 'Custom') {
      finalBadge = customBadgeText;
    } else if (badgeType !== 'None') {
      finalBadge = badgeType;
    }
    setFormData((prev: any) => ({ ...prev, featuredBadge: finalBadge }));
  }, [badgeType, customBadgeText]);

  // Debounced Slug Availability Check
  useEffect(() => {
    if (!formData.slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await isSlugAvailable(formData.slug, formData.id);
        setSlugStatus(available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, formData.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (name === 'channel' && val !== 'DROP') {
      setFormData((prev: any) => ({ ...prev, channel: val, isFeatured: false }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleInlineCategoryCreate = async () => {
    if (!newCatName || !newCatName.trim()) return;
    try {
      const slugToUse = (newCatSlug && newCatSlug.trim()) ? newCatSlug.trim() : newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const cat = await createCategory(newCatName.trim(), slugToUse);
      setLocalCategories((prev: any[]) => {
        const exists = prev.some((c: any) => c.id === cat.id);
        return exists ? prev : [...prev, { id: cat.id, name: cat.name }];
      });
      setFormData((prev: any) => ({ ...prev, categoryId: cat.id }));
      setShowCatModal(false);
      setNewCatName('');
      setNewCatSlug('');
    } catch (e: any) {
      alert(e.message || 'Error creating category');
    }
  };

  const handleInlineDropCreate = async () => {
    if (!newDropName || !newDropSlug) return;
    try {
      const drop = await createDrop({
        name: newDropName,
        slug: newDropSlug,
        status: 'DRAFT',
        isFeatured: false,
        showCountdown: true,
        productIds: [],
      });
      setLocalDrops((prev: any[]) => [...prev, { id: drop.id, name: drop.name, slug: drop.slug }]);
      setFormData((prev: any) => ({ ...prev, dropId: drop.id }));
      setShowDropModal(false);
      setNewDropName('');
      setNewDropSlug('');
    } catch (e: any) {
      alert(e.message || 'Error creating drop');
    }
  };

  const handleInlineColCreate = () => {
    if (!newColName || !newColName.trim()) return;
    const colName = newColName.trim();
    const story = newColStory ? newColStory.trim() : '';
    setLocalCollections((prev: any[]) => {
      const exists = prev.some((c: any) => (typeof c === 'string' ? c : c.name) === colName);
      return exists ? prev : [...prev, { name: colName }];
    });
    setFormData((prev: any) => ({ ...prev, collectionName: colName, editorStory: story }));
    setShowColModal(false);
    setNewColName('');
    setNewColStory('');
  };

  const handlePreviewProduct = () => {
    setShowPreviewModal(true);
  };

  const handlePublishFromModal = async () => {
    setIsPublishingFromModal(true);
    try {
      const cleanSlug = (formData.slug && formData.slug.trim())
        ? formData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : (formData.name ? formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'product');

      const cleanDesc = (formData.description && formData.description.trim())
        ? formData.description.trim()
        : (formData.shortDesc || formData.name || 'GODSMOVE Luxury Piece');

      const cleanDropId = (formData.dropId && formData.dropId.trim()) ? formData.dropId.trim() : null;

      const basePrice = variants[0]?.price && Number(variants[0].price) > 0 ? Number(variants[0].price) : 12500;

      const cleanVariants = (variants.length > 0 ? variants : [{ sku: `QA-${Date.now().toString().slice(-4)}-M`, size: 'M', color: 'Black', colorHex: '#000000', price: 12500, initialStock: 25, position: 0 }]).map(v => ({
        ...v,
        price: v.price && Number(v.price) > 0 ? Number(v.price) : basePrice,
      }));

      const cleanImages = images.length > 0 ? images : [
        { url: formData.frontImageUrl || '/images/placeholder.svg', isCover: true, position: 0 }
      ];

      const payload: UpsertProductInput = {
        ...formData,
        slug: cleanSlug,
        description: cleanDesc,
        dropId: cleanDropId,
        frontImageUrl: formData.frontImageUrl || '/images/placeholder.svg',
        status: 'ACTIVE',
        images: cleanImages,
        variants: cleanVariants,
      };

      const res = await upsertProductRecord(payload);
      setFormData((prev: any) => ({ ...prev, id: res.id, status: 'ACTIVE' }));
      setShowPreviewModal(false);
      alert('Product published successfully!');
      router.push('/admin/products');
    } catch (err: any) {
      alert(err.message || 'Failed to publish product');
    } finally {
      setIsPublishingFromModal(false);
    }
  };

  const performValidationAudit = () => {
    const errors: { section: string; message: string; resolution: string; severity: 'ERROR' | 'WARNING' }[] = [];

    // Identity
    if (!formData.name) {
      errors.push({
        section: 'Identity',
        message: 'Product Name is missing',
        resolution: 'Provide a name inside Step 1 (Identity).',
        severity: 'ERROR'
      });
    }
    if (!formData.slug) {
      errors.push({
        section: 'Identity',
        message: 'URL Slug is missing',
        resolution: 'Generate or write a custom slug inside Step 1 (Identity).',
        severity: 'ERROR'
      });
    }
    if (slugStatus === 'taken') {
      errors.push({
        section: 'Identity',
        message: 'URL Slug is already allocated',
        resolution: 'Change the slug value in Step 1 to keep it unique.',
        severity: 'ERROR'
      });
    }
    if (!formData.description) {
      errors.push({
        section: 'Identity',
        message: 'Full Description is missing',
        resolution: 'Provide a description in Step 1 to describe materials and cuts.',
        severity: 'ERROR'
      });
    }

    // Variants
    if (variants.length === 0) {
      errors.push({
        section: 'Variants',
        message: 'Product has no variants configured',
        resolution: 'Specify size/color details and generate at least one variant in Step 3.',
        severity: 'ERROR'
      });
    } else {
      variants.forEach((v, idx) => {
        if (!v.sku) {
          errors.push({
            section: 'Variants',
            message: `SKU code is missing on Variant ${idx + 1}`,
            resolution: 'Generate or type an SKU for all combinations in Step 3.',
            severity: 'ERROR'
          });
        }
        if (!v.price || v.price <= 0) {
          errors.push({
            section: 'Variants',
            message: `Selling price is invalid on Variant ${v.sku || (idx + 1)}`,
            resolution: `Specify a positive price for Variant ${idx + 1} in Step 3.`,
            severity: 'ERROR'
          });
        }
      });
    }



    // Media
    if (!formData.frontImageUrl) {
      errors.push({
        section: 'Media',
        message: 'Cover Image is required',
        resolution: 'Upload a primary cover image under Step 5 (Media).',
        severity: 'ERROR'
      });
    }
    if (images.length === 0) {
      errors.push({
        section: 'Media',
        message: 'At least one gallery image is required',
        resolution: 'Upload at least one gallery image in Step 5 (Media).',
        severity: 'ERROR'
      });
    }

    // Shipping & Tax
    if (!formData.hsn) {
      errors.push({
        section: 'Identity',
        message: 'HSN Tax Code is missing',
        resolution: 'Fill in the required 8-digit HSN code in Step 1 (Identity).',
        severity: 'ERROR'
      });
    }

    return errors;
  };

  const auditErrors = performValidationAudit();
  const criticalCount = auditErrors.filter(e => e.severity === 'ERROR').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('===> [CLIENT] STEP 0: Initiating handleSubmit');

    const activeCritical = performValidationAudit().filter(x => x.severity === 'ERROR');
    if (activeCritical.length > 0) {
      console.warn('===> [CLIENT] Audit validation failed with critical errors');
      setError(`Cannot publish. Please resolve the ${activeCritical.length} critical errors listed in Review & Publish.`);
      setActiveStep('audit');
      return;
    }

    setIsPending(true);

    try {
      console.log('===> [CLIENT] STEP 1: Preparing payload');
      const parsedFrom = formData.featuredFrom ? new Date(formData.featuredFrom) : null;
      const parsedUntil = formData.featuredUntil ? new Date(formData.featuredUntil) : null;

      const productSellingPrice = Number(formData.mrp || 0);
      const productComparePrice = formData.comparePrice ? Number(formData.comparePrice) : null;

      const payload: UpsertProductInput = {
        ...formData,
        mrp: productSellingPrice,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        gstPercentage: Number(formData.gstPercentage || 12.0),
        dropId: formData.dropId || null,
        featuredFrom: parsedFrom,
        featuredUntil: parsedUntil,
        images,
        variants: variants.map((v, idx) => ({
          ...v,
          price: (v.price !== undefined && v.price !== null && Number(v.price) > 0) ? Number(v.price) : productSellingPrice,
          comparePrice: (v.comparePrice !== undefined && v.comparePrice !== null) ? Number(v.comparePrice) : productComparePrice,
          position: idx,
        })),
        garmentLifeCycle: JSON.stringify(stages),
      };

      console.log('===> [CLIENT] STEP 2: Running UpsertProductSchema.parse');
      const validated = UpsertProductSchema.parse(payload);

      console.log('===> [CLIENT] STEP 3: Invoking upsertProductRecord server action');
      const savedProduct = await upsertProductRecord(validated);
      console.log('===> [CLIENT] STEP 4: Server action returned successfully:', savedProduct?.slug);

      console.log('===> [CLIENT] STEP 5: Executing router.push and router.refresh');
      router.push(`/product/${savedProduct.slug}`);
      router.refresh();
    } catch (err: any) {
      console.error('❌ [CLIENT] CATCH IN HANDLESUBMIT:', err);
      console.error('❌ [CLIENT] ERROR STACK:', err?.stack);
      console.error('❌ [CLIENT] ERROR DIGEST:', err?.digest);
      if (err instanceof z.ZodError) {
        setError(err.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(' | '));
      } else {
        setError(err.message || 'An unexpected error occurred during database sync.');
      }
    } finally {
      setIsPending(false);
    }
  };

  const steps = [
    { id: 'identity', title: 'Identity & Details', number: 1 },
    { id: 'story', title: 'Brand Storytelling', number: 2 },
    { id: 'variants', title: 'Variant Manager', number: 3 },
    { id: 'merchandising', title: 'Merchandising', number: 4 },
    { id: 'media', title: 'Media Manager', number: 5 },
    { id: 'audit', title: 'Review & Publish', number: 6 },
  ] as const;

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  const getSectionStatusColor = (sectionId: typeof activeStep) => {
    let checkWord = sectionId === 'identity' ? 'identity' : sectionId === 'story' ? 'story' : sectionId;
    const secErrors = auditErrors.filter(e => e.section.toLowerCase().includes(checkWord.substring(0, 5)));
    if (secErrors.some(e => e.severity === 'ERROR')) return '#ef4444';
    if (secErrors.some(e => e.severity === 'WARNING')) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <form onSubmit={handleSubmit} style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Sticky Action Bar */}
      <div 
        style={{ 
          position: 'sticky', 
          top: '16px', 
          zIndex: 10, 
          background: 'rgba(10,10,12,0.96)', 
          backdropFilter: 'blur(16px)',
          padding: '16px 24px', 
          borderRadius: '4px', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/admin/products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {initialData ? 'Modify Luxury Piece' : 'Create PIM Listing'}
            </h1>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step {currentStepIndex + 1} of 6 — {steps[currentStepIndex].title}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {criticalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ef4444', padding: '6px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '2px' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{criticalCount} Critical issues</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || criticalCount > 0}
            className="btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 20px', 
              background: criticalCount > 0 ? '#1f1f23' : 'var(--admin-accent, #c8a46a)', 
              color: criticalCount > 0 ? '#5f5f65' : '#000', 
              fontWeight: 700,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              border: criticalCount > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              borderRadius: '2px',
              cursor: criticalCount > 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '4px', marginBottom: '24px', fontSize: '12px' }}>
          <strong>Publishing Error:</strong> {error}
        </div>
      )}

      {/* Main Workspace Split Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: sidebarCollapsed ? '60px 1fr' : '260px 1fr', 
          gap: '32px', 
          flex: 1,
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        className="pim-container-layout"
      >
        
        {/* Progress Sidebar */}
        <aside 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            paddingRight: '16px'
          }}
          className="pim-sidebar"
        >
          <button 
            type="button" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ 
              alignSelf: sidebarCollapsed ? 'center' : 'flex-end',
              background: 'none', 
              border: 'none', 
              color: 'rgba(255,255,255,0.4)', 
              cursor: 'pointer',
              marginBottom: '12px',
              padding: '6px'
            }}
          >
            <Menu className="w-4 h-4" />
          </button>

          {!sidebarCollapsed && (
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>
              Guided Chapters
            </span>
          )}

          {steps.map((s, idx) => {
            const isActive = activeStep === s.id;
            const dotColor = getSectionStatusColor(s.id);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '2px',
                  background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    background: isActive ? 'var(--admin-accent, #c8a46a)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#000' : 'rgba(255,255,255,0.5)',
                    fontSize: '9px',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  {!sidebarCollapsed && <span>{s.title}</span>}
                </div>
                {!sidebarCollapsed && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor }} />}
              </button>
            );
          })}
        </aside>

        {/* Dynamic Form View Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* STEP 1: Core Identity */}
          {activeStep === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ProductIdentity
                formData={formData}
                onChange={handleChange}
                setFormData={setFormData}
                categories={localCategories}
                drops={localDrops}
                collections={localCollections}
                slugStatus={slugStatus}
                setSlugStatus={setSlugStatus}
                setShowCatModal={setShowCatModal}
                setShowDropModal={setShowDropModal}
                setShowColModal={setShowColModal}
              />
              
              <section className="admin-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', color: '#fff' }}>
                  Taxation & Logistics Info
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div>
                    <label className="form-label">HSN Tax Code <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="hsn"
                      value={formData.hsn}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. 61091000"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }} className="pim-grid-col3">
                  <div>
                    <label className="form-label">Product Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight || ''}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. 0.45"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Weight With Packaging (kg)</label>
                    <input
                      type="number"
                      name="weightWithPackaging"
                      value={formData.weightWithPackaging || ''}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. 0.65"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Warehouse (Optional)</label>
                    <input
                      type="text"
                      name="warehouse"
                      value={formData.warehouse}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. Main Warehouse"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '24px', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a46a', marginBottom: '16px' }}>
                    MRP & GST Pricing Architecture (Inclusive Model)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="pim-grid-col2">
                    <div>
                      <label className="form-label">Cost Price (₹)</label>
                      <input
                        type="number"
                        name="costPrice"
                        value={formData.costPrice || ''}
                        onChange={handleChange}
                        className="admin-input"
                        placeholder="e.g. 1200"
                      />
                    </div>

                    <div>
                      <label className="form-label">Selling Price (Inclusive of GST) (₹) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="number"
                        name="mrp"
                        value={formData.mrp || ''}
                        onChange={handleChange}
                        className="admin-input"
                        placeholder="e.g. 2999"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }} className="pim-grid-col2">
                    <div>
                      <label className="form-label">Compare Price / Strikethrough MRP (₹)</label>
                      <input
                        type="number"
                        name="comparePrice"
                        value={formData.comparePrice || ''}
                        onChange={handleChange}
                        className="admin-input"
                        placeholder="e.g. 4999"
                      />
                    </div>

                    <div>
                      <label className="form-label">GST Rate %</label>
                      <select
                        className="admin-input admin-select"
                        value={[0, 5, 12, 18, 28].includes(Number(formData.gstPercentage)) ? String(formData.gstPercentage) : 'custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setFormData((prev: any) => ({ ...prev, gstPercentage: prev.gstPercentage || 12 }));
                          } else {
                            setFormData((prev: any) => ({ ...prev, gstPercentage: Number(val) }));
                          }
                        }}
                      >
                        <option value="0">0% (Exempted)</option>
                        <option value="5">5% (Apparel & Low Rate)</option>
                        <option value="12">12% (Standard Fashion Rate)</option>
                        <option value="18">18% (Standard Rate)</option>
                        <option value="28">28% (Luxury Rate)</option>
                        <option value="custom">Custom Percentage</option>
                      </select>

                      {![0, 5, 12, 18, 28].includes(Number(formData.gstPercentage)) && (
                        <div style={{ marginTop: '10px' }}>
                          <label className="form-label">Custom GST Percentage (%)</label>
                          <input
                            type="number"
                            name="gstPercentage"
                            value={formData.gstPercentage ?? ''}
                            onChange={handleChange}
                            className="admin-input"
                            placeholder="Enter custom GST % (e.g. 7.5)"
                            step="0.1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label className="form-label">Barcode / UPC (Optional)</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode || ''}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. 89012345678"
                    />
                  </div>
                </div>
              </section>

              <section className="admin-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', color: '#fff' }}>
                  Product Descriptions & Symbolism
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Main Description <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      className="admin-input admin-textarea"
                      placeholder="Full description of materials, drape, design symbolism..."
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Short Description / Teaser</label>
                    <input
                      type="text"
                      name="shortDesc"
                      value={formData.shortDesc || ''}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="Quick summary shown in indexes..."
                    />
                  </div>
                </div>
              </section>

              {/* Inline quick create modals buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowCatModal(true)} className="btn-secondary" style={{ fontSize: '11px' }}>
                  <Plus size={14} style={{ marginRight: '6px' }} /> Quick Add Category
                </button>
                <button type="button" onClick={() => setShowDropModal(true)} className="btn-secondary" style={{ fontSize: '11px' }}>
                  <Plus size={14} style={{ marginRight: '6px' }} /> Quick Add Drop
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Storytelling */}
          {activeStep === 'story' && (
            <ProductStory
              formData={formData}
              onChange={handleChange}
              stages={stages}
              setStages={setStages}
            />
          )}

          {/* STEP 3: Variants */}
          {activeStep === 'variants' && (
            <section className="admin-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
                3. Variant & Size Inventory Manager
              </h2>
              <VariantManager
                variants={variants}
                onChange={setVariants}
                productSlug={formData.slug}
                globalCostPrice={Number(formData.costPrice || 0)}
                globalSellingPrice={Number(formData.mrp || 0)}
                globalComparePrice={formData.comparePrice ? Number(formData.comparePrice) : null}
                globalGstPercentage={Number(formData.gstPercentage || 12.0)}
              />
            </section>
          )}

          {/* STEP 4: Merchandising */}
          {activeStep === 'merchandising' && (
            <Merchandising
              formData={formData}
              onChange={handleChange}
              setFormData={setFormData}
              badgeType={badgeType}
              setBadgeType={setBadgeType}
              customBadgeText={customBadgeText}
              setCustomBadgeText={setCustomBadgeText}
            />
          )}

          {/* STEP 5: Media Manager */}
          {activeStep === 'media' && (
            <MediaManager
              formData={formData}
              setFormData={setFormData}
              images={images}
              setImages={setImages}
              variants={variants}
            />
          )}

          {/* STEP 6: Audit & Review */}
          {activeStep === 'audit' && (
            <section className="admin-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
                6. Guided Review & Publishing
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {criticalCount === 0 ? (
                  <div style={{ padding: '24px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '2px', textAlign: 'center' }}>
                    <CheckCircle className="w-12 h-12 text-green-500" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perfect Quality Score</h3>
                    <p style={{ fontSize: '11px', color: 'var(--admin-muted)', margin: 0 }}>This listing satisfies all luxury presentation standards and tax rules. Ready to save & publish.</p>
                  </div>
                ) : (
                  <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '2px', textAlign: 'center' }}>
                    <AlertTriangle className="w-12 h-12 text-red-500" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{criticalCount} Critical issues blocking publish</h3>
                    <p style={{ fontSize: '11px', color: 'var(--admin-muted)', margin: 0 }}>You must resolve all critical issues before saving this product to the storefront database.</p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Listing Audit Log
                  </span>
                  
                  {auditErrors.length === 0 ? (
                    <p style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>No issues found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {auditErrors.map((err, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            background: err.severity === 'ERROR' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                            borderLeft: `3px solid ${err.severity === 'ERROR' ? '#ef4444' : '#f59e0b'}`,
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: '#fff', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.05em' }}>
                              [{err.section}] {err.message}
                            </strong>
                            <span style={{ color: err.severity === 'ERROR' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase' }}>
                              {err.severity}
                            </span>
                          </div>
                          <span style={{ color: 'var(--admin-muted)' }}>{err.resolution}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Visibility Only Financial & GST Breakdown */}
                <div style={{ background: 'rgba(200, 164, 106, 0.04)', border: '1px solid rgba(200, 164, 106, 0.2)', padding: '24px', borderRadius: '4px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c8a46a', margin: 0 }}>
                      Financial & GST Tax Breakdown (Admin Visibility Only)
                    </h4>
                    <span style={{ fontSize: '10px', color: '#8c857b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Internal Compliance Metrics
                    </span>
                  </div>

                  {(() => {
                    const sp = Number(formData.mrp || 0);
                    const cp = Number(formData.costPrice || 0);
                    const compPrice = formData.comparePrice ? Number(formData.comparePrice) : 0;
                    const gstRate = Number(formData.gstPercentage || 12);
                    const taxableValue = sp > 0 ? Number((sp / (1 + gstRate / 100)).toFixed(2)) : 0;
                    const gstIncluded = sp > 0 ? Number((sp - taxableValue).toFixed(2)) : 0;

                    const hasVariantOverrides = variants.some(v => 
                      (v.price !== undefined && v.price !== null && Number(v.price) > 0 && Number(v.price) !== sp) ||
                      (v.comparePrice !== undefined && v.comparePrice !== null && Number(v.comparePrice) !== compPrice)
                    );

                    return (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Cost Price</span>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>₹{cp.toLocaleString('en-IN')}</strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Selling Price (Inclusive GST)</span>
                            <strong style={{ fontSize: '14px', color: '#c8a46a' }}>₹{sp.toLocaleString('en-IN')}</strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Compare Price</span>
                            <strong style={{ fontSize: '14px', color: '#9ca3af' }}>{compPrice > 0 ? `₹${compPrice.toLocaleString('en-IN')}` : 'N/A'}</strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>GST Rate</span>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>{gstRate}%</strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>GST Included</span>
                            <strong style={{ fontSize: '14px', color: '#22c55e' }}>₹{gstIncluded.toLocaleString('en-IN')}</strong>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--admin-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Taxable Value</span>
                            <strong style={{ fontSize: '14px', color: '#fff' }}>₹{taxableValue.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        {hasVariantOverrides && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(200,164,106,0.08)', border: '1px solid rgba(200,164,106,0.3)', borderRadius: '2px', fontSize: '11px', color: '#c8a46a' }}>
                            ⚡ <strong>Size-Based Custom Pricing:</strong> Some variants use custom price overrides.
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <p style={{ fontSize: '10px', color: '#8c857b', marginTop: '12px', marginBottom: 0, fontStyle: 'italic' }}>
                    Note: These calculations are strictly internal for tax filing & margin analytics. Customers see only the final Selling Price with &quot;Price inclusive of GST&quot; subtext.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handlePreviewProduct}
                      className="btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        border: '1px solid rgba(200, 164, 106, 0.4)',
                        color: '#c8a46a',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview Product</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isPending || criticalCount > 0}
                      className="btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: criticalCount > 0 ? '#1f1f23' : 'var(--admin-accent)',
                        color: criticalCount > 0 ? '#5f5f65' : '#000',
                        fontWeight: 700,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        border: criticalCount > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        borderRadius: '2px',
                        cursor: criticalCount > 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save & Publish listing</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Footer Navigation Action Triggers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--admin-border)', paddingTop: '24px', marginTop: 'auto' }}>
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setActiveStep(steps[currentStepIndex - 1].id)}
                className="pim-nav-btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Previous: {steps[currentStepIndex - 1].title}
              </button>
            ) : (
              <div />
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(steps[currentStepIndex + 1].id)}
                className="pim-nav-btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'var(--admin-surface-2)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Next: {steps[currentStepIndex + 1].title}
              </button>
            ) : (
              <div />
            )}
          </div>

        </div>
      </div>

      {/* ── IN-PAGE PREVIEW MODAL ── */}
      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#0a0a0a', overflowY: 'auto' }}>
          {/* Sticky Header Banner */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10000,
            background: 'rgba(200, 164, 106, 0.95)', color: '#000',
            padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              IN-PAGE PREVIEW MODE — Live Customer Experience View
            </span>
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              style={{
                background: '#000', color: '#fff', border: 'none',
                padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase'
              }}
            >
              ← Back to Editing
            </button>
          </div>

          {/* Real Customer Product Page View */}
          <ProductClient
            product={{
              ...formData,
              id: formData.id || 'preview-id',
              price: variants[0]?.price || 0,
              images: images.length > 0 ? images.map(i => ({ url: i.url, alt: i.alt })) : (formData.frontImageUrl ? [{ url: formData.frontImageUrl }] : []),
              variants: variants.map(v => ({
                id: v.sku,
                sku: v.sku,
                size: v.size,
                color: v.color,
                colorHex: v.colorHex,
                price: v.price,
                comparePrice: v.comparePrice,
                inventory: { totalStock: v.initialStock, reservedStock: 0, soldStock: 0 }
              })),
              category: localCategories.find(c => c.id === formData.categoryId) || { name: 'Category' },
              drop: localDrops.find(d => d.id === formData.dropId) || null,
              editorialImages: formData.editorialImages || [],
            }}
            availableSizes={Array.from(new Set(variants.map(v => v.size))).map(s => ({ label: s, available: true }))}
            coverImage={formData.frontImageUrl || images[0]?.url || '/images/placeholder.svg'}
          />

          {/* Fixed Bottom Action Bar */}
          <div style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10001, display: 'flex', gap: '16px', alignItems: 'center',
            padding: '14px 24px', background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid rgba(200, 164, 106, 0.4)',
            backdropFilter: 'blur(16px)', borderRadius: '100px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.8)'
          }}>
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              style={{
                padding: '12px 24px', background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)', color: '#fff',
                fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '100px'
              }}
            >
              ← Back to Editing
            </button>

            <button
              type="button"
              onClick={handlePublishFromModal}
              disabled={isPublishingFromModal}
              style={{
                padding: '12px 28px', background: '#c8a46a', border: 'none', color: '#0a0a0a',
                fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '100px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {isPublishingFromModal ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish The Product →</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── INLINE NEW CATEGORY MODAL ── */}
      {showCatModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '2px', padding: '28px', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 20px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add New Product Category</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => {
                    setNewCatName(e.target.value);
                    setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="admin-input"
                  placeholder="e.g. Jeans"
                />
              </div>

              <div>
                <label className="form-label">Category URL Slug</label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={e => setNewCatSlug(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. jeans"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary" style={{ padding: '6px 16px', borderRadius: '2px' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleInlineCategoryCreate} className="btn-primary" style={{ padding: '6px 16px', background: 'var(--admin-accent)', color: '#000', borderRadius: '2px' }}>
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INLINE NEW COLLECTION MODAL ── */}
      {showColModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '2px', padding: '28px', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 20px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create New Collection</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Collection Title</label>
                <input
                  type="text"
                  value={newColName}
                  onChange={e => setNewColName(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. Vault Archive"
                />
              </div>

              <div>
                <label className="form-label">Editorial Campaign Story (Optional)</label>
                <textarea
                  rows={2}
                  value={newColStory}
                  onChange={e => setNewColStory(e.target.value)}
                  className="admin-input admin-textarea"
                  placeholder="Campaign narrative..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowColModal(false)} className="btn-secondary" style={{ padding: '6px 16px', borderRadius: '2px' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleInlineColCreate} className="btn-primary" style={{ padding: '6px 16px', background: 'var(--admin-accent)', color: '#000', borderRadius: '2px' }}>
                  Create Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INLINE NEW DROP MODAL ── */}
      {showDropModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '2px', padding: '28px', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 20px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add New Launch Drop</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Drop Name</label>
                <input
                  type="text"
                  value={newDropName}
                  onChange={e => {
                    setNewDropName(e.target.value);
                    setNewDropSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="admin-input"
                  placeholder="e.g. Drop 005 // TEMPORAL"
                />
              </div>

              <div>
                <label className="form-label">Drop URL Slug</label>
                <input
                  type="text"
                  value={newDropSlug}
                  onChange={e => setNewDropSlug(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. drop-005"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowDropModal(false)} className="btn-secondary" style={{ padding: '6px 16px', borderRadius: '2px' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleInlineDropCreate} className="btn-primary" style={{ padding: '6px 16px', background: 'var(--admin-accent)', color: '#000', borderRadius: '2px' }}>
                  Create Drop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}
