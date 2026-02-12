/**
 * HeroSection Component
 * Full-width hero banner dengan title, subtitle, image/video background, dan CTA
 * Uses inline styles to avoid CSS conflicts with Prasi
 */

import { escapeHtml, img } from '../html';

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  video?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  overlay?: boolean;
  align?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
}

export function HeroSection({
  title,
  subtitle,
  description,
  image,
  video,
  ctaText,
  ctaUrl,
  ctaSecondaryText,
  ctaSecondaryUrl,
  overlay = true,
  align = 'center',
  height = 'medium',
}: HeroSectionProps): string {
  if (!title && !subtitle && !image && !video) return '';

  const heights: Record<string, string> = {
    small: '300px',
    medium: '400px',
    large: '500px',
    full: '100vh',
  };

  const alignStyles: Record<string, { text: string; items: string; justify: string }> = {
    left: { text: 'left', items: 'flex-start', justify: 'flex-start' },
    center: { text: 'center', items: 'center', justify: 'center' },
    right: { text: 'right', items: 'flex-end', justify: 'flex-end' },
  };

  const backgroundImage = image ? img(image) : '';
  const hasBackground = backgroundImage || video;
  const alignStyle = alignStyles[align] || alignStyles.center;

  const sectionStyle = `
    position: relative;
    min-height: ${heights[height]};
    display: flex;
    align-items: center;
  `.trim();

  const overlayStyle = `
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.4));
  `.trim();

  const solidBgStyle = `
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom right, #0475BC, #0366a3);
  `.trim();

  const contentContainerStyle = `
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 3rem 1rem;
  `.trim();

  const contentInnerStyle = `
    display: flex;
    flex-direction: column;
    align-items: ${alignStyle.items};
    text-align: ${alignStyle.text};
    max-width: 768px;
    ${align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin-left: auto;' : ''}
  `.trim();

  const subtitleStyle = `
    display: inline-block;
    padding: 0.375rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #ffffff;
    background: rgba(255,255,255,0.2);
    border-radius: 9999px;
  `.trim();

  const titleStyle = `
    font-size: 2rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 1rem;
    line-height: 1.2;
    word-wrap: break-word;
    overflow-wrap: break-word;
  `.trim();

  const descriptionStyle = `
    font-size: 1.125rem;
    color: rgba(255,255,255,0.9);
    margin-bottom: 2rem;
    line-height: 1.75;
    word-wrap: break-word;
    overflow-wrap: break-word;
  `.trim();

  const buttonContainerStyle = `
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: ${alignStyle.justify};
  `.trim();

  const primaryButtonStyle = `
    display: inline-flex;
    align-items: center;
    padding: 0.875rem 1.5rem;
    font-size: 0.9375rem;
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
    padding: 0.875rem 1.5rem;
    font-size: 0.9375rem;
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
      ${hasBackground ? `
        <!-- Background -->
        <div style="position: absolute; inset: 0; overflow: hidden;">
          ${video ? `
            <video
              autoplay
              muted
              loop
              playsinline
              style="width: 100%; height: 100%; object-fit: cover;"
            >
              <source src="${escapeHtml(video)}" type="video/mp4" />
            </video>
          ` : `
            <img
              src="${backgroundImage}"
              alt="${escapeHtml(title || '')}"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          `}
          ${overlay ? `<div style="${overlayStyle}"></div>` : ''}
        </div>
      ` : `
        <!-- Solid background fallback -->
        <div style="${solidBgStyle}"></div>
      `}

      <!-- Content -->
      <div style="${contentContainerStyle}">
        <div style="${contentInnerStyle}">
          ${subtitle ? `
            <span style="${subtitleStyle}">
              ${escapeHtml(subtitle)}
            </span>
          ` : ''}

          ${title ? `
            <h1 style="${titleStyle}">
              ${escapeHtml(title)}
            </h1>
          ` : ''}

          ${description ? `
            <div style="${descriptionStyle}">
              ${description}
            </div>
          ` : ''}

          ${ctaText || ctaSecondaryText ? `
            <div style="${buttonContainerStyle}">
              ${ctaText ? `
                <a href="${escapeHtml(ctaUrl || '#')}" style="${primaryButtonStyle}">
                  ${escapeHtml(ctaText)}
                  <svg style="width: 1rem; height: 1rem; margin-left: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              ` : ''}
              ${ctaSecondaryText ? `
                <a href="${escapeHtml(ctaSecondaryUrl || '#')}" style="${secondaryButtonStyle}">
                  ${escapeHtml(ctaSecondaryText)}
                </a>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}
