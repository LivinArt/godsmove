'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publishTemplateVersion } from '@/actions/communication.actions';
import { NotificationEvent } from '@/notifications/types/notification.types';

interface Props {
  templateId: NotificationEvent;
  cardDef: {
    name: string;
    trigger: string;
    category: string;
    variables: string[];
  };
  activeSubject: string;
  initialHtml: string;
  versionNumber: number;
}

export default function TemplateEditorClient({ templateId, cardDef, activeSubject, initialHtml, versionNumber }: Props) {
  const router = useRouter();

  const [subject, setSubject] = useState<string>(activeSubject);
  const [htmlContent, setHtmlContent] = useState<string>(initialHtml);
  const [editorMode, setEditorMode] = useState<'code' | 'visual'>('code');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Insert variable into active editor content
  const handleInsertVariable = (varName: string) => {
    const varTag = `{{${varName}}}`;
    setHtmlContent((prev) => prev + ` ${varTag} `);
  };

  const handlePublish = async () => {
    if (!subject.trim()) {
      alert('Subject line is required.');
      return;
    }
    if (!htmlContent.trim()) {
      alert('HTML body content is required.');
      return;
    }

    setIsPublishing(true);
    try {
      await publishTemplateVersion({
        templateId,
        subject,
        bodyHtml: htmlContent,
      });
      alert(`Template version v${versionNumber + 1}.0 published successfully!`);
      router.push('/admin/communication/templates');
    } catch (err: any) {
      alert('Failed to publish template: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '16px 20px' }}>
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/admin/communication/templates" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>
              ← System Templates
            </Link>
            <span style={{ color: '#71717a' }}>/</span>
            <span style={{ color: '#c8a46a', fontSize: '12px', fontWeight: 800 }}>{cardDef.name}</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0' }}>
            System Template Editor — {templateId}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/admin/communication/templates')}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#a1a1aa', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            style={{ padding: '8px 20px', fontSize: '12px', fontWeight: 800, backgroundColor: '#c8a46a', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {isPublishing ? 'Publishing Version...' : `Publish New Version (v${versionNumber + 1}.0)`}
          </button>
        </div>
      </div>

      {/* Subject Line & Available Variables */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Subject input */}
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#c8a46a', letterSpacing: '0.05em', marginBottom: '8px' }}>
            EMAIL SUBJECT LINE
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Order Confirmed: {{orderNumber}} | GODSMOVE"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13px',
              backgroundColor: '#18181b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              color: '#ffffff',
              outline: 'none',
              fontWeight: 600,
            }}
          />
        </div>

        {/* Variable Pills */}
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.05em', marginBottom: '8px' }}>
            INSERT DYNAMIC VARIABLES (CLICK TO ADD)
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {cardDef.variables.map((v) => (
              <button
                key={v}
                onClick={() => handleInsertVariable(v)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(96, 165, 250, 0.1)',
                  color: '#60a5fa',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                + &#123;&#123;{v}&#125;&#125;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Side-by-Side Live Previewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Code Editor */}
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8c857b', letterSpacing: '0.05em' }}>
              HTML TEMPLATE SOURCE CODE
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setEditorMode('code')}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 800, borderRadius: '4px', border: 'none', backgroundColor: editorMode === 'code' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)', color: editorMode === 'code' ? '#000000' : '#ffffff', cursor: 'pointer' }}
              >
                HTML Code
              </button>
            </div>
          </div>

          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={22}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '12px',
              fontFamily: 'Consolas, Monaco, monospace',
              backgroundColor: '#09090b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#38bdf8',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Right: Live Brand-Controlled Inbox Preview */}
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8c857b', letterSpacing: '0.05em' }}>
              LIVE INBOX PREVIEW
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setPreviewDevice('desktop')}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 800, borderRadius: '4px', border: 'none', backgroundColor: previewDevice === 'desktop' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)', color: previewDevice === 'desktop' ? '#000000' : '#ffffff', cursor: 'pointer' }}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 800, borderRadius: '4px', border: 'none', backgroundColor: previewDevice === 'mobile' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)', color: previewDevice === 'mobile' ? '#000000' : '#ffffff', cursor: 'pointer' }}
              >
                Mobile
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <iframe
              title="Live HTML Preview"
              srcDoc={htmlContent}
              style={{
                width: previewDevice === 'desktop' ? '100%' : '375px',
                height: '460px',
                border: previewDevice === 'mobile' ? '10px solid #27272a' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: previewDevice === 'mobile' ? '24px' : '6px',
                backgroundColor: '#000000',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
