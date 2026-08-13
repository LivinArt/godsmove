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

// Import subcomponents
import ProductClient from '@/app/product/[slug]/ProductClient';
import { ProductIdentity } from './ProductIdentity';
import { VariantManager } from './VariantManager';
import { Merchandising } from './Merchandising';
import { MediaManager } from './MediaManager';
import { ProductStory } from './ProductStory';

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  drops: any[];
}

export function ProductForm({ initialData, categories, drops }: ProductFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localCategories, setLocalCategories] = useState(categories);
  const [localDrops, setLocalDrops] = useState(drops);
  const [localCollections, setLocalCollections] = useState<any[]>([]);

  useEffect(() => {
    import('@/actions/collection.actions').then(({ getCollections }) => {
      getCollections().then(cols => setLocalCollections(cols)).catch(() => {});
    });
  }, []);

  // Active PIM navigation step (6 chapters)
  const [activeStep, setActiveStep] = useState<
    'identity' | 'variants' | 'merchandising' | 'media' | 'storytelling' | 'audit'
  >('identity');

  // Sidebar collapsing toggle (Responsiveness)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

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

  // Primary fields
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
    
    // Merchandising
    isExclusiveRack: initialData?.isExclusiveRack || false,
    showOnHomepage: initialData?.showOnHomepage || false,
    showOnExclusivePage: initialData?.showOnExclusivePage || false,
    featuredPriority: initialData?.featuredPriority ?? 0,
    featuredBadge: initialData?.featuredBadge || '',
    collectionName: initialData?.collectionName || '',
    collectionBanner: initialData?.collectionBanner || '',
    collectionHeroImage: initialData?.collectionHeroImage || '',
    collectionHeroVideo: initialData?.collectionHeroVideo || '',
    featuredFrom: initialData?.featuredFrom ? new Date(initialData.featuredFrom).toISOString().slice(0, 16) : '',
    featuredUntil: initialData?.featuredUntil ? new Date(initialData.featuredUntil).toISOString().slice(0, 16) : '',
    theme: initialData?.theme || 'Black',

    // Pre Booking & Scheduled Launch System
    isPreBooking: initialData?.isPreBooking || false,
    launchDate: initialData?.launchDateTime
      ? new Date(initialData.launchDateTime).toISOString().slice(0, 10)
      : '',
    launchTime: initialData?.launchDateTime
      ? new Date(initialData.launchDateTime).toISOString().slice(11, 16)
      : '',
    timezone: initialData?.timezone || 'IST',
    preBookingAvailabilityType: initialData?.preBookingOpenDateTime ? 'CUSTOM' : 'IMMEDIATELY',
    preBookingOpenDate: initialData?.preBookingOpenDateTime
      ? new Date(initialData.preBookingOpenDateTime).toISOString().slice(0, 10)
      : '',
    preBookingOpenTime: initialData?.preBookingOpenDateTime
      ? new Date(initialData.preBookingOpenDateTime).toISOString().slice(11, 16)
      : '',
    expectedDispatch: initialData?.expectedDispatch || 'IMMEDIATELY',
    customExpectedDispatch: initialData?.customExpectedDispatch || '',
    maxPreBooking: initialData?.maxPreBooking ?? '',
    hasPreBookingOffer: initialData?.hasPreBookingOffer || false,
    preBookingOfferType: initialData?.preBookingOfferType || 'PERCENTAGE',
    preBookingOfferValue: initialData?.preBookingOfferValue ?? '',

    // Member-Only Product Discount
    hasMemberDiscount: initialData?.hasMemberDiscount || false,
    memberDiscountType: initialData?.memberDiscountType || 'PERCENTAGE',
    memberDiscountValue: initialData?.memberDiscountValue ?? 10,

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
    barcode: initialData?.barcode || '',
    costPrice: initialData?.costPrice ? Number(initialData.costPrice) : undefined,
    comparePrice: initialData?.comparePrice ? Number(initialData.comparePrice) : undefined,
    gstPercentage: initialData?.gstPercentage !== undefined && initialData?.gstPercentage !== null ? Number(initialData.gstPercentage) : 18,
    weight: initialData?.weight ? Number(initialData.weight) : undefined,
    weightWithPackaging: initialData?.weightWithPackaging ? Number(initialData.weightWithPackaging) : undefined,
    dimensions: initialData?.dimensions || '',
    shippingClass: initialData?.shippingClass || 'Standard Ground',
    returnEligible: initialData?.returnEligible ?? true,
    returnWindowDays: initialData?.returnWindowDays ?? 7,
    brand: initialData?.brand || 'GODSMOVE',
    warehouse: initialData?.warehouse || 'Main Warehouse',
    lowStockThreshold: initialData?.lowStockThreshold ?? 5,
    currency: initialData?.currency || 'INR',

    styleWithIds: initialData?.styleWithIds || [],
    storytelling: initialData?.storytelling || null,
  });

  const [images, setImages] = useState<ProductImageInput[]>(() =>
    initialData?.images?.map((i: any) => ({
      id: i.id,
      url: i.url,
      alt: i.alt || '',
      position: i.position,
      isCover: i.isCover,
    })) || []
  );

  const [variants, setVariants] = useState<FormVariantInput[]>(() =>
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

  useEffect(() => {
    let finalBadge = '';
    if (badgeType === 'Custom') {
      finalBadge = customBadgeText;
    } else if (badgeType !== 'None') {
      finalBadge = badgeType;
    }
    setFormData((prev: any) => ({ ...prev, featuredBadge: finalBadge }));
  }, [badgeType, customBadgeText]);

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

    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleInlineCategoryCreate = async () => {
    if (!newCatName || !newCatName.trim()) return;
    try {
      const slugToUse = (newCatSlug && newCatSlug.trim()) ? newCatSlug.trim() : newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const cat = await createCategory(newCatName.trim(), slugToUse);
      setLocalCategories((prev: any[]) => [...prev, { id: cat.id, name: cat.name }]);
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
      setFormData((prev: any) => ({
        ...prev,
        dropId: drop.id,
        channel: 'DROP',
        isExclusiveRack: false,
      }));
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
    setLocalCollections((prev: any[]) => [...prev, { name: colName }]);
    setFormData((prev: any) => ({ ...prev, collectionName: colName }));
    setShowColModal(false);
    setNewColName('');
  };

  const handlePreviewProduct = () => {
    const cleanSlug = formData.slug ? formData.slug.trim().toLowerCase() : `preview-${Date.now()}`;
    const cleanDesc = (formData.description && formData.description.trim())
      ? formData.description.trim()
      : (formData.shortDesc || formData.name || 'GODSMOVE Luxury Piece');

    const cleanDropId = (formData.dropId && formData.dropId.trim()) ? formData.dropId.trim() : null;

    const basePrice = variants[0]?.price && Number(variants[0].price) > 0 ? Number(variants[0].price) : (formData.mrp ? Number(formData.mrp) : 2999);

    const cleanVariants = (variants.length > 0 ? variants : [{ sku: `PREVIEW-${Date.now().toString().slice(-4)}-M`, size: 'M', color: 'Black', colorHex: '#000000', price: basePrice, initialStock: 25, position: 0 }]).map(v => ({
      ...v,
      price: v.price && Number(v.price) > 0 ? Number(v.price) : basePrice,
    }));

    const cleanImages = images.length > 0 ? images : [
      { url: formData.frontImageUrl || '/images/placeholder.svg', isCover: true, position: 0 }
    ];

    const previewPayload = {
      ...formData,
      slug: cleanSlug,
      description: cleanDesc,
      shortDesc: formData.shortDesc || cleanDesc,
      dropId: cleanDropId,
      frontImageUrl: formData.frontImageUrl || '/images/placeholder.svg',
      images: cleanImages,
      variants: cleanVariants,
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('godsmove_preview_product', JSON.stringify(previewPayload));
      window.open('/admin/products/preview', '_blank');
    }
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

      const basePrice = variants[0]?.price && Number(variants[0].price) > 0 ? Number(variants[0].price) : (formData.mrp ? Number(formData.mrp) : 2999);

      const cleanVariants = (variants.length > 0 ? variants : [{ sku: `QA-${Date.now().toString().slice(-4)}-M`, size: 'M', color: 'Black', colorHex: '#000000', price: basePrice, initialStock: 25, position: 0 }]).map(v => ({
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
        resolution: 'Provide a product name in Step 1 (Identity).',
        severity: 'ERROR'
      });
    }
    if (!formData.slug) {
      errors.push({
        section: 'Identity',
        message: 'URL Slug is missing',
        resolution: 'Generate or type a custom slug in Step 1 (Identity).',
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
    if (!formData.dropId && !formData.isExclusiveRack) {
      errors.push({
        section: 'Identity',
        message: 'Associated Release Drop or Destination is required',
        resolution: 'Select an Associated Release Drop or EXCLUSIVE RACK in Step 1.',
        severity: 'ERROR'
      });
    }
    if (!formData.description) {
      errors.push({
        section: 'Identity',
        message: 'Full Description is missing',
        resolution: 'Provide a full product description in Step 1.',
        severity: 'ERROR'
      });
    }
    if (!formData.shortDesc) {
      errors.push({
        section: 'Identity',
        message: 'Short Description / Teaser is missing',
        resolution: 'Provide a short teaser summary in Step 1.',
        severity: 'ERROR'
      });
    }

    // Variants
    if (variants.length === 0) {
      errors.push({
        section: 'Variants',
        message: 'Product has no variants configured',
        resolution: 'Generate at least one variant in Step 2 (Variants).',
        severity: 'ERROR'
      });
    } else {
      variants.forEach((v, idx) => {
        if (!v.sku) {
          errors.push({
            section: 'Variants',
            message: `SKU code is missing on Variant ${idx + 1}`,
            resolution: 'Generate or type an SKU for all combinations in Step 2.',
            severity: 'ERROR'
          });
        }
        if (!v.price || v.price <= 0) {
          errors.push({
            section: 'Variants',
            message: `Selling price is invalid on Variant ${v.sku || (idx + 1)}`,
            resolution: `Specify a positive price for Variant ${idx + 1} in Step 2.`,
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
        resolution: 'Upload a primary cover image under Step 4 (Media).',
        severity: 'ERROR'
      });
    }
    if (images.length === 0) {
      errors.push({
        section: 'Media',
        message: 'At least one gallery image is required',
        resolution: 'Upload at least one gallery image in Step 4 (Media).',
        severity: 'ERROR'
      });
    }

    // Shipping & Tax
    if (!formData.hsn) {
      errors.push({
        section: 'Identity',
        message: 'HSN Tax Code is missing',
        resolution: 'Fill in the required HSN code in Step 1 (Identity).',
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

    const activeCritical = performValidationAudit().filter(x => x.severity === 'ERROR');
    if (activeCritical.length > 0) {
      setError(`Cannot publish. Please resolve the ${activeCritical.length} critical errors listed in Review & Publish.`);
      setActiveStep('audit');
      return;
    }

    setIsPending(true);

    try {
      const parsedFrom = formData.featuredFrom ? new Date(formData.featuredFrom) : null;
      const parsedUntil = formData.featuredUntil ? new Date(formData.featuredUntil) : null;

      // Construct launchDateTime ISO Date
      let launchDateTime: Date | null = null;
      if (formData.isPreBooking && formData.launchDate) {
        const timeStr = formData.launchTime || '00:00';
        launchDateTime = new Date(`${formData.launchDate}T${timeStr}:00`);
      }

      // Construct preBookingOpenDateTime ISO Date
      let preBookingOpenDateTime: Date | null = null;
      if (formData.isPreBooking && formData.preBookingAvailabilityType === 'CUSTOM' && formData.preBookingOpenDate) {
        const openTimeStr = formData.preBookingOpenTime || '00:00';
        preBookingOpenDateTime = new Date(`${formData.preBookingOpenDate}T${openTimeStr}:00`);
      }

      const productSellingPrice = Number(formData.mrp || 0);
      const productComparePrice = formData.comparePrice ? Number(formData.comparePrice) : null;

      const defaultStorytelling = {
        detailsEyebrow: formData.storytelling?.detailsEyebrow || 'DESIGN SPECIFICATION',
        detailsTitle: formData.storytelling?.detailsTitle || 'PRODUCT DETAILS & SYMBOLISM',
        detailsIntro: formData.storytelling?.detailsIntro || formData.description || '',
        detailsBlocks: formData.storytelling?.detailsBlocks?.length ? formData.storytelling.detailsBlocks : [
          {
            id: 'block-1',
            eyebrow: 'FABRIC ARCHITECTURE',
            heading: formData.fabricName || formData.material || 'Heavyweight Combed Cotton',
            description: formData.fabricWhy || 'Dense knit construction engineered to drape cleanly with minimal cling, maintaining structural form throughout continuous wear.',
            icon: 'Layers',
          },
          {
            id: 'block-2',
            eyebrow: 'CONSTRUCTION & SEAMS',
            heading: formData.constructionName || formData.fit || 'Drop-Shoulder Precision Cut',
            description: formData.constructionWhy || 'Relaxed proportions tailored across the chest and upper arm, finished with reinforced double-needle stitching on hem and cuffs.',
            icon: 'Scissors',
          },
          {
            id: 'block-3',
            eyebrow: 'ARTWORK & FINISH',
            heading: formData.printName || 'Archival Screen Application',
            description: formData.printWhy || 'High-density pigment execution cured for exceptional longevity, formulated to evolve with character through time and laundering.',
            icon: 'Brush',
          },
        ],
        archiveEyebrow: formData.storytelling?.archiveEyebrow || 'TECHNICAL ARCHIVE',
        archiveTitle: formData.storytelling?.archiveTitle || 'GARMENT SPECIFICATIONS',
        archiveBadgeText: formData.storytelling?.archiveBadgeText || '01 / 03 • GODSMOVE ATELIER',
        archiveSpecs: formData.storytelling?.archiveSpecs?.length ? formData.storytelling.archiveSpecs : [
          { id: 'spec-1', label: 'MATERIAL', value: formData.material || '100% Cotton (280–300 GSM)' },
          { id: 'spec-2', label: 'FIT TYPE', value: formData.fit || 'Oversized Drop-Shoulder' },
          { id: 'spec-3', label: 'COUNTRY OF ORIGIN', value: formData.origin || formData.country || 'India' },
          { id: 'spec-4', label: 'WASH CARE', value: formData.washCare || 'Machine Wash Cold, Dry Flat in Shade' },
          { id: 'spec-5', label: 'MANUFACTURER', value: formData.manufacturer || 'GODSMOVE Atelier' },
          { id: 'spec-6', label: 'SHIPPING CLASS', value: formData.shippingClass || 'Standard Ground' },
        ],
      };

      const payload: UpsertProductInput = {
        ...formData,
        storytelling: defaultStorytelling,
        isPreBooking: Boolean(formData.isPreBooking),
        launchDateTime,
        preBookingOpenDateTime,
        expectedDispatch: formData.expectedDispatch || 'IMMEDIATELY',
        customExpectedDispatch: formData.customExpectedDispatch || null,
        maxPreBooking: formData.maxPreBooking ? Number(formData.maxPreBooking) : null,
        hasPreBookingOffer: Boolean(formData.hasPreBookingOffer),
        preBookingOfferType: formData.preBookingOfferType || 'PERCENTAGE',
        preBookingOfferValue: formData.preBookingOfferValue ? Number(formData.preBookingOfferValue) : null,
        mrp: productSellingPrice,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        gstPercentage: Number(formData.gstPercentage || 18.0),
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
      };

      const validated = UpsertProductSchema.parse(payload);
      const savedProduct = await upsertProductRecord(validated);

      router.push(`/product/${savedProduct.slug}`);
      router.refresh();
    } catch (err: any) {
      console.error('[ADMIN PRODUCT PUBLISH ERROR]:', err);
      if (err instanceof z.ZodError) {
        setError(err.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(' | '));
      } else {
        const isTxTimeout = err?.message?.includes('expired transaction') || err?.message?.includes('Transaction API error');
        const userMsg = isTxTimeout
          ? 'Product publishing timed out during database write. Please try saving again.'
          : (err.message || 'An unexpected error occurred during database sync.');
        setError(userMsg);
      }
    } finally {
      setIsPending(false);
    }
  };

  const steps = [
    { id: 'identity', title: 'Identity & Details', number: 1 },
    { id: 'variants', title: 'Variant Manager', number: 2 },
    { id: 'merchandising', title: 'Merchandising', number: 3 },
    { id: 'media', title: 'Media Manager', number: 4 },
    { id: 'storytelling', title: 'Storytelling', number: 5 },
    { id: 'audit', title: 'Review & Publish', number: 6 },
  ] as const;

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  const getSectionStatusColor = (sectionId: typeof activeStep) => {
    const secErrors = auditErrors.filter(e => e.section.toLowerCase().includes(sectionId.substring(0, 5)));
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
              {initialData ? 'Modify Product' : 'Create Product Listing'}
            </h1>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step {currentStepIndex + 1} of {steps.length} — {steps[currentStepIndex].title}
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

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: sidebarCollapsed ? '60px 1fr' : '260px 1fr', 
          gap: '32px', 
          flex: 1,
        }}
        className="pim-container-layout"
      >
        
        <aside 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            paddingRight: '16px'
          }}
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
                <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
                  Taxation & Pricing Architecture
                </h2>

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
                    <label className="form-label">GST Tax Percentage (%) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      name="gstPercentage"
                      value={formData.gstPercentage ?? 18}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. 0, 5, 12, 18, 28"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }} className="pim-grid-col2">
                  <div>
                    <label className="form-label">HSN Tax Code <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="hsn"
                      value={formData.hsn || ''}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="e.g. 61091000"
                      required
                    />
                  </div>

                  <div>
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
                <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
                  Product Descriptions & Symbolism
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Short Description / Teaser <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="shortDesc"
                      value={formData.shortDesc || ''}
                      onChange={handleChange}
                      className="admin-input"
                      placeholder="Quick summary teaser shown in catalog cards..."
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Product Description & Symbolism <span style={{ color: '#ef4444' }}>*</span></label>
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
                </div>
              </section>
            </div>
          )}

          {/* STEP 2: Variants */}
          {activeStep === 'variants' && (
            <section className="admin-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
                2. Variant & Size Inventory Manager
              </h2>
              <VariantManager
                variants={variants}
                onChange={setVariants}
                productSlug={formData.slug}
                globalCostPrice={Number(formData.costPrice || 0)}
                globalSellingPrice={Number(formData.mrp || 0)}
                globalComparePrice={formData.comparePrice ? Number(formData.comparePrice) : null}
                globalGstPercentage={Number(formData.gstPercentage || 18.0)}
              />
            </section>
          )}

          {/* STEP 3: Merchandising */}
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

          {/* STEP 4: Media Manager */}
          {activeStep === 'media' && (
            <MediaManager
              formData={formData}
              setFormData={setFormData}
              images={images}
              setImages={setImages}
              variants={variants}
            />
          )}

          {/* STEP 5: Storytelling */}
          {activeStep === 'storytelling' && (
            <ProductStory
              formData={formData}
              onChange={handleChange}
              setFormData={setFormData}
            />
          )}

          {/* STEP 6: Audit & Review */}
          {activeStep === 'audit' && (
            <section className="admin-card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
                5. Review & Publish Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {criticalCount === 0 ? (
                  <div style={{ padding: '24px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '2px', textAlign: 'center' }}>
                    <CheckCircle className="w-12 h-12 text-green-500" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perfect Quality Score</h3>
                    <p style={{ fontSize: '11px', color: 'var(--admin-muted)', margin: 0 }}>This product satisfies all luxury presentation standards and tax rules. Ready to save & publish.</p>
                  </div>
                ) : (
                  <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '2px', textAlign: 'center' }}>
                    <AlertTriangle className="w-12 h-12 text-red-500" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{criticalCount} Critical issues blocking publish</h3>
                    <p style={{ fontSize: '11px', color: 'var(--admin-muted)', margin: 0 }}>You must resolve all critical issues before saving this product to the storefront database.</p>
                  </div>
                )}

                {/* Structured Review Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#c8a46a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Listing Identity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      {formData.frontImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formData.frontImageUrl} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{formData.name || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{formData.slug}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--admin-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Destination: <strong style={{ color: formData.isExclusiveRack ? '#c8a46a' : '#fff' }}>{formData.isExclusiveRack ? 'EXCLUSIVE RACK' : (localDrops.find(d => d.id === formData.dropId)?.name || 'Drop Assigned')}</strong></div>
                      <div>Category: <strong style={{ color: '#fff' }}>{localCategories.find(c => c.id === formData.categoryId)?.name || 'Default'}</strong></div>
                      <div>Collection: <strong style={{ color: '#fff' }}>{formData.collectionName || 'Default Catalog'}</strong></div>
                      <div>Brandmark: <strong style={{ color: '#fff' }}>{formData.brand || 'GODSMOVE'}</strong></div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#c8a46a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pricing & Tax Architecture</span>
                    <div style={{ marginTop: '12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>Selling Price (MRP): <strong style={{ color: '#c8a46a', fontSize: '13px' }}>₹{Number(formData.mrp || 0).toLocaleString('en-IN')}</strong></div>
                      <div>Cost Price: <strong style={{ color: '#fff' }}>{formData.costPrice ? `₹${Number(formData.costPrice).toLocaleString('en-IN')}` : 'N/A'}</strong></div>
                      <div>Strikethrough Price: <strong style={{ color: '#9ca3af' }}>{formData.comparePrice ? `₹${Number(formData.comparePrice).toLocaleString('en-IN')}` : 'N/A'}</strong></div>
                      <div>GST Tax Rate: <strong style={{ color: '#fff' }}>{formData.gstPercentage ?? 18}%</strong></div>
                      <div>HSN Code: <strong style={{ color: '#fff' }}>{formData.hsn || 'N/A'}</strong></div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#c8a46a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inventory & Merchandising</span>
                    <div style={{ marginTop: '12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>Configured Sizes/Variants: <strong style={{ color: '#fff' }}>{variants.length} sizes</strong></div>
                      <div>Total Available Stock: <strong style={{ color: '#22c55e' }}>{variants.reduce((acc, v) => acc + (v.initialStock || 0), 0)} units</strong></div>
                      <div>Featured on Homepage: <strong style={{ color: formData.showOnHomepage ? '#22c55e' : 'var(--admin-muted)' }}>{formData.showOnHomepage ? 'YES' : 'NO'}</strong></div>
                      <div>Badge: <strong style={{ color: '#c8a46a' }}>{formData.featuredBadge || 'None'}</strong></div>
                      <div>Media Attachments: <strong style={{ color: '#fff' }}>{images.length} images</strong></div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="submit"
                      disabled={isPending || criticalCount > 0}
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
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Product</span>
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
