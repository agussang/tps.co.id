import { imageUrl } from '../utils/api';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterProps {
  logo?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: { icon: string; url: string }[];
  quickLinks?: FooterLink[];
}

export function Footer({
  logo,
  companyName = 'PT Terminal Petikemas Surabaya',
  address = 'Jl. Perak Timur No. 478, Surabaya 60165',
  phone = '031 3202050',
  email = 'corporate.communication@tps.co.id',
  quickLinks = [],
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            {logo && (
              <img
                src={imageUrl(logo)}
                alt={companyName}
                className="h-12 object-contain mb-4 brightness-0 invert"
              />
            )}
            <h3 className="text-white font-bold text-lg mb-2">{companyName}</h3>
            <p className="text-sm mb-4">{address}</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Phone:</span> {phone}
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{' '}
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/profil/visi" className="hover:text-white transition-colors">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="/layanan" className="hover:text-white transition-colors">
                  Layanan
                </a>
              </li>
              <li>
                <a href="/fasilitas" className="hover:text-white transition-colors">
                  Fasilitas
                </a>
              </li>
              <li>
                <a href="/berita" className="hover:text-white transition-colors">
                  Berita
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>

          {/* Online Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Layanan Online</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="http://clique247.tps.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Online Booking (CLIQUE247)
                </a>
              </li>
              <li>
                <a
                  href="https://www.tps.co.id:8081/webaccess"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Web Access
                </a>
              </li>
              <li>
                <a
                  href="https://eproc.pelindo.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  eProcurement
                </a>
              </li>
              <li>
                <a
                  href="https://gss.tps.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Registrasi ID Card
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="/sitemap" className="hover:text-white">
                Sitemap
              </a>
              <a href="/ppid-info" className="hover:text-white">
                PPID
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
