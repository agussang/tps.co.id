/**
 * Customers Section Component - SSR
 */

import { escapeHtml, img } from './html';

interface Customer {
  name?: string;
  logo?: string;
  url?: string;
}

interface CustomersProps {
  customers: Customer[];
  title?: string;
}

export function Customers({ customers, title }: CustomersProps): string {
  if (customers.length === 0) return '';

  return `
    <section class="py-20 bg-white">
      <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ${escapeHtml(title) || 'Pelanggan Kami'}
          </h2>
          <p class="text-gray-500 text-lg">
            Dipercaya oleh perusahaan pelayaran terkemuka
          </p>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-6">
          ${customers.slice(0, 21).map((customer) => `
            <div class="flex items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              ${customer.logo ? `
                <img src="${img(customer.logo)}"
                     alt="${escapeHtml(customer.name)}"
                     class="max-h-12 max-w-full object-contain grayscale hover:grayscale-0 transition-all" />
              ` : `
                <span class="text-sm text-gray-500">${escapeHtml(customer.name)}</span>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
