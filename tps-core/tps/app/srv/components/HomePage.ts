/**
 * HomePage Template - SSR
 * Menggabungkan semua komponen menjadi halaman lengkap
 */

import { Header } from './Header';
import { HeroBanner } from './HeroBanner';
import { Services } from './Services';
import { Profile } from './Profile';
import { Throughput } from './Throughput';
import { VesselSchedule } from './VesselSchedule';
import { News } from './News';
import { Customers } from './Customers';
import { Instagram } from './Instagram';
import { Footer } from './Footer';

interface HomePageProps {
  content: {
    banners?: any[];
    profile?: any;
    service?: any[];
    throughput?: any[];
    jadwal_sandar_kapal?: any[];
    jadwal_closing_kapal?: any[];
    latest_news?: any[];
    pelanggan?: any[];
    sosmed?: any[];
    ig?: any[];
    attributes?: Record<string, string>;
    popup?: any;
  };
  header: {
    logo?: string;
    menu?: any[];
    shortcut?: { menu: any[] };
    lang?: string;
  };
  footer: {
    sitemap?: any[];
    copyright?: string;
    contactus?: any;
  };
}

export function HomePage({ content, header, footer }: HomePageProps): string {
  const {
    banners = [],
    profile,
    service = [],
    throughput = [],
    jadwal_sandar_kapal = [],
    jadwal_closing_kapal = [],
    latest_news = [],
    pelanggan = [],
    sosmed = [],
    ig = [],
    attributes = {},
  } = content;

  const labels = {
    vessel_alongside_title: attributes.vessel_alongside_title,
    vessel_schedule_title: attributes.vessel_schedule_title,
  };

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal Petikemas Surabaya</title>
  <meta name="description" content="PT Terminal Petikemas Surabaya (TPS) - World Class Performance Terminal Operator" />
  <meta name="keywords" content="tps, terminal petikemas surabaya, container terminal" />
  <meta property="og:title" content="Terminal Petikemas Surabaya" />
  <meta property="og:description" content="PT Terminal Petikemas Surabaya (TPS) - World Class Performance Terminal Operator" />
  <meta property="og:image" content="https://www.tps.co.id/_img/layout/header/tps-logo-juara-25.png" />
  <meta property="og:url" content="https://www.tps.co.id/" />
  <meta property="og:type" content="website" />
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
        },
      },
    }
  </script>

  <style>
    /* Custom styles */
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

    /* Smooth animations */
    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-white">
  ${Header({
    logo: header.logo,
    menu: header.menu || [],
    shortcut: header.shortcut,
    lang: header.lang || 'id',
  })}

  <main class="flex-1">
    ${HeroBanner({ banners })}
    ${Services({ services: service, title: attributes.homepage_service_title })}
    ${Profile({ profile })}
    ${Throughput({ stats: throughput, title: attributes.homepage_throughput_title })}
    ${VesselSchedule({ sandar: jadwal_sandar_kapal, closing: jadwal_closing_kapal, labels })}
    ${News({ news: latest_news, title: attributes.latest_news })}
    ${Customers({ customers: pelanggan, title: attributes.homepage_our_customers })}
    ${Instagram({ posts: ig, title: attributes.follow_us, description: attributes.homepage_instagram_description })}
  </main>

  ${Footer({
    menu: footer.sitemap || header.menu || [],
    sosmed,
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
    let lastScrollY = 0;
    window.addEventListener('scroll', function() {
      const header = document.getElementById('main-header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('shadow-lg');
        } else {
          header.classList.remove('shadow-lg');
        }
      }
      lastScrollY = window.scrollY;
    });

    // Banner slider (if multiple banners)
    const bannerDots = document.querySelectorAll('.banner-dot');
    if (bannerDots.length > 1) {
      let currentSlide = 0;
      const totalSlides = bannerDots.length;

      function updateSlide(index) {
        bannerDots.forEach((dot, i) => {
          if (i === index) {
            dot.classList.remove('bg-white/40', 'w-2');
            dot.classList.add('bg-white', 'w-10');
          } else {
            dot.classList.remove('bg-white', 'w-10');
            dot.classList.add('bg-white/40', 'w-2');
          }
        });
        currentSlide = index;
      }

      bannerDots.forEach((dot, index) => {
        dot.addEventListener('click', () => updateSlide(index));
      });

      // Auto-slide
      setInterval(() => {
        updateSlide((currentSlide + 1) % totalSlides);
      }, 8000);
    }
  </script>
</body>
</html>
  `;
}
