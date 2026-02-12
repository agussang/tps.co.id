import { useState } from 'react';
import { imageUrl } from '../utils/api';
import { MenuItem } from '../types';

interface HeaderProps {
  logo?: string;
  menu?: MenuItem[];
  lang?: 'id' | 'en';
}

export function Header({ logo, menu = [], lang = 'id' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  return (
    <header className="bg-[#0475BC] text-white sticky top-0 z-50">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center">
            {logo ? (
              <img
                src={imageUrl(logo)}
                alt="TPS Logo"
                className="h-10 object-contain"
              />
            ) : (
              <span className="text-xl font-bold">TPS</span>
            )}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {menu.map((item) => (
              <div
                key={item.id}
                className="relative group"
                onMouseEnter={() => setActiveSubmenu(item.id)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <a
                  href={item.url !== '#' ? item.url : undefined}
                  className="py-2 text-sm font-medium hover:text-blue-200 transition-colors cursor-pointer"
                >
                  {item.label}
                </a>

                {/* Dropdown */}
                {item.children && item.children.length > 0 && activeSubmenu === item.id && (
                  <div className="absolute top-full left-0 bg-white text-gray-800 shadow-lg rounded-md py-2 min-w-[200px]">
                    {item.children.map((child, idx) => (
                      <a
                        key={idx}
                        href={child.url}
                        className="block px-4 py-2 text-sm hover:bg-blue-50 hover:text-[#0475BC]"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right side - Search & Language */}
          <div className="hidden lg:flex items-center space-x-4">
            <a href="/search" className="hover:text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </a>
            <button className="flex items-center space-x-1 hover:text-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="text-xs uppercase">{lang}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0366a3] border-t border-blue-400">
          <nav className="max-w-7xl mx-auto px-4 py-4">
            {menu.map((item) => (
              <div key={item.id} className="py-2">
                <a
                  href={item.url !== '#' ? item.url : undefined}
                  className="block py-2 font-medium"
                >
                  {item.label}
                </a>
                {item.children && item.children.length > 0 && (
                  <div className="pl-4 mt-1 space-y-1">
                    {item.children.map((child, idx) => (
                      <a
                        key={idx}
                        href={child.url}
                        className="block py-1 text-sm text-blue-100 hover:text-white"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
