import { ReactNode } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MenuItem } from '../types';

interface MainLayoutProps {
  children: ReactNode;
  logo?: string;
  menu?: MenuItem[];
  lang?: 'id' | 'en';
  title?: string;
  description?: string;
}

export function MainLayout({
  children,
  logo,
  menu = [],
  lang = 'id',
  title,
  description,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO Meta - akan di-render di server */}
      {title && (
        <head>
          <title>{title} - Terminal Petikemas Surabaya</title>
          {description && <meta name="description" content={description} />}
        </head>
      )}

      {/* Header */}
      <Header logo={logo} menu={menu} lang={lang} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer logo={logo} />
    </div>
  );
}

export default MainLayout;
