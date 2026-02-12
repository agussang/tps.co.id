/**
 * Services Section Component - SSR
 */

import { escapeHtml, img } from './html';

interface Service {
  title?: string;
  description?: string;
  icon?: string;
  url?: string;
}

interface ServicesProps {
  services: Service[];
  title?: string;
}

export function Services({ services, title }: ServicesProps): string {
  if (services.length === 0) return '';

  return `
    <section class="py-20 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ${escapeHtml(title) || 'Layanan Online'}
          </h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">
            Nikmati kemudahan akses layanan Terminal Petikemas Surabaya
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${services.map((service) => `
            <a href="${escapeHtml(service.url) || '#'}"
               target="_blank"
               rel="noopener noreferrer"
               class="group bg-white rounded-[20px] p-8 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#0475BC]/20 hover:-translate-y-1">
              ${service.icon ? `
                <div class="w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-br from-[#0475BC]/10 to-[#0475BC]/5 rounded-2xl group-hover:from-[#0475BC] group-hover:to-[#035a91] transition-all duration-300">
                  <img src="${img(service.icon)}"
                       alt="${escapeHtml(service.title)}"
                       class="w-12 h-12 object-contain group-hover:brightness-0 group-hover:invert transition-all" />
                </div>
              ` : ''}
              <h3 class="text-xl font-bold mb-3 text-gray-800 group-hover:text-[#0475BC] transition-colors">
                ${escapeHtml(service.title)}
              </h3>
              <p class="text-gray-500 text-sm leading-relaxed line-clamp-3">
                ${escapeHtml(service.description)}
              </p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
