/**
 * VideoEmbed Component
 * Responsive video embed for YouTube/Vimeo
 * IMPORTANT: Uses ONLY inline styles (no Tailwind) to avoid Prasi CSS conflicts
 */

import { escapeHtml, img } from '../html';

export interface VideoEmbedProps {
  title?: string;
  subtitle?: string;
  description?: string;
  videoUrl: string;
  thumbnail?: string;
  background?: 'white' | 'gray' | 'dark';
  aspectRatio?: '16:9' | '4:3' | '21:9';
}

function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'unknown'; id: string } {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };

  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };

  return { type: 'unknown', id: '' };
}

export function VideoEmbed({
  title,
  subtitle,
  description,
  videoUrl,
  thumbnail,
  background = 'white',
  aspectRatio = '16:9',
}: VideoEmbedProps): string {
  if (!videoUrl) return '';

  const video = parseVideoUrl(videoUrl);

  const bgColors: Record<string, string> = {
    white: '#ffffff',
    gray: '#f9fafb',
    dark: '#111827',
  };
  const textColors: Record<string, string> = {
    white: '#111827',
    gray: '#111827',
    dark: '#ffffff',
  };
  const subtextColors: Record<string, string> = {
    white: '#4b5563',
    gray: '#4b5563',
    dark: '#d1d5db',
  };

  const paddings: Record<string, string> = {
    '16:9': 'padding-top: 56.25%;',
    '4:3': 'padding-top: 75%;',
    '21:9': 'padding-top: 42.86%;',
  };

  const getEmbedUrl = () => {
    switch (video.type) {
      case 'youtube': return `https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`;
      case 'vimeo': return `https://player.vimeo.com/video/${video.id}`;
      default: return '';
    }
  };

  const getThumbnail = () => {
    if (thumbnail) return img(thumbnail);
    if (video.type === 'youtube') return `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
    return '';
  };

  const videoId = `video-${Math.random().toString(36).substr(2, 9)}`;
  const embedUrl = getEmbedUrl();
  const thumbnailUrl = getThumbnail();

  if (!embedUrl) {
    return `
      <section style="padding: 3rem 1rem; background: ${bgColors[background]};">
        <div style="max-width: 1100px; margin: 0 auto; text-align: center;">
          <p style="color: #ef4444;">Video URL tidak valid</p>
        </div>
      </section>
    `;
  }

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
              <h2 style="font-size: 1.75rem; font-weight: 700; color: ${textColors[background]}; margin: 0;">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
            ${description ? `
              <p style="margin-top: 1rem; font-size: 1.125rem; color: ${subtextColors[background]}; max-width: 42rem; margin-left: auto; margin-right: auto;">
                ${escapeHtml(description)}
              </p>
            ` : ''}
          </div>
        ` : ''}

        <div style="max-width: 56rem; margin: 0 auto;">
          <div id="${videoId}" style="position: relative; ${paddings[aspectRatio]} border-radius: 0.75rem; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);">
            <!-- Thumbnail with play button -->
            <div id="${videoId}-thumbnail" style="position: absolute; inset: 0; cursor: pointer;" onclick="window.__playVideo && window.__playVideo('${videoId}')">
              ${thumbnailUrl ? `
                <img src="${thumbnailUrl}" alt="${escapeHtml(title || 'Video')}" style="width: 100%; height: 100%; object-fit: cover;" />
              ` : `
                <div style="width: 100%; height: 100%; background: #1f2937;"></div>
              `}
              <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                <div style="width: 5rem; height: 5rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.9); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                  <svg style="width: 2rem; height: 2rem; color: #0475BC; margin-left: 4px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Iframe (hidden until play) -->
            <iframe
              id="${videoId}-iframe"
              style="position: absolute; inset: 0; width: 100%; height: 100%; display: none; border: none;"
              src=""
              data-src="${embedUrl}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>

      <script>
        window.__playVideo = function(id) {
          var thumbnail = document.getElementById(id + '-thumbnail');
          var iframe = document.getElementById(id + '-iframe');
          if (thumbnail && iframe) {
            thumbnail.style.display = 'none';
            iframe.src = iframe.dataset.src + '&autoplay=1';
            iframe.style.display = 'block';
          }
        };
      </script>
    </section>
  `;
}
