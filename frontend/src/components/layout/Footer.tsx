import { Link } from 'react-router-dom';
import { Globe, Share2, Video, Smartphone, Play } from 'lucide-react';


const aboutLinks = [
  { label: 'Về V-Shop Vietnam', href: '/about' },
  { label: 'Tuyển dụng', href: '/careers' },
  { label: 'Điều khoản sử dụng', href: '/terms' },
  { label: 'Chính sách bảo mật', href: '/privacy' },
];

const supportLinks = [
  { label: 'Trung tâm trợ giúp', href: '/help' },
  { label: 'Hướng dẫn mua hàng', href: '/guide' },
  { label: 'Trả hàng & Hoàn tiền', href: '/returns' },
  { label: 'Liên hệ', href: '/contact' },
];

export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 py-10 max-w-[1280px] mx-auto">

        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="text-xl font-bold text-on-surface hover:text-primary transition-colors">
            V-Shop
          </Link>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Sàn thương mại điện tử hàng đầu Việt Nam, mang đến trải nghiệm mua sắm thông minh và hiện đại nhất.
          </p>
          <div className="flex gap-4 mt-1">
            <a href="#" aria-label="Website" className="text-on-surface-variant hover:text-primary transition-colors">
              <Globe size={20} />
            </a>
            <a href="#" aria-label="Chia sẻ" className="text-on-surface-variant hover:text-primary transition-colors">
              <Share2 size={20} />
            </a>
            <a href="#" aria-label="Video" className="text-on-surface-variant hover:text-primary transition-colors">
              <Video size={20} />
            </a>
          </div>
        </div>

        {/* Về chúng tôi */}
        <div>
          <h4 className="text-xs font-semibold text-on-surface mb-6 uppercase tracking-wider">
            Về chúng tôi
          </h4>
          <ul className="flex flex-col gap-3">
            {aboutLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary hover:underline transition-all"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Hỗ trợ khách hàng */}
        <div>
          <h4 className="text-xs font-semibold text-on-surface mb-6 uppercase tracking-wider">
            Hỗ trợ khách hàng
          </h4>
          <ul className="flex flex-col gap-3">
            {supportLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary hover:underline transition-all"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Tải ứng dụng */}
        <div>
          <h4 className="text-xs font-semibold text-on-surface mb-6 uppercase tracking-wider">
            Tải ứng dụng
          </h4>
          <p className="text-sm text-on-surface-variant mb-4">
            Trải nghiệm mua sắm tốt hơn trên Mobile App.
          </p>
          <div className="flex flex-col gap-3">
            <button className="bg-on-surface text-white px-5 py-2.5 rounded-lg flex items-center gap-3 hover:bg-black transition-colors w-fit">
              <Smartphone size={20} />
              <div className="text-left">
                <p className="text-[10px] leading-tight opacity-70">Download on the</p>
                <p className="text-sm font-bold leading-tight">App Store</p>
              </div>
            </button>
            <button className="bg-on-surface text-white px-5 py-2.5 rounded-lg flex items-center gap-3 hover:bg-black transition-colors w-fit">
              <Play size={20} />
              <div className="text-left">
                <p className="text-[10px] leading-tight opacity-70">GET IT ON</p>
                <p className="text-sm font-bold leading-tight">Google Play</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-outline-variant/30 py-6 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} V-Shop Vietnam. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
