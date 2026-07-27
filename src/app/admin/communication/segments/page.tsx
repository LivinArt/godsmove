import React from 'react';
import { getSegments } from '@/actions/communication.actions';
import SegmentsManagerClient from './SegmentsManagerClient';

export const dynamic = 'force-dynamic';

export default async function CustomerSegmentsPage() {
  const segments = await getSegments();

  return (
    <div>
      <SegmentsManagerClient initialSegments={segments as any} />
    </div>
  );
}
