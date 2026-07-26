import React from 'react';

export interface DynamicHtmlTemplateProps {
  htmlContent: string;
  payload?: Record<string, any>;
}

export const DynamicHtmlTemplate: React.FC<DynamicHtmlTemplateProps> = ({ htmlContent, payload = {} }) => {
  // Perform dynamic placeholder substitution (e.g. {{customerName}}, {{orderNumber}}, {{total}})
  let processedHtml = htmlContent;

  Object.entries(payload).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedHtml = processedHtml.replace(regex, String(val));
    }
  });

  return (
    <div
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      style={{ width: '100%', margin: '0 auto', fontFamily: 'sans-serif' }}
    />
  );
};

export default DynamicHtmlTemplate;
