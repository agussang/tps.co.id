/**
 * News Section Component - SSR
 */

import { escapeHtml, img, formatDate } from './html';

interface NewsItem {
  title?: string;
  slug?: string;
  image?: string;
  publish_date?: string;
  summary?: string;
}

interface NewsProps {
  news: NewsItem[];
  title?: string;
}

export function News({ news, title }: NewsProps): string {
  if (news.length === 0) return '';

  return `
    <section class="py-24 bg-gray-50">
      <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-14 gap-4">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold text-gray-800">
              ${escapeHtml(title) || 'Berita Terbaru'}
            </h2>
            <p class="text-gray-500 mt-2 text-lg">Informasi dan kegiatan terkini</p>
          </div>
          <a href="/berita/press-release"
             class="inline-flex items-center gap-2 border-2 border-[#0475BC] text-[#0475BC] hover:bg-[#0475BC] hover:text-white px-6 py-3 rounded-full font-semibold transition-all">
            Lihat Semua
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${news.slice(0, 4).map((item) => `
            <a href="/berita/press-release/${escapeHtml(item.slug)}"
               class="group bg-white rounded-[20px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="relative h-56 overflow-hidden">
                ${item.image ? `
                  <img src="${img(item.image, 500)}"
                       alt="${escapeHtml(item.title)}"
                       class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ` : `
                  <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                `}
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div class="p-6">
                <p class="text-sm text-[#0475BC] font-medium mb-3">
                  ${formatDate(item.publish_date)}
                </p>
                <h3 class="font-bold text-gray-800 group-hover:text-[#0475BC] transition-colors line-clamp-2 leading-snug">
                  ${escapeHtml(item.title)}
                </h3>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
