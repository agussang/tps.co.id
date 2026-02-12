/**
 * Profile/About Section Component - SSR
 */

import { escapeHtml, img } from './html';

interface ProfileData {
  title?: string;
  tagline?: string;
  summary?: string;
  banner?: string;
  video_url?: string;
}

interface ProfileProps {
  profile: ProfileData | null;
}

export function Profile({ profile }: ProfileProps): string {
  if (!profile) return '';

  return `
    <section class="py-24 bg-white">
      <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p class="text-[#0475BC] font-semibold uppercase tracking-wider text-sm mb-4">
              ${escapeHtml(profile.tagline) || 'World Class Performance Terminal Operator'}
            </p>
            <h2 class="text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
              ${escapeHtml(profile.title) || 'Terminal Petikemas Surabaya'}
            </h2>
            <p class="text-gray-600 text-lg mb-8 leading-relaxed">
              ${escapeHtml(profile.summary)}
            </p>
            <div class="flex flex-wrap gap-4">
              <a href="/profil/visi"
                 class="inline-flex items-center gap-2 bg-[#0475BC] hover:bg-[#035a91] text-white px-8 py-4 rounded-full font-semibold transition-all">
                Selengkapnya
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
              ${profile.video_url ? `
                <a href="https://youtube.com/watch?v=${escapeHtml(profile.video_url)}"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="inline-flex items-center gap-2 border-2 border-[#0475BC] text-[#0475BC] hover:bg-[#0475BC] hover:text-white px-8 py-4 rounded-full font-semibold transition-all">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Tonton Video
                </a>
              ` : ''}
            </div>
          </div>
          ${profile.banner ? `
            <div class="relative">
              <div class="rounded-[30px] overflow-hidden shadow-2xl">
                <img src="${img(profile.banner)}"
                     alt="${escapeHtml(profile.title)}"
                     class="w-full h-[450px] object-cover" />
              </div>
              <div class="absolute -bottom-6 -left-6 w-32 h-32 bg-[#0475BC]/10 rounded-[20px] -z-10"></div>
              <div class="absolute -top-6 -right-6 w-24 h-24 bg-[#0475BC]/10 rounded-[20px] -z-10"></div>
            </div>
          ` : ''}
        </div>
      </div>
    </section>
  `;
}
