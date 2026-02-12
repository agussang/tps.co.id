import { useState, useEffect, useRef } from 'react';

interface HomePageProps {
  content?: {
    banners?: any[];
    profile?: any;
    service?: any[];
    latest_news?: any[];
    throughput?: any[];
    menu?: any[];
    header?: any;
    footer?: any;
    shortcut_menu?: any[];
  };
}

// Image URL helper
function img(path: string, width?: number): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `/_img${path}`;
  return width ? `/_img/${path}?w=${width}` : `/_img/${path}`;
}

// Site URL helper
function siteurl(path: string): string {
  return path;
}

// Header Component - Matching existing site
function Header({ menu = [], logo }: { menu: any[]; logo?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg' : 'bg-white/95'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-[80px]">
          {/* Logo */}
          <a href="/" className="flex-shrink-0">
            <img
              src={logo ? img(logo) : "/_img/layout/header/tps-logo-juara-25.png"}
              alt="TPS"
              className="h-[50px] object-contain"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {menu.map((item: any, idx: number) => (
              <div
                key={idx}
                className="relative group"
                onMouseEnter={() => setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <a
                  href={item.url || '#'}
                  className="px-4 py-6 text-[15px] font-medium text-[#333] hover:text-[#0475BC] flex items-center gap-1 transition-colors"
                >
                  {item.label}
                  {item.items && item.items.length > 0 && (
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </a>
                {/* Dropdown */}
                {item.items && item.items.length > 0 && activeMenu === item.label && (
                  <div className="absolute top-full left-0 bg-white shadow-xl rounded-lg py-2 min-w-[220px] z-50 border border-gray-100">
                    {item.items.map((sub: any, subIdx: number) => (
                      <div key={subIdx} className="relative group/sub">
                        <a
                          href={sub.url || '#'}
                          className="block px-5 py-3 text-[14px] text-[#333] hover:bg-[#0475BC] hover:text-white transition-colors flex items-center justify-between"
                        >
                          {sub.label}
                          {sub.items && sub.items.length > 0 && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </a>
                        {/* Sub-dropdown */}
                        {sub.items && sub.items.length > 0 && (
                          <div className="absolute left-full top-0 bg-white shadow-xl rounded-lg py-2 min-w-[200px] hidden group-hover/sub:block border border-gray-100">
                            {sub.items.map((subSub: any, subSubIdx: number) => (
                              <a
                                key={subSubIdx}
                                href={subSub.url || '#'}
                                className="block px-5 py-3 text-[14px] text-[#333] hover:bg-[#0475BC] hover:text-white transition-colors"
                              >
                                {subSub.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side - Language & Search */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-sm">
              <a href="?lang=id" className="text-[#0475BC] font-semibold">ID</a>
              <span className="text-gray-300">|</span>
              <a href="?lang=en" className="text-gray-500 hover:text-[#0475BC]">EN</a>
            </div>
            <button className="hidden md:flex w-10 h-10 items-center justify-center text-[#0475BC] hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-[#0475BC]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4">
            {menu.map((item: any, idx: number) => (
              <div key={idx} className="border-b border-gray-100">
                <a
                  href={item.url || '#'}
                  className="block py-4 text-[15px] font-medium text-[#333]"
                >
                  {item.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// Hero Banner Section - Full screen with video
function HeroBanner({ banners = [] }: { banners: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#0475BC] via-[#034a75] to-[#023354] flex items-center justify-center pt-[80px]">
        <div className="text-center text-white">
          <p className="text-xl uppercase tracking-[0.3em] mb-4 text-blue-200">World Class Performance</p>
          <h1 className="text-6xl md:text-8xl font-bold">Terminal Operator</h1>
          <p className="text-2xl mt-6">Terminal Petikemas Surabaya</p>
        </div>
      </div>
    );
  }

  const banner = banners[currentSlide];

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Video/Image Background */}
      {banner.video ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`/_file/${banner.video}`} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${img(banner.image_desktop)})` }}
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center pt-[80px]">
        <div className="text-white max-w-2xl">
          <p className="text-lg md:text-xl uppercase tracking-[0.25em] mb-4 text-white/80 font-light">
            {banner.subtitle || 'World Class Performance'}
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            {banner.title || 'Terminal Operator'}
          </h1>
          {banner.description && (
            <p className="text-lg md:text-xl mb-10 text-white/90 max-w-xl leading-relaxed">
              {banner.description}
            </p>
          )}
          {banner.url && banner.label_button && (
            <a
              href={banner.url}
              className="inline-flex items-center gap-3 bg-[#0475BC] hover:bg-[#035a91] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              {banner.label_button}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Slide Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'bg-white w-10' : 'bg-white/40 w-2 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 right-10 hidden md:flex flex-col items-center text-white/60">
        <div className="animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}

// Services Section - 4 Column Grid
function ServicesSection({ services = [] }: { services: any[] }) {
  if (services.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[#333] mb-4">
            Layanan Online
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Nikmati kemudahan akses layanan Terminal Petikemas Surabaya
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service: any, idx: number) => (
            <a
              key={idx}
              href={service.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-[20px] p-8 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-[#0475BC]/20 hover:-translate-y-1"
            >
              {service.icon && (
                <div className="w-20 h-20 mb-6 flex items-center justify-center bg-gradient-to-br from-[#0475BC]/10 to-[#0475BC]/5 rounded-2xl group-hover:from-[#0475BC] group-hover:to-[#035a91] transition-all duration-300">
                  <img
                    src={img(service.icon)}
                    alt={service.title}
                    className="w-12 h-12 object-contain group-hover:brightness-0 group-hover:invert transition-all"
                  />
                </div>
              )}
              <h3 className="text-xl font-bold mb-3 text-[#333] group-hover:text-[#0475BC] transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                {service.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Profile/About Section
function ProfileSection({ profile }: { profile: any }) {
  if (!profile) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#0475BC] font-semibold uppercase tracking-wider text-sm mb-4">
              {profile.tagline || 'World Class Performance Terminal Operator'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#333] leading-tight">
              {profile.title || 'Terminal Petikemas Surabaya'}
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {profile.summary}
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/profil/visi"
                className="inline-flex items-center gap-2 bg-[#0475BC] hover:bg-[#035a91] text-white px-8 py-4 rounded-full font-semibold transition-all"
              >
                Selengkapnya
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              {profile.video_url && (
                <a
                  href={`https://youtube.com/watch?v=${profile.video_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-[#0475BC] text-[#0475BC] hover:bg-[#0475BC] hover:text-white px-8 py-4 rounded-full font-semibold transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Tonton Video
                </a>
              )}
            </div>
          </div>
          {profile.banner && (
            <div className="relative">
              <div className="rounded-[30px] overflow-hidden shadow-2xl">
                <img
                  src={img(profile.banner)}
                  alt={profile.title}
                  className="w-full h-[450px] object-cover"
                />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#0475BC]/10 rounded-[20px] -z-10" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#0475BC]/10 rounded-[20px] -z-10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Throughput Stats Section - Matching existing blue design
function ThroughputSection({ stats = [] }: { stats: any[] }) {
  if (stats.length === 0) return null;

  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0475BC 0%, #034a75 50%, #023354 100%)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Annual Throughput
          </h2>
          <p className="text-blue-200 text-lg">
            Statistik Petikemas Tahunan
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {stats.map((stat: any, idx: number) => (
            <a
              key={idx}
              href={stat.url || '/throughput'}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              {stat.icon && (
                <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                  <img
                    src={img(stat.icon)}
                    alt={stat.title}
                    className="w-14 h-14 brightness-0 invert"
                  />
                </div>
              )}
              <p className="text-5xl md:text-6xl font-bold text-white mb-3">{stat.value}</p>
              <p className="text-blue-200 text-lg">{stat.title}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// News Section - Card Grid Style
function NewsSection({ news = [] }: { news: any[] }) {
  if (news.length === 0) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-14 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#333]">Berita Terbaru</h2>
            <p className="text-gray-500 mt-2 text-lg">Informasi dan kegiatan terkini</p>
          </div>
          <a
            href="/berita/press-release"
            className="inline-flex items-center gap-2 border-2 border-[#0475BC] text-[#0475BC] hover:bg-[#0475BC] hover:text-white px-6 py-3 rounded-full font-semibold transition-all"
          >
            Lihat Semua
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {news.slice(0, 4).map((item: any, idx: number) => (
            <a
              key={idx}
              href={`/berita/press-release/${item.slug}`}
              className="group bg-white rounded-[20px] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-56 overflow-hidden">
                {item.image && (
                  <img
                    src={img(item.image, 500)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-6">
                <p className="text-sm text-[#0475BC] font-medium mb-3">
                  {formatDate(item.publish_date)}
                </p>
                <h3 className="font-bold text-[#333] group-hover:text-[#0475BC] transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Component - Matching existing design
function Footer({ footer, menu = [] }: { footer: any; menu: any[] }) {
  return (
    <footer className="bg-[#1a1a2e] text-white">
      {/* Main Footer */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <img
              src="/_img/layout/header/tps-logo-juara-25.png"
              alt="TPS"
              className="h-14 mb-6 brightness-0 invert"
            />
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              PT Terminal Petikemas Surabaya adalah penyedia layanan jasa dalam mata rantai logistik,
              khususnya petikemas ekspor/impor di Indonesia.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a href="https://instagram.com/pttps_official" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-[#0475BC] rounded-full flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <circle cx="12" cy="12" r="3.5"/>
                </svg>
              </a>
              <a href="https://youtube.com/@pttps_official" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-[#0475BC] rounded-full flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/pttps" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-[#0475BC] rounded-full flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Menu Utama</h4>
            <ul className="space-y-3">
              {menu.slice(0, 6).map((item: any, idx: number) => (
                <li key={idx}>
                  <a href={item.url || '#'} className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6">Kontak Kami</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Jl. Tanjung Mutiara No. 1,<br />Surabaya 60177, Indonesia</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>031-3202020</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-[#0475BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>cs@tps.co.id</span>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-lg font-bold mb-6">Jam Operasional</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex justify-between">
                <span>Senin - Jumat</span>
                <span className="text-white">07:00 - 17:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sabtu</span>
                <span className="text-white">07:00 - 12:00</span>
              </li>
              <li className="flex justify-between">
                <span>Minggu</span>
                <span className="text-gray-500">Tutup</span>
              </li>
            </ul>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-3">Operasional Terminal</p>
              <p className="text-white font-semibold">24 Jam / 7 Hari</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} PT Terminal Petikemas Surabaya. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="/kebijakan-privasi" className="text-gray-400 hover:text-white transition-colors">Kebijakan Privasi</a>
              <a href="/syarat-ketentuan" className="text-gray-400 hover:text-white transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Karir Page Section
function KarirSection({ karir, lowongan = [] }: { karir: any; lowongan: any[] }) {
  const headerContent = karir?.header_content || karir || {};

  return (
    <>
      {/* Hero Banner for Karir */}
      <section
        className="relative pt-[120px] pb-20 bg-cover bg-center"
        style={{
          backgroundImage: headerContent.banner
            ? `linear-gradient(rgba(4, 117, 188, 0.9), rgba(4, 117, 188, 0.85)), url(${img(headerContent.banner)})`
            : 'linear-gradient(135deg, #0475BC 0%, #034a75 100%)'
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {headerContent.title || 'Karir'}
          </h1>
          {headerContent.subtitle && (
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              {headerContent.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Description */}
      {headerContent.description && (
        <section className="py-12 bg-white">
          <div className="max-w-[900px] mx-auto px-4 lg:px-8">
            <div
              className="prose prose-lg max-w-none text-gray-600 text-center"
              dangerouslySetInnerHTML={{ __html: headerContent.description }}
            />
          </div>
        </section>
      )}

      {/* Job Listings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#333] mb-10 text-center">
            Lowongan Tersedia
          </h2>

          {lowongan.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lowongan.map((job: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white rounded-[20px] p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <h3 className="text-xl font-bold text-[#0475BC] mb-3">
                    {job.title || 'Posisi'}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.department && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                        {job.department}
                      </span>
                    )}
                    {job.location && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                        {job.location}
                      </span>
                    )}
                    {job.type && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                        {job.type}
                      </span>
                    )}
                  </div>
                  {job.description && (
                    <div
                      className="text-gray-600 mb-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  )}
                  {job.requirements && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Persyaratan:</p>
                      <div
                        className="text-gray-600 text-sm"
                        dangerouslySetInnerHTML={{ __html: job.requirements }}
                      />
                    </div>
                  )}
                  {job.deadline && (
                    <p className="text-sm text-gray-500 mb-4">
                      <strong>Batas Waktu:</strong> {job.deadline}
                    </p>
                  )}
                  <a
                    href={job.apply_url || '#'}
                    className="inline-flex items-center gap-2 bg-[#0475BC] hover:bg-[#035a91] text-white px-6 py-3 rounded-full font-semibold text-sm transition-all"
                  >
                    Lamar Sekarang
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-[20px]">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <p className="text-gray-500 text-xl font-medium">Tidak ada lowongan saat ini</p>
              <p className="text-gray-400 mt-2">Silakan cek kembali nanti</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// Main HomePage Component
export function HomePage({ content = {} }: HomePageProps) {
  const {
    banners = [],
    profile,
    service = [],
    latest_news = [],
    throughput = [],
    menu = [],
    footer,
    // Karir page specific
    page_type,
    karir,
    lowongan,
    header_content,
  } = content as any;

  // Check if this is a karir page
  const isKarirPage = page_type === 'karir';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header menu={menu} />
      <main className="flex-1">
        {isKarirPage ? (
          <KarirSection karir={{ ...karir, header_content }} lowongan={lowongan || []} />
        ) : (
          <>
            <HeroBanner banners={banners} />
            <ServicesSection services={service} />
            <ProfileSection profile={profile} />
            <ThroughputSection stats={throughput} />
            <NewsSection news={latest_news} />
          </>
        )}
      </main>
      <Footer footer={footer} menu={menu} />
    </div>
  );
}

export default HomePage;
