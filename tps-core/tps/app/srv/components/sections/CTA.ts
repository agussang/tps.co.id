/**
 * CTA (Call to Action) Component
 * Banner section with action buttons
 */

import { escapeHtml, img } from '../html';

export interface CTAProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  background?: 'blue' | 'dark' | 'gradient' | 'image';
  backgroundImage?: string;
  align?: 'left' | 'center';
}

export function CTA({
  title,
  description,
  buttonText,
  buttonUrl,
  secondaryButtonText,
  secondaryButtonUrl,
  background = 'blue',
  backgroundImage,
  align = 'center',
}: CTAProps): string {
  if (!title) return '';

  const getBgStyle = () => {
    switch (background) {
      case 'blue':
        return 'background: #0475BC;';
      case 'dark':
        return 'background: #111827;';
      case 'gradient':
        return 'background: linear-gradient(to right, #0475BC, #0366a3);';
      case 'image':
        return 'position: relative;';
      default:
        return 'background: #0475BC;';
    }
  };

  const sectionStyle = `
    ${getBgStyle()}
    padding: 4rem 1rem;
  `.trim();

  const containerStyle = `
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 10;
  `.trim();

  const contentStyle = `
    ${align === 'center' ? 'text-align: center; max-width: 800px; margin: 0 auto;' : 'max-width: 640px;'}
  `.trim();

  const buttonStyle = `
    display: inline-flex;
    align-items: center;
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: #0475BC;
    background: #ffffff;
    border-radius: 0.5rem;
    text-decoration: none;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    transition: background 0.2s;
  `.trim();

  const secondaryButtonStyle = `
    display: inline-flex;
    align-items: center;
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    background: transparent;
    border: 2px solid #ffffff;
    border-radius: 0.5rem;
    text-decoration: none;
    transition: background 0.2s;
  `.trim();

  return `
    <section style="${sectionStyle}">
      ${background === 'image' && backgroundImage ? `
        <div style="position: absolute; inset: 0;">
          <img src="${img(backgroundImage)}" alt="" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; inset: 0; background: rgba(4, 117, 188, 0.85);"></div>
        </div>
      ` : ''}

      <div style="${containerStyle}">
        <div style="${contentStyle}">
          <h2 style="
            font-size: 1.75rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 1rem;
            line-height: 1.3;
          ">
            ${escapeHtml(title)}
          </h2>

          ${description ? `
            <p style="
              font-size: 1.125rem;
              color: rgba(255,255,255,0.9);
              margin-bottom: 2rem;
              line-height: 1.6;
            ">
              ${escapeHtml(description)}
            </p>
          ` : ''}

          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            ${align === 'center' ? 'justify-content: center;' : ''}
          ">
            <a href="${escapeHtml(buttonUrl)}" style="${buttonStyle}">
              ${escapeHtml(buttonText)}
              <svg style="width: 1rem; height: 1rem; margin-left: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>

            ${secondaryButtonText ? `
              <a href="${escapeHtml(secondaryButtonUrl || '#')}" style="${secondaryButtonStyle}">
                ${escapeHtml(secondaryButtonText)}
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
}
