import React from 'react';
import { getCodSettings } from '@/actions/cod.actions';
import CodConfigClient from './CodConfigClient';

export const dynamic = 'force-dynamic';

export default async function AdminCodSettingsPage() {
  const initialConfig = await getCodSettings();

  return (
    <div style={{ padding: '24px' }}>
      <CodConfigClient initialConfig={initialConfig} />
    </div>
  );
}
