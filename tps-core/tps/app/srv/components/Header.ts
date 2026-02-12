/**
 * Header Component - SSR
 * Matching TPS Prasi design
 */

import { escapeHtml, img } from './html';

interface MenuItem {
  label: string;
  url?: string;
  items?: MenuItem[];
}

interface HeaderProps {
  logo?: string;
  menu: MenuItem[];
  shortcut?: { menu: any[] };
  lang?: string;
}

function renderDesktopMenuItem(item: MenuItem): string {
  const hasChildren = item.items && item.items.length > 0;

  return `
    <div class="tps-menu-item relative group">
      <a href="${escapeHtml(item.url) || '#'}"
         class="tps-menu-link flex items-center gap-1 px-4 py-2.5 text-[14px] text-white hover:font-bold transition-all whitespace-nowrap">
        ${escapeHtml(item.label)}
        ${hasChildren ? `
          <svg class="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        ` : ''}
      </a>
      ${hasChildren ? `
        <div class="tps-submenu absolute top-full left-0 pt-2 hidden group-hover:block z-50">
          <div class="bg-white shadow-xl rounded-lg py-2 min-w-[220px] border border-gray-100">
            ${item.items!.map(sub => `
              <a href="${escapeHtml(sub.url) || '#'}"
                 class="block px-5 py-3 text-[13px] text-gray-700 hover:bg-[#0475BC] hover:text-white transition-colors">
                ${escapeHtml(sub.label)}
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderMobileMenuItem(item: MenuItem): string {
  const hasChildren = item.items && item.items.length > 0;

  return `
    <div class="border-b border-white/20">
      <a href="${escapeHtml(item.url) || '#'}" class="flex items-center justify-between py-4 px-4 text-white text-[15px]">
        ${escapeHtml(item.label)}
        ${hasChildren ? `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        ` : ''}
      </a>
    </div>
  `;
}

export function Header({ logo, menu, shortcut, lang = 'id' }: HeaderProps): string {
  const logoUrl = logo ? img(logo) : '/_img/layout/header/tps-logo-juara-25.png';

  return `
    <header id="main-header" class="fixed top-0 left-0 right-0 z-50">
      <!-- Desktop Header -->
      <div class="hidden lg:block">
        <!-- Upper Section (White background) -->
        <div class="bg-white">
          <div class="max-w-[1100px] mx-auto px-4">
            <div class="flex items-center justify-between h-[85px]">
              <!-- Logo -->
              <a href="/" class="flex-shrink-0">
                <img src="${logoUrl}" alt="TPS" class="h-[55px] object-contain" />
              </a>

              <!-- Right Side: Top Nav Links + Search + Language -->
              <div class="flex items-center gap-6">
                <!-- Shortcut/Quick Links -->
                ${shortcut?.menu && shortcut.menu.length > 0 ? `
                  <div class="flex items-center gap-4">
                    ${shortcut.menu.map((item: any) => `
                      <a href="${escapeHtml(item.url)}"
                         target="_blank"
                         rel="noopener noreferrer"
                         class="text-[13px] text-[#0475BC] hover:underline font-medium">
                        ${escapeHtml(item.label)}
                      </a>
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Search -->
                <button class="w-9 h-9 flex items-center justify-center text-[#0475BC] hover:bg-gray-100 rounded-full transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </button>

                <!-- Language Switch -->
                <div class="relative group">
                  <button id="lang-toggle-desktop" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg class="w-4 h-4 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                    </svg>
                    <span class="text-[13px] font-medium text-gray-700">${lang.toUpperCase()}</span>
                    <svg class="w-3 h-3 text-gray-500 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  <!-- Language Dropdown -->
                  <div id="lang-dropdown-desktop" class="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
                    <div class="bg-white shadow-lg rounded-lg py-2 min-w-[140px] border border-gray-100">
                      <button onclick="setLanguage('id')" class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] ${lang === 'id' ? 'text-[#0475BC] bg-[#0475BC]/5 font-medium' : 'text-gray-700 hover:bg-gray-50'}">
                        <span class="w-6 text-center font-semibold">ID</span>
                        <span>Indonesia</span>
                        ${lang === 'id' ? '<svg class="w-4 h-4 ml-auto text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                      </button>
                      <button onclick="setLanguage('en')" class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] ${lang === 'en' ? 'text-[#0475BC] bg-[#0475BC]/5 font-medium' : 'text-gray-700 hover:bg-gray-50'}">
                        <span class="w-6 text-center font-semibold">EN</span>
                        <span>English</span>
                        ${lang === 'en' ? '<svg class="w-4 h-4 ml-auto text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu Section (Blue background) -->
        <div class="bg-[#0475BC]">
          <div class="max-w-[1100px] mx-auto px-4">
            <nav class="flex items-center justify-between">
              ${menu.map(item => renderDesktopMenuItem(item)).join('')}
            </nav>
          </div>
        </div>
      </div>

      <!-- Mobile Header -->
      <div class="lg:hidden bg-[#0475BC]">
        <div class="flex items-center justify-between h-[60px] px-4">
          <!-- Hamburger -->
          <button id="mobile-menu-btn" class="p-2 text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <!-- Logo -->
          <a href="/" class="flex-shrink-0">
            <img src="${logoUrl}" alt="TPS" class="h-[40px] object-contain brightness-0 invert" />
          </a>

          <!-- Search & Language -->
          <div class="flex items-center gap-2">
            <button class="p-2 text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <button id="lang-toggle-mobile" onclick="toggleMobileLang()" class="flex items-center gap-1 px-2 py-1 text-white text-[12px] font-medium rounded hover:bg-white/10">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
              ${lang.toUpperCase()}
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden bg-[#0366a3]">
          ${menu.map(item => renderMobileMenuItem(item)).join('')}
        </div>

        <!-- Mobile Language Selector -->
        <div id="mobile-lang-menu" class="hidden bg-[#0366a3] border-t border-white/20">
          <div class="px-4 py-3">
            <p class="text-white/60 text-[12px] uppercase tracking-wide mb-2">Pilih Bahasa</p>
            <div class="flex gap-2">
              <button onclick="setLanguage('id')" class="flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${lang === 'id' ? 'bg-white text-[#0475BC]' : 'bg-white/10 text-white hover:bg-white/20'}">
                Indonesia
              </button>
              <button onclick="setLanguage('en')" class="flex-1 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${lang === 'en' ? 'bg-white text-[#0475BC]' : 'bg-white/10 text-white hover:bg-white/20'}">
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Language Switcher Script -->
    <script>
      window.toggleMobileLang = function() {
        const menu = document.getElementById('mobile-lang-menu');
        if (menu) {
          menu.classList.toggle('hidden');
        }
      };
    </script>

    <!-- Header spacer for fixed positioning -->
    <div class="hidden lg:block h-[125px]"></div>
    <div class="lg:hidden h-[60px]"></div>
  `;
}
