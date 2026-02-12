/**
 * ContactForm Component
 * Contact form with validation
 */

import { escapeHtml } from '../html';

export interface ContactFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  description?: string;
  fields?: ContactFormField[];
  submitText?: string;
  submitUrl?: string;
  successMessage?: string;
  background?: 'white' | 'gray';
  showContactInfo?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

const defaultFields: ContactFormField[] = [
  { name: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'Masukkan nama Anda', required: true },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com', required: true },
  { name: 'phone', label: 'Nomor Telepon', type: 'tel', placeholder: '+62 xxx xxxx xxxx', required: false },
  { name: 'subject', label: 'Subjek', type: 'text', placeholder: 'Perihal pesan Anda', required: true },
  { name: 'message', label: 'Pesan', type: 'textarea', placeholder: 'Tulis pesan Anda di sini...', required: true },
];

export function ContactForm({
  title = 'Hubungi Kami',
  subtitle,
  description,
  fields = defaultFields,
  submitText = 'Kirim Pesan',
  submitUrl = '/api/contact',
  successMessage = 'Terima kasih! Pesan Anda telah terkirim.',
  background = 'gray',
  showContactInfo = true,
  contactInfo = {},
}: ContactFormProps): string {
  const bgClasses: Record<string, string> = {
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  const formId = `contact-form-${Math.random().toString(36).substr(2, 9)}`;

  const renderField = (field: ContactFormField) => {
    const baseInputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0475BC] focus:border-[#0475BC] transition-colors';

    switch (field.type) {
      case 'textarea':
        return `
          <div class="form-field">
            <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-2">
              ${escapeHtml(field.label)}${field.required ? ' <span class="text-red-500">*</span>' : ''}
            </label>
            <textarea
              id="${field.name}"
              name="${field.name}"
              rows="5"
              class="${baseInputClass} resize-none"
              placeholder="${escapeHtml(field.placeholder || '')}"
              ${field.required ? 'required' : ''}
            ></textarea>
          </div>
        `;
      case 'select':
        return `
          <div class="form-field">
            <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-2">
              ${escapeHtml(field.label)}${field.required ? ' <span class="text-red-500">*</span>' : ''}
            </label>
            <select
              id="${field.name}"
              name="${field.name}"
              class="${baseInputClass}"
              ${field.required ? 'required' : ''}
            >
              <option value="">Pilih...</option>
              ${(field.options || []).map(opt => `
                <option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>
              `).join('')}
            </select>
          </div>
        `;
      default:
        return `
          <div class="form-field">
            <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-2">
              ${escapeHtml(field.label)}${field.required ? ' <span class="text-red-500">*</span>' : ''}
            </label>
            <input
              type="${field.type}"
              id="${field.name}"
              name="${field.name}"
              class="${baseInputClass}"
              placeholder="${escapeHtml(field.placeholder || '')}"
              ${field.required ? 'required' : ''}
            />
          </div>
        `;
    }
  };

  return `
    <section class="contact-form-section py-12 lg:py-20 ${bgClasses[background]} section-animate">
      <div class="max-w-[1100px] mx-auto px-4">
        ${title || subtitle ? `
          <div class="text-center mb-10">
            ${subtitle ? `
              <span class="inline-block px-3 py-1 mb-3 text-sm font-medium text-[#0475BC] bg-[#0475BC]/10 rounded-full">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
            ${description ? `
              <p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                ${escapeHtml(description)}
              </p>
            ` : ''}
          </div>
        ` : ''}

        <div class="${showContactInfo ? 'grid grid-cols-1 lg:grid-cols-3 gap-10' : 'max-w-2xl mx-auto'}">
          ${showContactInfo ? `
            <!-- Contact Info -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-xl p-6 shadow-sm h-full">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Informasi Kontak</h3>

                ${contactInfo.phone ? `
                  <div class="flex items-start gap-4 mb-5">
                    <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0475BC]/10 text-[#0475BC] flex-shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Telepon</p>
                      <p class="text-sm text-gray-600">${escapeHtml(contactInfo.phone)}</p>
                    </div>
                  </div>
                ` : ''}

                ${contactInfo.email ? `
                  <div class="flex items-start gap-4 mb-5">
                    <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0475BC]/10 text-[#0475BC] flex-shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Email</p>
                      <p class="text-sm text-gray-600">${escapeHtml(contactInfo.email)}</p>
                    </div>
                  </div>
                ` : ''}

                ${contactInfo.address ? `
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0475BC]/10 text-[#0475BC] flex-shrink-0">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Alamat</p>
                      <p class="text-sm text-gray-600">${escapeHtml(contactInfo.address)}</p>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Form -->
          <div class="${showContactInfo ? 'lg:col-span-2' : ''}">
            <form id="${formId}" class="bg-white rounded-xl p-6 lg:p-8 shadow-sm space-y-5">
              ${fields.map(field => renderField(field)).join('')}

              <div class="pt-2">
                <button
                  type="submit"
                  class="w-full md:w-auto px-8 py-3 bg-[#0475BC] text-white font-semibold rounded-lg hover:bg-[#0366a3] transition-colors flex items-center justify-center gap-2"
                >
                  <span>${escapeHtml(submitText)}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
              </div>

              <!-- Success Message -->
              <div id="${formId}-success" class="hidden p-4 bg-green-50 text-green-800 rounded-lg">
                ${escapeHtml(successMessage)}
              </div>

              <!-- Error Message -->
              <div id="${formId}-error" class="hidden p-4 bg-red-50 text-red-800 rounded-lg"></div>
            </form>
          </div>
        </div>
      </div>

      <script>
        (function() {
          const form = document.getElementById('${formId}');
          const successEl = document.getElementById('${formId}-success');
          const errorEl = document.getElementById('${formId}-error');

          form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
              const res = await fetch('${escapeHtml(submitUrl)}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });

              const result = await res.json();

              if (result.status === 'ok') {
                successEl.classList.remove('hidden');
                errorEl.classList.add('hidden');
                form.reset();
              } else {
                errorEl.textContent = result.message || 'Terjadi kesalahan. Silakan coba lagi.';
                errorEl.classList.remove('hidden');
                successEl.classList.add('hidden');
              }
            } catch (err) {
              errorEl.textContent = 'Terjadi kesalahan koneksi. Silakan coba lagi.';
              errorEl.classList.remove('hidden');
              successEl.classList.add('hidden');
            }
          });
        })();
      </script>
    </section>
  `;
}
