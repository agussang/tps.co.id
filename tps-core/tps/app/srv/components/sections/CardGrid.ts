/**
 * CardGrid Component
 * Grid of cards with icon, title, and description
 */

import { escapeHtml, img } from '../html';

export interface CardItem {
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  url?: string;
}

export interface CardGridProps {
  title?: string;
  subtitle?: string;
  cards: CardItem[];
  columns?: 2 | 3 | 4;
  style?: 'default' | 'bordered' | 'shadowed' | 'filled';
  background?: 'white' | 'gray' | 'blue';
  iconPosition?: 'top' | 'left';
}

export function CardGrid({
  title,
  subtitle,
  cards,
  columns = 3,
  style = 'shadowed',
  background = 'white',
  iconPosition = 'top',
}: CardGridProps): string {
  if (!cards || cards.length === 0) return '';

  const bgColors: Record<string, string> = {
    white: '#ffffff',
    gray: '#f9fafb',
    blue: '#f0f9ff',
  };

  const sectionStyle = `
    background: ${bgColors[background]};
    padding: 3rem 1rem;
  `.trim();

  const containerStyle = `
    max-width: 1100px;
    margin: 0 auto;
  `.trim();

  const gridStyle = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  `.trim();

  const getCardStyle = () => {
    let base = `
      background: ${style === 'filled' ? '#0475BC' : '#ffffff'};
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    if (style === 'bordered') {
      base += 'border: 1px solid #e5e7eb;';
    } else if (style === 'shadowed') {
      base += 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);';
    }
    return base.trim();
  };

  return `
    <section style="${sectionStyle}">
      <div style="${containerStyle}">
        ${title || subtitle ? `
          <div style="text-align: center; margin-bottom: 2.5rem;">
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
                line-height: 1.3;
              ">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
          </div>
        ` : ''}

        <div style="${gridStyle}">
          ${cards.map(card => {
            const isLink = card.url && card.url !== '#';
            const Tag = isLink ? 'a' : 'div';
            const linkAttrs = isLink ? `href="${escapeHtml(card.url)}"` : '';
            const textColor = style === 'filled' ? '#ffffff' : '#111827';
            const descColor = style === 'filled' ? 'rgba(255,255,255,0.8)' : '#4b5563';

            return `
              <${Tag} ${linkAttrs} style="${getCardStyle()}; ${isLink ? 'cursor: pointer; text-decoration: none; display: block;' : ''}">
                ${card.icon || card.image ? `
                  <div style="margin-bottom: 1rem;">
                    ${card.image ? `
                      <div style="width: 4rem; height: 4rem; border-radius: 0.5rem; overflow: hidden;">
                        <img src="${img(card.image)}" alt="${escapeHtml(card.title)}" style="width: 100%; height: 100%; object-fit: cover;" />
                      </div>
                    ` : `
                      <div style="
                        width: 3.5rem;
                        height: 3.5rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 0.5rem;
                        background: ${style === 'filled' ? 'rgba(255,255,255,0.2)' : 'rgba(4, 117, 188, 0.1)'};
                      ">
                        <img src="${img(card.icon)}" alt="" style="width: 2rem; height: 2rem;" />
                      </div>
                    `}
                  </div>
                ` : ''}

                <h3 style="
                  font-size: 1.125rem;
                  font-weight: 600;
                  color: ${textColor};
                  margin-bottom: 0.5rem;
                  line-height: 1.4;
                ">
                  ${escapeHtml(card.title)}
                </h3>

                ${card.description ? `
                  <p style="
                    font-size: 0.9375rem;
                    color: ${descColor};
                    line-height: 1.6;
                    margin: 0;
                  ">
                    ${escapeHtml(card.description)}
                  </p>
                ` : ''}

                ${isLink ? `
                  <div style="
                    margin-top: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: ${style === 'filled' ? '#ffffff' : '#0475BC'};
                  ">
                    <span>Selengkapnya</span>
                    <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                ` : ''}
              </${Tag}>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}
