// Frontend Public Pages - Export semua komponen

// Types
export * from './types';

// Utils
export * from './utils/api';

// Components
export { Header } from './components/Header';
export { Footer } from './components/Footer';

// Layouts
export { MainLayout } from './layouts/MainLayout';

// Pages
export { HomePage } from './pages/HomePage';

// Route definitions
export const publicRoutes = {
  '/': 'HomePage',
  '/profil/:slug': 'ProfilePage',
  '/layanan/:slug': 'ServicePage',
  '/berita/:slug': 'NewsPage',
  '/fasilitas': 'FacilitiesPage',
  '/contact': 'ContactPage',
  '/search': 'SearchPage',
  '/throughput': 'ThroughputPage',
  '/gcg': 'GCGPage',
  '/ppid/:slug': 'PPIDPage',
  '/ppid-info': 'PPIDInfoPage',
  '/sitemap': 'SitemapPage',
  '/tariff': 'TariffPage',
  '/unduh-dokumen': 'DownloadPage',
  '/tutorial': 'TutorialPage',
  '/smi/:slug': 'SMIPage',
} as const;

export type PublicRouteKey = keyof typeof publicRoutes;
