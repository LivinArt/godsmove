import React from 'react';
import { notFound } from 'next/navigation';
import { getSystemTemplateDetails, SYSTEM_TEMPLATE_CARDS } from '@/actions/communication.actions';
import { NotificationEvent } from '@/notifications/types/notification.types';
import TemplateEditorClient from './TemplateEditorClient';

export const dynamic = 'force-dynamic';

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const validCard = SYSTEM_TEMPLATE_CARDS.find((c) => c.id === id);
  if (!validCard) {
    notFound();
  }

  const details = await getSystemTemplateDetails(id as NotificationEvent);

  return (
    <div>
      <TemplateEditorClient
        templateId={id as NotificationEvent}
        cardDef={validCard}
        activeSubject={details.activeVersion?.subject || `${validCard.name} | GODSMOVE`}
        initialHtml={details.renderedHtml}
        versionNumber={details.activeVersion?.version || 1}
      />
    </div>
  );
}
