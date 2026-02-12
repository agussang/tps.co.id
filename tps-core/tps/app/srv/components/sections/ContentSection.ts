/**
 * ContentSection Component
 * Rich text content area dengan styling yang bersih
 */

import { escapeHtml } from '../html';

export interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  content: string; // HTML content from Quill editor
  align?: 'left' | 'center';
  background?: 'white' | 'gray' | 'blue';
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
}

export function ContentSection({
  title,
  subtitle,
  content,
  align = 'left',
  background = 'white',
  maxWidth = 'medium',
}: ContentSectionProps): string {
  if (!content && !title) return '';

  const bgColors: Record<string, string> = {
    white: '#ffffff',
    gray: '#f9fafb',
    blue: '#f0f9ff',
  };

  const maxWidths: Record<string, string> = {
    narrow: '672px',
    medium: '896px',
    wide: '1024px',
    full: '1100px',
  };

  const containerStyle = `
    background: ${bgColors[background]};
    padding: 3rem 1rem;
  `.trim();

  const innerStyle = `
    max-width: 1100px;
    margin: 0 auto;
  `.trim();

  const contentBoxStyle = `
    max-width: ${maxWidths[maxWidth]};
    ${align === 'center' ? 'margin: 0 auto; text-align: center;' : ''}
  `.trim();

  return `
    <section style="${containerStyle}">
      <div style="${innerStyle}">
        <div style="${contentBoxStyle}">
          ${subtitle ? `
            <span style="
              display: inline-block;
              padding: 0.25rem 0.75rem;
              margin-bottom: 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              color: #0475BC;
              background: rgba(4, 117, 188, 0.1);
              border-radius: 9999px;
            ">
              ${escapeHtml(subtitle)}
            </span>
          ` : ''}

          ${title ? `
            <h2 style="
              font-size: 1.75rem;
              font-weight: 700;
              color: #111827;
              margin-bottom: 1.5rem;
              line-height: 1.3;
            ">
              ${escapeHtml(title)}
            </h2>
          ` : ''}

          <div style="
            color: #374151;
            font-size: 1rem;
            line-height: 1.75;
          ">
            ${content}
          </div>
        </div>
      </div>
    </section>
  `;
}
