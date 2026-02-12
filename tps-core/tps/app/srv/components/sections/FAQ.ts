/**
 * FAQ Component
 * Accordion FAQ section
 * IMPORTANT: Uses ONLY inline styles (no Tailwind) to avoid Prasi CSS conflicts
 */

import { escapeHtml } from '../html';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  background?: 'white' | 'gray';
  columns?: 1 | 2;
}

export function FAQ({
  title,
  subtitle,
  items,
  background = 'white',
  columns = 1,
}: FAQProps): string {
  if (!items || items.length === 0) return '';

  const bgColors: Record<string, string> = { white: '#ffffff', gray: '#f9fafb' };
  const faqId = `faq-${Math.random().toString(36).substr(2, 9)}`;

  const midpoint = Math.ceil(items.length / 2);
  const col1Items = columns === 2 ? items.slice(0, midpoint) : items;
  const col2Items = columns === 2 ? items.slice(midpoint) : [];

  const renderFAQItem = (item: FAQItem, index: number, colOffset: number = 0) => {
    const itemId = `${faqId}-${colOffset + index}`;
    return `
      <div style="border-bottom: 1px solid #e5e7eb;">
        <button
          type="button"
          style="width: 100%; padding: 1.25rem 0; display: flex; align-items: center; justify-content: space-between; text-align: left; background: none; border: none; cursor: pointer;"
          onclick="window.__toggleFAQ && window.__toggleFAQ('${itemId}')"
        >
          <span style="font-size: 1rem; font-weight: 600; color: #111827; padding-right: 1rem;">
            ${escapeHtml(item.question)}
          </span>
          <svg id="${itemId}-icon" style="width: 1.25rem; height: 1.25rem; color: #0475BC; flex-shrink: 0; transition: transform 0.2s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${itemId}-content" style="display: none; padding-bottom: 1.25rem;">
          <div style="font-size: 0.9375rem; color: #4b5563; line-height: 1.75;">
            ${item.answer}
          </div>
        </div>
      </div>
    `;
  };

  const columnStyle = columns === 2
    ? 'display: grid; grid-template-columns: 1fr 1fr; gap: 0 2.5rem;'
    : 'max-width: 48rem; margin: 0 auto;';

  return `
    <section style="padding: 3rem 1rem; background: ${bgColors[background]};">
      <div style="max-width: 1100px; margin: 0 auto;">
        ${title || subtitle ? `
          <div style="text-align: center; margin-bottom: 2.5rem;">
            ${subtitle ? `
              <span style="display: inline-block; padding: 0.25rem 0.75rem; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 500; color: #0475BC; background: rgba(4,117,188,0.1); border-radius: 9999px;">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 style="font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0;">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
          </div>
        ` : ''}

        <div style="${columnStyle}">
          ${columns === 2 ? `
            <div>${col1Items.map((item, idx) => renderFAQItem(item, idx, 0)).join('')}</div>
            <div>${col2Items.map((item, idx) => renderFAQItem(item, idx, midpoint)).join('')}</div>
          ` : `
            <div>${col1Items.map((item, idx) => renderFAQItem(item, idx)).join('')}</div>
          `}
        </div>
      </div>

      <script>
        window.__toggleFAQ = function(id) {
          var content = document.getElementById(id + '-content');
          var icon = document.getElementById(id + '-icon');
          if (!content || !icon) return;
          var isOpen = content.style.display !== 'none';
          content.style.display = isOpen ? 'none' : 'block';
          icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        };
      </script>
    </section>
  `;
}
