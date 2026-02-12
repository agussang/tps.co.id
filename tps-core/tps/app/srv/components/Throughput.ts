/**
 * Throughput Stats Section Component - SSR
 */

import { escapeHtml, img } from './html';

interface ThroughputStat {
  title?: string;
  value?: string;
  icon?: string;
  url?: string;
}

interface ThroughputProps {
  stats: ThroughputStat[];
  title?: string;
}

export function Throughput({ stats, title }: ThroughputProps): string {
  if (stats.length === 0) return '';

  return `
    <section class="py-20 relative overflow-hidden" style="background: linear-gradient(135deg, #0475BC 0%, #034a75 50%, #023354 100%)">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div class="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            ${escapeHtml(title) || 'Annual Throughput'}
          </h2>
          <p class="text-blue-200 text-lg">
            Statistik Petikemas Tahunan
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
          ${stats.map((stat) => `
            <a href="${escapeHtml(stat.url) || '/throughput'}"
               class="text-center group hover:scale-105 transition-transform duration-300">
              ${stat.icon ? `
                <div class="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                  <img src="${img(stat.icon)}"
                       alt="${escapeHtml(stat.title)}"
                       class="w-14 h-14 brightness-0 invert" />
                </div>
              ` : ''}
              <p class="text-5xl md:text-6xl font-bold text-white mb-3">${escapeHtml(stat.value)}</p>
              <p class="text-blue-200 text-lg">${escapeHtml(stat.title)}</p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
