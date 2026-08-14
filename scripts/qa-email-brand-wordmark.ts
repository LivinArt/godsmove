import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import React from 'react';
import { render } from '@react-email/render';
import { GODSMOVE_WORDMARK, GODSMOVE_LOGO_WHITE_URL, GODSMOVE_LOGO_BLACK_URL } from '../src/notifications/email/brand';
import { TEMPLATE_REGISTRY, TemplateResolver } from '../src/notifications/email/templates/registry';
import { Header } from '../src/notifications/email/components/Header';
import { Footer } from '../src/notifications/email/components/Footer';
import { LuxuryEditorialEmailLayout } from '../src/notifications/email/components/LuxuryEditorialEmailLayout';

console.log('\n============================================================');
console.log('GODSMOVƎ EMAIL BRAND WORDMARK PRODUCTION QA SUITE');
console.log('============================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, description: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description}`);
  }
}

async function runQa() {
  // 1. Single Source of Truth Brand Constants & Asset URLs
  console.log('[1] Testing Single Source of Truth Brand Constants & Production Assets...');
  assert(GODSMOVE_WORDMARK === 'GODSMOVƎ', 'GODSMOVE_WORDMARK evaluates to "GODSMOVƎ"');
  assert(GODSMOVE_WORDMARK.includes('Ǝ'), 'GODSMOVE_WORDMARK contains Unicode U+018E (Ǝ)');
  assert(GODSMOVE_LOGO_WHITE_URL === 'https://godsmove.in/images/logo/logo-horizontal-white.png', 'White logo URL is canonical production HTTPS URL');
  assert(GODSMOVE_LOGO_BLACK_URL === 'https://godsmove.in/images/logo/logo-horizontal-black.png', 'Black logo URL is canonical production HTTPS URL');
  assert(!GODSMOVE_LOGO_WHITE_URL.includes('localhost') && !GODSMOVE_LOGO_WHITE_URL.includes('127.0.0.1'), 'White logo URL has no localhost references');
  assert(!GODSMOVE_LOGO_WHITE_URL.includes('/_next/image'), 'White logo URL does NOT use /_next/image pipeline');

  // 2. Component Header & Footer Rendering
  console.log('\n[2] Testing Core Header & Footer Components...');
  const headerHtml = await render(React.createElement(Header, {}));
  assert(headerHtml.includes('src="https://godsmove.in/images/logo/logo-horizontal-white.png"'), 'Header renders absolute HTTPS logo URL');
  assert(headerHtml.includes('alt="GODSMOVƎ"'), 'Header logo image has accessible alt="GODSMOVƎ"');
  assert(headerHtml.includes('width="230"'), 'Header logo image has explicit width="230"');
  assert(headerHtml.includes('height="36"'), 'Header logo image has explicit height="36"');
  assert(headerHtml.includes('STATEMENT APPAREL &amp; ARCHIVAL CUTS') || headerHtml.includes('STATEMENT APPAREL & ARCHIVAL CUTS'), 'Header retains tagline STATEMENT APPAREL & ARCHIVAL CUTS');
  assert(headerHtml.includes('https://godsmove.in'), 'Header preserves domain URL https://godsmove.in');

  const footerHtml = await render(React.createElement(Footer, {}));
  assert(footerHtml.includes('GODSMOVƎ'), 'Footer renders "GODSMOVƎ" copyright wordmark');
  assert(footerHtml.includes('support@godsmove.in'), 'Footer preserves support email support@godsmove.in');
  assert(footerHtml.includes('https://godsmove.in'), 'Footer preserves website URL https://godsmove.in');

  // 3. Editorial Layout Rendering
  console.log('\n[3] Testing Luxury Editorial Email Layout...');
  const editorialHtml = await render(
    React.createElement(LuxuryEditorialEmailLayout, {
      headline: 'Archival Collection Launch',
      customerName: 'Aarav Sharma',
      editorialNote: 'Welcome to the new series.',
      ctaText: 'Explore Collection',
      ctaUrl: 'https://godsmove.in/shop',
      children: React.createElement('div', null, 'Content'),
    })
  );
  const cleanEditorialHtml = editorialHtml.replace(/<!--\s*-->/g, '');
  assert(
    cleanEditorialHtml.includes('src="https://godsmove.in/images/logo/logo-horizontal-black.png"') ||
    cleanEditorialHtml.includes('src="https://godsmove.in/images/logo/logo-horizontal-white.png"'),
    'Editorial layout renders canonical production logo asset'
  );
  assert(cleanEditorialHtml.includes('alt="GODSMOVƎ"'), 'Editorial layout logo image has alt="GODSMOVƎ"');
  assert(cleanEditorialHtml.includes('— The GODSMOVƎ Archival Team'), 'Sign-off renders "— The GODSMOVƎ Archival Team"');
  assert(cleanEditorialHtml.includes('GODSMOVƎ ARCHIVAL DIVISION'), 'Footer division renders "GODSMOVƎ ARCHIVAL DIVISION"');
  assert(cleanEditorialHtml.includes('support@godsmove.in'), 'Editorial layout preserves support@godsmove.in');

  // 4. Registry Subject Line Builders & Sender Config
  console.log('\n[4] Testing Registry Subject Line Builders...');
  const testPayload = { orderNumber: '10042', returnId: 'RET-88', productName: 'Bespoke Oversized Hoodie' };
  
  const orderSubject = TEMPLATE_REGISTRY.ORDER_CREATED.subjectBuilder(testPayload);
  assert(orderSubject.includes('GODSMOVƎ'), `ORDER_CREATED subject has "GODSMOVƎ": "${orderSubject}"`);
  assert(!orderSubject.includes('Your GODSMOVE Order'), 'ORDER_CREATED subject does NOT have plain "Your GODSMOVE Order"');

  const paymentSubject = TEMPLATE_REGISTRY.PAYMENT_CONFIRMED.subjectBuilder(testPayload);
  assert(paymentSubject.includes('GODSMOVƎ'), `PAYMENT_CONFIRMED subject has "GODSMOVƎ": "${paymentSubject}"`);

  const returnSubject = TEMPLATE_REGISTRY.RETURN_APPROVED.subjectBuilder(testPayload);
  assert(returnSubject.includes('GODSMOVƎ'), `RETURN_APPROVED subject has "GODSMOVƎ": "${returnSubject}"`);

  const welcomeSubject = TEMPLATE_REGISTRY.WELCOME.subjectBuilder(testPayload);
  assert(welcomeSubject.includes('GODSMOVƎ'), `WELCOME subject has "GODSMOVƎ": "${welcomeSubject}"`);

  const senderConfig = TEMPLATE_REGISTRY.ORDER_CREATED.senderConfig;
  assert(senderConfig.from === 'GODSMOVƎ <support@godsmove.in>', `Sender identity is "GODSMOVƎ <support@godsmove.in>": "${senderConfig.from}"`);
  assert(senderConfig.replyTo === 'support@godsmove.in', `Reply-to is "support@godsmove.in": "${senderConfig.replyTo}"`);

  // 5. Template Rendering QA across Event Types
  console.log('\n[5] Testing Full Template Render Output across Event Types...');
  const sampleEvents: Array<keyof typeof TEMPLATE_REGISTRY> = [
    'WELCOME',
    'ORDER_CREATED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'PAYMENT_CONFIRMED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'WALLET_CREDITED',
    'WALLET_DEBITED',
  ];

  for (const eventName of sampleEvents) {
    const templateDef = TemplateResolver.resolve(eventName);
    const renderedHtml = await render(
      React.createElement(templateDef.component, {
        customerName: 'Aarav',
        orderNumber: '1001',
        returnId: 'RET-01',
        amount: 1500,
        newBalance: 4500,
        items: [{ title: 'Statement Piece', size: 'L', quantity: 1, price: 1500 }],
      })
    );
    assert(renderedHtml.includes('src="https://godsmove.in/images/logo/logo-horizontal-white.png"'), `${eventName} template renders production logo asset`);
    assert(renderedHtml.includes('GODSMOVƎ'), `${eventName} template HTML renders "GODSMOVƎ"`);
    assert(renderedHtml.includes('support@godsmove.in'), `${eventName} template HTML preserves support@godsmove.in`);
    assert(!renderedHtml.includes('localhost'), `${eventName} template HTML has no localhost URLs`);
    assert(!renderedHtml.includes('/_next/image'), `${eventName} template HTML has no /_next/image URLs`);
  }

  // Final Summary
  console.log('\n============================================================');
  console.log(`QA RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runQa().catch((err) => {
  console.error('QA Script Error:', err);
  process.exit(1);
});
