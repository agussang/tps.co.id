/**
 * Hero Banner Component - SSR
 */

import { escapeHtml, img, file } from './html';

interface Banner {
  title?: string;
  subtitle?: string;
  description?: string;
  image_desktop?: string;
  image_mobile?: string;
  video?: string;
  url?: string;
  label_button?: string;
}

interface HeroBannerProps {
  banners: Banner[];
}

export function HeroBanner({ banners }: HeroBannerProps): string {
  if (banners.length === 0) {
    return `
      <section class="h-screen bg-gradient-to-br from-[#0475BC] via-[#034a75] to-[#023354] flex items-center justify-center pt-[80px]">
        <div class="text-center text-white">
          <p class="text-xl uppercase tracking-[0.3em] mb-4 text-blue-200">World Class Performance</p>
          <h1 class="text-6xl md:text-8xl font-bold">Terminal Operator</h1>
          <p class="text-2xl mt-6">Terminal Petikemas Surabaya</p>
        </div>
      </section>
    `;
  }

  const banner = banners[0];
  const bgImage = banner.image_desktop ? img(banner.image_desktop) : '';
  const videoSrc = banner.video ? file(banner.video) : '';

  return `
    <section class="relative h-screen min-h-[600px] overflow-hidden" id="hero-banner">
      <!-- Video/Image Background -->
      ${videoSrc ? `
        <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover">
          <source src="${videoSrc}" type="video/mp4" />
        </video>
      ` : `
        <div class="absolute inset-0 bg-cover bg-center bg-no-repeat"
             style="background-image: url('${bgImage}')"></div>
      `}

      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

      <!-- Content -->
      <div class="relative h-full max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center pt-[80px]">
        <div class="text-white max-w-2xl">
          <p class="text-lg md:text-xl uppercase tracking-[0.25em] mb-4 text-white/80 font-light">
            ${escapeHtml(banner.subtitle) || 'World Class Performance'}
          </p>
          <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            ${escapeHtml(banner.title) || 'Terminal Operator'}
          </h1>
          ${banner.description ? `
            <p class="text-lg md:text-xl mb-10 text-white/90 max-w-xl leading-relaxed">
              ${escapeHtml(banner.description)}
            </p>
          ` : ''}
          ${banner.url && banner.label_button ? `
            <a href="${escapeHtml(banner.url)}"
               class="inline-flex items-center gap-3 bg-[#0475BC] hover:bg-[#035a91] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
              ${escapeHtml(banner.label_button)}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          ` : ''}
        </div>
      </div>

      <!-- Slide Indicators (untuk multiple banners) -->
      ${banners.length > 1 ? `
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3">
          ${banners.map((_, idx) => `
            <button data-slide="${idx}"
                    class="banner-dot h-2 rounded-full transition-all ${idx === 0 ? 'bg-white w-10' : 'bg-white/40 w-2 hover:bg-white/60'}">
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Scroll Indicator -->
      <div class="absolute bottom-10 right-10 hidden md:flex flex-col items-center text-white/60 animate-bounce">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </section>
  `;
}
