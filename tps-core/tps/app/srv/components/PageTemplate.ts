/**
 * PageTemplate - Base Template untuk Dynamic Pages
 * Menyediakan layout konsisten dengan header/footer tetap
 */

import { Header } from './Header';
import { Footer } from './Footer';
import { escapeHtml } from './html';

export interface PageSEO {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
}

export interface PageTemplateProps {
  // SEO & Meta
  seo?: PageSEO;
  lang?: string;

  // Header props
  header: {
    logo?: string;
    menu?: any[];
    shortcut?: { menu: any[] };
    lang?: string;
  };

  // Footer props
  footer: {
    sitemap?: any[];
    copyright?: string;
    contactus?: any;
    sosmed?: any[];
  };

  // Page content
  children: string;

  // Additional scripts
  scripts?: string;

  // Additional styles
  styles?: string;
}

export function PageTemplate({
  seo = {},
  lang = 'id',
  header,
  footer,
  children,
  scripts = '',
  styles = '',
}: PageTemplateProps): string {
  const title = seo.title
    ? `${escapeHtml(seo.title)} - PT Terminal Petikemas Surabaya`
    : 'PT Terminal Petikemas Surabaya';

  const description = seo.description || 'PT Terminal Petikemas Surabaya (TPS) - World Class Performance Terminal Operator';
  const ogImage = seo.ogImage || 'https://www.tps.co.id/_img/layout/header/tps-logo-juara-25.png';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${seo.keywords ? `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />` : ''}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(seo.title || 'PT Terminal Petikemas Surabaya')}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  ${seo.ogUrl ? `<meta property="og:url" content="${escapeHtml(seo.ogUrl)}" />` : ''}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(seo.title || 'PT Terminal Petikemas Surabaya')}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  ${seo.canonical ? `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />` : ''}
  <link rel="shortcut icon" href="/_file/pelindo-ico.ico" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          },
          colors: {
            'tps-blue': '#0475BC',
            'tps-blue-dark': '#0366a3',
          },
        },
      },
    }
  </script>

  <style>
    /* Base styles */
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

    /* Line clamp utilities */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-4 {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Smooth animations */
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Section transitions */
    .section-animate {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .section-animate.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Prose styles for rich content */
    .prose h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem; color: #1f2937; }
    .prose h2 { font-size: 1.875rem; font-weight: 700; margin: 2rem 0 1rem; color: #1f2937; }
    .prose h3 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #1f2937; }
    .prose h4 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #1f2937; }
    .prose p { margin-bottom: 1rem; line-height: 1.75; color: #4b5563; }
    .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
    .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
    .prose li { margin-bottom: 0.5rem; color: #4b5563; }
    .prose a { color: #0475BC; text-decoration: underline; }
    .prose a:hover { color: #0366a3; }
    .prose img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem 0; }
    .prose blockquote {
      border-left: 4px solid #0475BC;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #6b7280;
    }
    .prose table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    .prose th, .prose td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
    .prose th { background: #f9fafb; font-weight: 600; }

    ${styles}
  </style>
</head>
<body class="min-h-screen flex flex-col bg-white">
  ${Header({
    logo: header.logo,
    menu: header.menu || [],
    shortcut: header.shortcut,
    lang: header.lang || lang,
  })}

  <main class="flex-1">
    ${children}
  </main>

  ${Footer({
    menu: footer.sitemap || header.menu || [],
    sosmed: footer.sosmed,
    contactus: footer.contactus,
    copyright: footer.copyright,
  })}

  <!-- Client-side JavaScript for interactivity -->
  <script>
    // Mobile menu toggle
    document.getElementById('mobile-menu-btn')?.addEventListener('click', function() {
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
      }
    });

    // Header scroll effect
    window.addEventListener('scroll', function() {
      const header = document.getElementById('main-header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('shadow-lg');
        } else {
          header.classList.remove('shadow-lg');
        }
      }
    });

    // Section scroll animations
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.section-animate').forEach(section => {
      observer.observe(section);
    });

    // Language switcher
    window.setLanguage = function(lang) {
      document.cookie = 'lang=' + lang + ';path=/;max-age=31536000';
      localStorage.setItem('lang', lang);
      window.location.reload();
    };

    // Get current language from cookie or localStorage
    window.getCurrentLanguage = function() {
      const cookieLang = document.cookie.split(';').find(c => c.trim().startsWith('lang='));
      if (cookieLang) return cookieLang.split('=')[1];
      return localStorage.getItem('lang') || 'id';
    };
  </script>

  ${scripts}
</body>
</html>`;
}
