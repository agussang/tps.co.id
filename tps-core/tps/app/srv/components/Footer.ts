/**
 * Footer Component - SSR
 * Matching TPS Prasi design
 */

import { escapeHtml, img } from './html';

interface MenuItem {
  label: string;
  url?: string;
  items?: MenuItem[];
}

interface FooterProps {
  menu: MenuItem[];
  sosmed?: any[];
  contactus?: {
    company?: any[];
    phone?: any[];
    email?: any[];
  };
  copyright?: string;
}

export function Footer({ menu, sosmed, contactus, copyright }: FooterProps): string {
  return `
    <footer class="bg-[#0475BC] text-white" style="box-shadow: inset 0 4px 4px rgba(0,0,0,.25);">
      <!-- Main Footer -->
      <div class="max-w-[1100px] mx-auto px-4 pt-[50px] pb-[30px]">
        <div class="flex flex-wrap gap-[100px]">
          <!-- Sitemap Column -->
          <div class="flex-shrink-0">
            <div class="flex flex-col gap-2">
              ${menu.map((item) => `
                <div class="group relative">
                  <a href="${escapeHtml(item.url) || '#'}"
                     class="flex items-center gap-2 text-[14px] text-white/90 hover:text-white py-1.5 whitespace-nowrap">
                    ${escapeHtml(item.label)}
                    ${item.items && item.items.length > 0 ? `
                      <svg class="w-3 h-3 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    ` : ''}
                  </a>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Company Info Column -->
          <div class="flex-1 min-w-[300px]">
            <h4 class="text-[15px] font-bold text-white mb-4">Kontak</h4>

            <!-- Company -->
            ${contactus?.company && contactus.company.length > 0 ? `
              <div class="mb-4">
                ${contactus.company.map((c: any) => `
                  <div class="mb-2">
                    <p class="text-[14px] font-semibold text-white">${escapeHtml(c.name || c)}</p>
                    ${c.address ? `<p class="text-[13px] text-white/80">${escapeHtml(c.address)}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="mb-4">
                <p class="text-[14px] font-semibold text-white">PT Terminal Petikemas Surabaya</p>
                <p class="text-[13px] text-white/80">Jl. Tanjung Mutiara No. 1, Surabaya 60177</p>
              </div>
            `}

            <!-- Phone -->
            <div class="mb-3">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 text-white/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <div class="text-[13px] text-white/90">
                  ${contactus?.phone && contactus.phone.length > 0
                    ? contactus.phone.map((p: any) => `<p>${escapeHtml(typeof p === 'string' ? p : p.label || p.value)}</p>`).join('')
                    : '<p>031-3202020</p>'
                  }
                </div>
              </div>
            </div>

            <!-- Email -->
            <div class="mb-3">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 mt-0.5 text-white/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <div class="text-[13px] text-white/90">
                  ${contactus?.email && contactus.email.length > 0
                    ? contactus.email.map((e: any) => `<p>${escapeHtml(typeof e === 'string' ? e : e.label || e.value)}</p>`).join('')
                    : '<p>cs@tps.co.id</p>'
                  }
                </div>
              </div>
            </div>

            <!-- Social Media -->
            ${sosmed && sosmed.length > 0 ? `
              <div class="flex items-center gap-3 mt-4">
                ${sosmed.map((social: any) => `
                  <a href="${escapeHtml(social.url)}"
                     target="_blank"
                     rel="noopener noreferrer"
                     class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                     title="${escapeHtml(social.name)}">
                    ${social.icon ? `
                      <img src="${img(social.icon)}" alt="${escapeHtml(social.name)}" class="w-4 h-4 brightness-0 invert" />
                    ` : `
                      <span class="text-[10px] text-white">${escapeHtml((social.name || '').substring(0, 2).toUpperCase())}</span>
                    `}
                  </a>
                `).join('')}
              </div>
            ` : `
              <div class="flex items-center gap-3 mt-4">
                <a href="https://instagram.com/pttps_official" target="_blank" rel="noopener noreferrer"
                   class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                    <circle cx="12" cy="12" r="3.5"/>
                  </svg>
                </a>
                <a href="https://youtube.com/@pttps_official" target="_blank" rel="noopener noreferrer"
                   class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/pttps" target="_blank" rel="noopener noreferrer"
                   class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Credits Bar -->
      <div class="border-t border-white/30">
        <div class="max-w-[1100px] mx-auto px-4 py-4">
          <p class="text-[12px] text-white/70 text-center">
            ${escapeHtml(copyright) || `&copy; ${new Date().getFullYear()} PT Terminal Petikemas Surabaya. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  `;
}
