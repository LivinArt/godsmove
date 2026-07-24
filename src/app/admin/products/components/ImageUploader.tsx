'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';
import { uploadImage } from '@/lib/supabase/storage';
import type { ProductImageInput } from '@/lib/validations/product';

interface ImageUploaderProps {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
  guidance?: {
    orientation?: string;
    recommendedDimensions?: string;
    aspectRatio?: string;
    maxFileSize?: string;
    acceptedFormats?: string;
  };
}

export function ImageUploader({ images, onChange, guidance }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const newImages = [...images];
      for (const file of files) {
        const url = await uploadImage(file);
        newImages.push({
          url,
          position: newImages.length,
          isCover: newImages.length === 0, // First image is cover by default
        });
      }
      onChange(newImages);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Ensure one image is cover if possible
    if (newImages.length > 0 && !newImages.some((i) => i.isCover)) {
      newImages[0].isCover = true;
    }
    // Update positions
    onChange(newImages.map((img, i) => ({ ...img, position: i })));
  };

  const setAsCover = (index: number) => {
    onChange(
      images.map((img, i) => ({
        ...img,
        isCover: i === index,
      }))
    );
  };

  // Simple move left/right for reordering
  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;

    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    // Reassign positions
    onChange(newImages.map((img, i) => ({ ...img, position: i })));
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {images.map((img, i) => (
          <div key={img.url} style={{ position: 'relative', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1/1' }}>
            {img.url.split('.').pop()?.toLowerCase()?.match(/mp4|webm|ogg|mov/) || img.url.includes('video') ? (
              <video src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={img.url} alt={img.alt || `Product image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            
            {/* Overlay actions */}
            <div 
              style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: 0, transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              <div className="flex gap-2">
                {i > 0 && (
                  <button type="button" onClick={() => moveImage(i, 'left')} style={{ padding: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}>
                    &larr;
                  </button>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => moveImage(i, 'right')} style={{ padding: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}>
                    &rarr;
                  </button>
                )}
              </div>
              {!img.isCover && (
                <button type="button" onClick={() => setAsCover(i)} style={{ padding: '4px 8px', background: '#fff', color: '#000', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px' }}>
                  Set as Cover
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeImage(i)}
              style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', color: '#fff' }}
            >
              <X className="w-4 h-4" />
            </button>

            {img.isCover && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '2px 6px', background: 'var(--admin-accent)', color: '#000', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '2px', letterSpacing: '0.05em' }}>
                Cover
              </div>
            )}
          </div>
        ))}

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            aspectRatio: '1/1', background: 'var(--admin-surface)', border: '1px dashed var(--admin-border)', borderRadius: '8px', 
            cursor: 'pointer', opacity: isUploading ? 0.5 : 1
          }}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-muted animate-spin mb-4" />
          ) : (
            <Upload className="w-6 h-6 text-muted mb-4" />
          )}
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--admin-muted)' }}>
            {isUploading ? 'Uploading...' : 'Upload Media'}
          </span>
        </button>
      </div>

      {/* Image Upload Guidelines (Entire Admin Task 3) */}
      <div style={{
        marginTop: '12px',
        padding: '10px 14px',
        background: 'rgba(200, 164, 106, 0.05)',
        border: '1px solid rgba(200, 164, 106, 0.2)',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#c8a46a',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 16px',
        lineHeight: 1.5
      }}>
        <span><strong style={{ color: 'var(--text-primary, #f5f1e8)' }}>Orientation:</strong> {guidance?.orientation || 'Portrait'}</span>
        <span><strong style={{ color: 'var(--text-primary, #f5f1e8)' }}>Dimensions:</strong> {guidance?.recommendedDimensions || '1600 × 2000 px'}</span>
        <span><strong style={{ color: 'var(--text-primary, #f5f1e8)' }}>Ratio:</strong> {guidance?.aspectRatio || '4:5'}</span>
        <span><strong style={{ color: 'var(--text-primary, #f5f1e8)' }}>Max Size:</strong> {guidance?.maxFileSize || '10 MB'}</span>
        <span><strong style={{ color: 'var(--text-primary, #f5f1e8)' }}>Formats:</strong> {guidance?.acceptedFormats || 'JPG, PNG, WEBP'}</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm, video/ogg, video/quicktime"
        multiple
        style={{ display: 'none' }}
      />
    </div>
  );
}
