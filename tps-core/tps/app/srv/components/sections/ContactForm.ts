/**
 * ContactForm Component
 * Contact form with validation
 * IMPORTANT: Uses ONLY inline styles (no Tailwind) to avoid Prasi CSS conflicts
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
  const bgColors: Record<string, string> = { white: '#ffffff', gray: '#f9fafb' };
  const formId = `contact-form-${Math.random().toString(36).substr(2, 9)}`;

  const inputStyle = 'width: 100%; padding: 0.75rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.9375rem; outline: none; box-sizing: border-box;';

  const renderField = (field: ContactFormField) => {
    const labelHtml = `
      <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
        ${escapeHtml(field.label)}${field.required ? ' <span style="color: #ef4444;">*</span>' : ''}
      </label>
    `;

    switch (field.type) {
      case 'textarea':
        return `
          <div style="margin-bottom: 1.25rem;">
            ${labelHtml}
            <textarea name="${field.name}" rows="5" style="${inputStyle} resize: vertical;" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}></textarea>
          </div>
        `;
      case 'select':
        return `
          <div style="margin-bottom: 1.25rem;">
            ${labelHtml}
            <select name="${field.name}" style="${inputStyle}" ${field.required ? 'required' : ''}>
              <option value="">Pilih...</option>
              ${(field.options || []).map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('')}
            </select>
          </div>
        `;
      default:
        return `
          <div style="margin-bottom: 1.25rem;">
            ${labelHtml}
            <input type="${field.type}" name="${field.name}" style="${inputStyle}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''} />
          </div>
        `;
    }
  };

  const contactInfoHtml = showContactInfo ? `
    <div style="${showContactInfo ? 'flex: 0 0 33.33%;' : ''}">
      <div style="background: #fff; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: 100%;">
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 1.5rem 0;">Informasi Kontak</h3>
        ${contactInfo.phone ? `
          <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;">
            <div style="width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; background: rgba(4,117,188,0.1); flex-shrink: 0;">
              <svg style="width: 1.25rem; height: 1.25rem; color: #0475BC;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </div>
            <div>
              <p style="font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0;">Telepon</p>
              <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0 0 0;">${escapeHtml(contactInfo.phone)}</p>
            </div>
          </div>
        ` : ''}
        ${contactInfo.email ? `
          <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem;">
            <div style="width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; background: rgba(4,117,188,0.1); flex-shrink: 0;">
              <svg style="width: 1.25rem; height: 1.25rem; color: #0475BC;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <p style="font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0;">Email</p>
              <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0 0 0;">${escapeHtml(contactInfo.email)}</p>
            </div>
          </div>
        ` : ''}
        ${contactInfo.address ? `
          <div style="display: flex; align-items: flex-start; gap: 1rem;">
            <div style="width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; background: rgba(4,117,188,0.1); flex-shrink: 0;">
              <svg style="width: 1.25rem; height: 1.25rem; color: #0475BC;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <p style="font-size: 0.875rem; font-weight: 500; color: #111827; margin: 0;">Alamat</p>
              <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0 0 0;">${escapeHtml(contactInfo.address)}</p>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  ` : '';

  return `
    <section style="padding: 3rem 1rem; background: ${bgColors[background]};">
      <div style="max-width: 1100px; margin: 0 auto;">
        ${title || subtitle ? `
          <div style="text-align: center; margin-bottom: 2.5rem;">
            ${subtitle ? `
              <span style="display: inline-block; padding: 0.25rem 0.75rem; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 500; color: #0475BC; background: rgba(4,117,188,0.1); border-radius: 9999px;">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 style="font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0;">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
            ${description ? `
              <p style="margin-top: 1rem; font-size: 1.125rem; color: #4b5563; max-width: 42rem; margin-left: auto; margin-right: auto;">
                ${escapeHtml(description)}
              </p>
            ` : ''}
          </div>
        ` : ''}

        <div style="${showContactInfo ? 'display: flex; gap: 2.5rem; flex-wrap: wrap;' : 'max-width: 42rem; margin: 0 auto;'}">
          ${contactInfoHtml}

          <div style="${showContactInfo ? 'flex: 1; min-width: 0;' : ''}">
            <form id="${formId}" style="background: #fff; border-radius: 0.75rem; padding: 1.5rem 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${fields.map(field => renderField(field)).join('')}

              <div style="padding-top: 0.5rem;">
                <button type="submit" style="padding: 0.75rem 2rem; background: #0475BC; color: #fff; font-weight: 600; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.9375rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                  <span>${escapeHtml(submitText)}</span>
                  <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
              </div>

              <div id="${formId}-success" style="display: none; padding: 1rem; background: #f0fdf4; color: #166534; border-radius: 0.5rem; margin-top: 1rem;">
                ${escapeHtml(successMessage)}
              </div>
              <div id="${formId}-error" style="display: none; padding: 1rem; background: #fef2f2; color: #991b1b; border-radius: 0.5rem; margin-top: 1rem;"></div>
            </form>
          </div>
        </div>
      </div>

      <script>
        (function() {
          var form = document.getElementById('${formId}');
          var successEl = document.getElementById('${formId}-success');
          var errorEl = document.getElementById('${formId}-error');
          if (!form) return;

          form.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(form);
            var data = {};
            formData.forEach(function(val, key) { data[key] = val; });

            fetch('${escapeHtml(submitUrl)}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            }).then(function(res) { return res.json(); }).then(function(result) {
              if (result.status === 'ok') {
                successEl.style.display = 'block';
                errorEl.style.display = 'none';
                form.reset();
              } else {
                errorEl.textContent = result.message || 'Terjadi kesalahan.';
                errorEl.style.display = 'block';
                successEl.style.display = 'none';
              }
            }).catch(function() {
              errorEl.textContent = 'Terjadi kesalahan koneksi.';
              errorEl.style.display = 'block';
              successEl.style.display = 'none';
            });
          });
        })();
      </script>
    </section>
  `;
}
