/**
 * Instagram Section Component - SSR
 */

import { escapeHtml } from './html';

interface InstagramPost {
  media?: string;
  url?: string;
  id?: string;
}

interface InstagramProps {
  posts: InstagramPost[];
  title?: string;
  description?: string;
}

export function Instagram({ posts, title, description }: InstagramProps): string {
  if (posts.length === 0) return '';

  return `
    <section class="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ${escapeHtml(title) || 'Ikuti Kami'}
          </h2>
          <p class="text-gray-500 text-lg">
            ${escapeHtml(description) || 'Dapatkan berita terbaru di Instagram kami @pttps_official'}
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${posts.slice(0, 3).map((post) => `
            <a href="${escapeHtml(post.url) || 'https://instagram.com/pttps_official'}"
               target="_blank"
               rel="noopener noreferrer"
               class="group relative aspect-square rounded-[20px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              ${post.media ? `
                <img src="${post.media}"
                     alt="Instagram Post"
                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ` : `
                <div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                    <circle cx="12" cy="12" r="3.5"/>
                  </svg>
                </div>
              `}
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <circle cx="12" cy="12" r="3.5"/>
                </svg>
              </div>
            </a>
          `).join('')}
        </div>
        <div class="text-center mt-10">
          <a href="https://instagram.com/pttps_official"
             target="_blank"
             rel="noopener noreferrer"
             class="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
              <circle cx="12" cy="12" r="3.5"/>
            </svg>
            @pttps_official
          </a>
        </div>
      </div>
    </section>
  `;
}
