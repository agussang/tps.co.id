/**
 * ImageGallery Component
 * Responsive image grid with lightbox
 * IMPORTANT: Uses ONLY inline styles (no Tailwind) to avoid Prasi CSS conflicts
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

  const bgColors: Record<string, string> = { white: '#ffffff', gray: '#f9fafb' };
  const gaps: Record<string, string> = { small: '0.5rem', medium: '1rem', large: '1.5rem' };
  const aspectPaddings: Record<string, string> = {
    square: '100%',
    video: '56.25%',
    portrait: '133.33%',
    auto: '',
  };

  const galleryId = `gallery-${Math.random().toString(36).substr(2, 9)}`;
  const imagesJson = JSON.stringify(images.map(i => ({ src: img(i.image), caption: i.caption || '' })));

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
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gaps[gap]};">
          ${images.map((item, index) => `
            <div
              style="position: relative; overflow: hidden; border-radius: 0.5rem; cursor: pointer;"
              onclick="window.__openLightbox && window.__openLightbox('${galleryId}', ${index})"
            >
              ${aspectRatio !== 'auto' ? `
                <div style="position: relative; padding-top: ${aspectPaddings[aspectRatio]};">
                  <img
                    src="${img(item.image)}"
                    alt="${escapeHtml(item.alt || item.caption || `Image ${index + 1}`)}"
                    style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
                    loading="lazy"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                  />
                </div>
              ` : `
                <img
                  src="${img(item.image)}"
                  alt="${escapeHtml(item.alt || item.caption || `Image ${index + 1}`)}"
                  style="width: 100%; height: auto; transition: transform 0.3s;"
                  loading="lazy"
                  onmouseover="this.style.transform='scale(1.05)'"
                  onmouseout="this.style.transform='scale(1)'"
                />
              `}
              ${item.caption ? `
                <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);">
                  <p style="font-size: 0.875rem; color: #fff; margin: 0;">${escapeHtml(item.caption)}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Lightbox Modal -->
      <div id="${galleryId}-lightbox" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.9); align-items: center; justify-content: center;" onclick="window.__closeLightbox && window.__closeLightbox('${galleryId}')">
        <button style="position: absolute; top: 1rem; right: 1rem; color: #fff; background: none; border: none; cursor: pointer; z-index: 10; padding: 0.5rem;" onclick="window.__closeLightbox && window.__closeLightbox('${galleryId}')">
          <svg style="width: 2rem; height: 2rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <button style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #fff; background: none; border: none; cursor: pointer; z-index: 10; padding: 0.5rem;" onclick="event.stopPropagation(); window.__prevImage && window.__prevImage('${galleryId}')">
          <svg style="width: 2rem; height: 2rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <button style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #fff; background: none; border: none; cursor: pointer; z-index: 10; padding: 0.5rem;" onclick="event.stopPropagation(); window.__nextImage && window.__nextImage('${galleryId}')">
          <svg style="width: 2rem; height: 2rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        <div style="max-width: 64rem; max-height: 90vh; padding: 1rem;" onclick="event.stopPropagation()">
          <img id="${galleryId}-lightbox-img" src="" alt="" style="max-width: 100%; max-height: 80vh; object-fit: contain; margin: 0 auto; display: block;" />
          <p id="${galleryId}-lightbox-caption" style="text-align: center; color: #fff; margin-top: 1rem;"></p>
        </div>
      </div>

      <script>
        (function() {
          var gid = '${galleryId}';
          var images = ${imagesJson};
          var currentIndex = 0;

          window.__openLightbox = function(id, index) {
            if (id !== gid) return;
            currentIndex = index;
            var lb = document.getElementById(id + '-lightbox');
            var imgEl = document.getElementById(id + '-lightbox-img');
            var capEl = document.getElementById(id + '-lightbox-caption');
            imgEl.src = images[index].src;
            capEl.textContent = images[index].caption;
            lb.style.display = 'flex';
            document.body.style.overflow = 'hidden';
          };

          window.__closeLightbox = function(id) {
            if (id !== gid) return;
            var lb = document.getElementById(id + '-lightbox');
            lb.style.display = 'none';
            document.body.style.overflow = '';
          };

          window.__prevImage = function(id) {
            if (id !== gid) return;
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            document.getElementById(id + '-lightbox-img').src = images[currentIndex].src;
            document.getElementById(id + '-lightbox-caption').textContent = images[currentIndex].caption;
          };

          window.__nextImage = function(id) {
            if (id !== gid) return;
            currentIndex = (currentIndex + 1) % images.length;
            document.getElementById(id + '-lightbox-img').src = images[currentIndex].src;
            document.getElementById(id + '-lightbox-caption').textContent = images[currentIndex].caption;
          };

          document.addEventListener('keydown', function(e) {
            var lb = document.getElementById(gid + '-lightbox');
            if (lb.style.display === 'none') return;
            if (e.key === 'Escape') window.__closeLightbox(gid);
            if (e.key === 'ArrowLeft') window.__prevImage(gid);
            if (e.key === 'ArrowRight') window.__nextImage(gid);
          });
        })();
      </script>
    </section>
  `;
}
