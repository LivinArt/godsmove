import React from 'react';
import { getSystemTemplateCards } from '@/actions/communication.actions';
import TemplatesManagerClient from './TemplatesManagerClient';

export const dynamic = 'force-dynamic';

export default async function SystemTemplatesPage() {
  const cards = await getSystemTemplateCards();

  return (
    <div>
      <TemplatesManagerClient cards={cards} />
    </div>
  );
}
