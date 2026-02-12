/**
 * ImageGallery Component
 * Responsive image grid dengan lightbox
 */

import { escapeHtml, img } from '../html';

export interface GalleryImage {
  image: string;
  caption?: string;
  alt?: string;
}

export interface ImageGalleryProps {
  title?: string;
  subtitle?: string;
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  background?: 'white' | 'gray';
}

export function ImageGallery({
  title,
  subtitle,
  images,
  columns = 3,
  gap = 'medium',
  aspectRatio = 'video',
  background = 'white',
}: ImageGalleryProps): string {
  if (!images || images.length === 0) return '';

  const columnClasses: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  const gapClasses: Record<string, string> = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  const aspectClasses: Record<string, string> = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const bgClasses: Record<string, string> = {
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  const galleryId = `gallery-${Math.random().toString(36).substr(2, 9)}`;

  return `
    <section class="gallery-section py-12 lg:py-20 ${bgClasses[background]} section-animate">
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
          </div>
        ` : ''}

        <div class="grid ${columnClasses[columns]} ${gapClasses[gap]}">
          ${images.map((item, index) => `
            <div class="gallery-item group relative overflow-hidden rounded-lg cursor-pointer"
                 onclick="openLightbox('${galleryId}', ${index})">
              <div class="${aspectClasses[aspectRatio]} ${aspectRatio === 'auto' ? '' : 'relative'}">
                <img
                  src="${img(item.image)}"
                  alt="${escapeHtml(item.alt || item.caption || `Image ${index + 1}`)}"
                  class="${aspectRatio === 'auto' ? 'w-full h-auto' : 'absolute inset-0 w-full h-full object-cover'} transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <!-- Overlay on hover -->
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <svg class="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                </svg>
              </div>

              ${item.caption ? `
                <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                  <p class="text-sm text-white">${escapeHtml(item.caption)}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Lightbox Modal -->
      <div id="${galleryId}-lightbox" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/90" onclick="closeLightbox('${galleryId}')">
        <button class="absolute top-4 right-4 text-white hover:text-gray-300 z-10" onclick="closeLightbox('${galleryId}')">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <button class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2" onclick="event.stopPropagation(); prevImage('${galleryId}')">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <button class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2" onclick="event.stopPropagation(); nextImage('${galleryId}')">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        <div class="max-w-5xl max-h-[90vh] p-4" onclick="event.stopPropagation()">
          <img id="${galleryId}-lightbox-img" src="" alt="" class="max-w-full max-h-[80vh] object-contain mx-auto" />
          <p id="${galleryId}-lightbox-caption" class="text-center text-white mt-4"></p>
        </div>
      </div>

      <script>
        (function() {
          const galleryId = '${galleryId}';
          const images = ${JSON.stringify(images.map(i => ({ src: img(i.image), caption: i.caption || '' })))};
          let currentIndex = 0;

          window.openLightbox = function(id, index) {
            if (id !== galleryId) return;
            currentIndex = index;
            const lightbox = document.getElementById(id + '-lightbox');
            const imgEl = document.getElementById(id + '-lightbox-img');
            const captionEl = document.getElementById(id + '-lightbox-caption');

            imgEl.src = images[index].src;
            captionEl.textContent = images[index].caption;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            document.body.style.overflow = 'hidden';
          };

          window.closeLightbox = function(id) {
            if (id !== galleryId) return;
            const lightbox = document.getElementById(id + '-lightbox');
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            document.body.style.overflow = '';
          };

          window.prevImage = function(id) {
            if (id !== galleryId) return;
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            const imgEl = document.getElementById(id + '-lightbox-img');
            const captionEl = document.getElementById(id + '-lightbox-caption');
            imgEl.src = images[currentIndex].src;
            captionEl.textContent = images[currentIndex].caption;
          };

          window.nextImage = function(id) {
            if (id !== galleryId) return;
            currentIndex = (currentIndex + 1) % images.length;
            const imgEl = document.getElementById(id + '-lightbox-img');
            const captionEl = document.getElementById(id + '-lightbox-caption');
            imgEl.src = images[currentIndex].src;
            captionEl.textContent = images[currentIndex].caption;
          };

          // Keyboard navigation
          document.addEventListener('keydown', function(e) {
            const lightbox = document.getElementById(galleryId + '-lightbox');
            if (lightbox.classList.contains('hidden')) return;

            if (e.key === 'Escape') closeLightbox(galleryId);
            if (e.key === 'ArrowLeft') prevImage(galleryId);
            if (e.key === 'ArrowRight') nextImage(galleryId);
          });
        })();
      </script>
    </section>
  `;
}
