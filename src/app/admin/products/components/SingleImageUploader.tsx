'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, RefreshCw, ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/supabase/storage';
import styles from './SingleImageUploader.module.css';

interface SingleImageUploaderProps {
  label: string;
  description?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
}

export function SingleImageUploader({
  label,
  description,
  value,
  onChange,
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>

      {value ? (
        /* ── Preview State ── */
        <div className={styles.previewCard}>
          {value.split('.').pop()?.toLowerCase()?.match(/mp4|webm|ogg|mov/) || value.includes('video') ? (
            <video src={value} className={styles.previewImage} autoPlay muted loop playsInline style={{ objectFit: 'cover' }} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt={label} className={styles.previewImage} />
          )}
          <div className={styles.previewOverlay}>
            <button
              type="button"
              className={styles.overlayBtn}
              onClick={triggerFileSelect}
              disabled={isUploading}
              title="Replace image"
            >
              {isUploading ? (
                <Loader2 size={16} className={styles.spin} />
              ) : (
                <RefreshCw size={16} />
              )}
              <span>{isUploading ? 'Uploading…' : 'Replace'}</span>
            </button>
            <button
              type="button"
              className={`${styles.overlayBtn} ${styles.removeBtn}`}
              onClick={handleRemove}
              disabled={isUploading}
              title="Remove image"
            >
              <X size={16} />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Upload Drop Zone ── */
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={isUploading ? undefined : triggerFileSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect(); }}
          aria-label={`Upload ${label}`}
        >
          <div className={styles.dropContent}>
            {isUploading ? (
              <>
                <Loader2 size={32} className={`${styles.dropIcon} ${styles.spin}`} />
                <span className={styles.dropTitle}>Uploading…</span>
              </>
            ) : (
              <>
                <div className={styles.iconWrap}>
                  {isDragging ? (
                    <ImageIcon size={28} className={styles.dropIcon} />
                  ) : (
                    <Upload size={28} className={styles.dropIcon} />
                  )}
                </div>
                <span className={styles.dropTitle}>
                  {isDragging ? 'Drop to upload' : 'Click or drag & drop'}
                </span>
                <span className={styles.dropHint}>PNG, JPEG, WebP, GIF, MP4 · Max 50MB</span>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className={styles.errorMsg}>{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif, video/mp4, video/webm, video/ogg, video/quicktime"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
