/**
 * VideoEmbed Component
 * Responsive video embed for YouTube/Vimeo
 */

import { escapeHtml, img } from '../html';

export interface VideoEmbedProps {
  title?: string;
  subtitle?: string;
  description?: string;
  videoUrl: string; // YouTube or Vimeo URL
  thumbnail?: string;
  background?: 'white' | 'gray' | 'dark';
  aspectRatio?: '16:9' | '4:3' | '21:9';
}

function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'unknown'; id: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', id: ytMatch[1] };
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] };
  }

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

  const bgClasses: Record<string, string> = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-gray-900',
  };

  const textColor = background === 'dark' ? 'text-white' : 'text-gray-900';
  const subtextColor = background === 'dark' ? 'text-gray-300' : 'text-gray-600';

  const aspectClasses: Record<string, string> = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '21:9': 'aspect-[21/9]',
  };

  const getEmbedUrl = () => {
    switch (video.type) {
      case 'youtube':
        return `https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${video.id}`;
      default:
        return '';
    }
  };

  const getThumbnail = () => {
    if (thumbnail) return img(thumbnail);
    if (video.type === 'youtube') {
      return `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
    }
    return '';
  };

  const videoId = `video-${Math.random().toString(36).substr(2, 9)}`;
  const embedUrl = getEmbedUrl();
  const thumbnailUrl = getThumbnail();

  if (!embedUrl) {
    return `
      <section class="video-section py-12 lg:py-20 ${bgClasses[background]} section-animate">
        <div class="max-w-[1100px] mx-auto px-4 text-center">
          <p class="text-red-500">Video URL tidak valid</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="video-section py-12 lg:py-20 ${bgClasses[background]} section-animate">
      <div class="max-w-[1100px] mx-auto px-4">
        ${title || subtitle ? `
          <div class="text-center mb-10">
            ${subtitle ? `
              <span class="inline-block px-3 py-1 mb-3 text-sm font-medium text-[#0475BC] ${background === 'dark' ? 'bg-white/10' : 'bg-[#0475BC]/10'} rounded-full">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold ${textColor}">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
            ${description ? `
              <p class="mt-4 text-lg ${subtextColor} max-w-2xl mx-auto">
                ${escapeHtml(description)}
              </p>
            ` : ''}
          </div>
        ` : ''}

        <div class="max-w-4xl mx-auto">
          <div id="${videoId}" class="relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden shadow-xl">
            <!-- Thumbnail with play button -->
            <div id="${videoId}-thumbnail" class="absolute inset-0 cursor-pointer group" onclick="playVideo('${videoId}')">
              ${thumbnailUrl ? `
                <img src="${thumbnailUrl}" alt="${escapeHtml(title || 'Video')}" class="w-full h-full object-cover" />
              ` : `
                <div class="w-full h-full bg-gray-800"></div>
              `}
              <div class="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div class="w-20 h-20 flex items-center justify-center rounded-full bg-white/90 group-hover:bg-white transition-colors shadow-lg">
                  <svg class="w-8 h-8 text-[#0475BC] ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Iframe (hidden until play) -->
            <iframe
              id="${videoId}-iframe"
              class="absolute inset-0 w-full h-full hidden"
              src=""
              data-src="${embedUrl}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>

      <script>
        window.playVideo = function(id) {
          const thumbnail = document.getElementById(id + '-thumbnail');
          const iframe = document.getElementById(id + '-iframe');

          if (thumbnail && iframe) {
            thumbnail.classList.add('hidden');
            iframe.src = iframe.dataset.src + '&autoplay=1';
            iframe.classList.remove('hidden');
          }
        };
      </script>
    </section>
  `;
}
