import React from 'react';
import { getEmailLedger } from '@/actions/communication.actions';
import LedgerClient from './LedgerClient';

export const dynamic = 'force-dynamic';

export default async function CommunicationLedgerPage() {
  const ledgerData = await getEmailLedger(1, 50);

  return (
    <div>
      <LedgerClient
        records={ledgerData.records as any}
        total={ledgerData.total}
        page={ledgerData.page}
        totalPages={ledgerData.totalPages}
      />
    </div>
  );
}
