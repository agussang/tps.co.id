/**
 * FAQ Component
 * Accordion FAQ section
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

  const bgClasses: Record<string, string> = {
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  const faqId = `faq-${Math.random().toString(36).substr(2, 9)}`;

  // Split items into columns if columns = 2
  const midpoint = Math.ceil(items.length / 2);
  const col1Items = columns === 2 ? items.slice(0, midpoint) : items;
  const col2Items = columns === 2 ? items.slice(midpoint) : [];

  const renderFAQItem = (item: FAQItem, index: number, colOffset: number = 0) => {
    const itemId = `${faqId}-${colOffset + index}`;
    return `
      <div class="faq-item border-b border-gray-200">
        <button
          type="button"
          class="faq-toggle w-full py-5 flex items-center justify-between text-left"
          onclick="toggleFAQ('${itemId}')"
          aria-expanded="false"
          aria-controls="${itemId}-content"
        >
          <span class="text-[16px] font-semibold text-gray-900 pr-4">
            ${escapeHtml(item.question)}
          </span>
          <svg id="${itemId}-icon" class="w-5 h-5 text-[#0475BC] flex-shrink-0 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="${itemId}-content" class="faq-content hidden pb-5">
          <div class="text-[15px] text-gray-600 leading-relaxed prose max-w-none">
            ${item.answer}
          </div>
        </div>
      </div>
    `;
  };

  return `
    <section class="faq-section py-12 lg:py-20 ${bgClasses[background]} section-animate">
      <div class="max-w-[1100px] mx-auto px-4">
        ${title || subtitle ? `
          <div class="text-center mb-10">
            ${subtitle ? `
              <span class="inline-block px-3 py-1 mb-3 text-sm font-medium text-[#0475BC] bg-[#0475BC]/10 rounded-full">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
          </div>
        ` : ''}

        <div class="${columns === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-x-10' : 'max-w-3xl mx-auto'}">
          ${columns === 2 ? `
            <div class="faq-column">
              ${col1Items.map((item, idx) => renderFAQItem(item, idx, 0)).join('')}
            </div>
            <div class="faq-column">
              ${col2Items.map((item, idx) => renderFAQItem(item, idx, midpoint)).join('')}
            </div>
          ` : `
            <div class="faq-list">
              ${col1Items.map((item, idx) => renderFAQItem(item, idx)).join('')}
            </div>
          `}
        </div>
      </div>

      <script>
        window.toggleFAQ = function(id) {
          const content = document.getElementById(id + '-content');
          const icon = document.getElementById(id + '-icon');
          const isOpen = !content.classList.contains('hidden');

          if (isOpen) {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
          } else {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
          }
        };
      </script>
    </section>
  `;
}
