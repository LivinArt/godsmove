import React from 'react';

export default function JsonLd({ schema }: { schema: Record<string, any> | Array<Record<string, any>> }) {
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  );
}
