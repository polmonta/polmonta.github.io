import { useEffect, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

const defaultAppStoreUrl = 'https://apps.apple.com/app/managestate/id6751497970';

export default function Navbar({ appStoreUrl = defaultAppStoreUrl, pagePath = '/', isHomepage = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionHref = (section) => (isHomepage ? `#${section}` : `/#${section}`);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav
      className={`site-header site-header--legacy fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 py-4' : 'bg-transparent py-6'}`}
      aria-label="Primary navigation"
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2" aria-label="ManageState home">
          <img src="/img/managestate-logo.png" alt="ManageState logo" width="32" height="32" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold tracking-tight text-gray-900">ManageState</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href={sectionHref('features')} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Features</a>
          <a href={sectionHref('testimonials')} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Testimonials</a>
          <Button asChild>
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-app-store-click
              data-page-path={pagePath}
              data-content-cluster="home"
              data-cta-placement="nav"
              data-language="en"
              data-campaign="website-home"
            >Download App</a>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-gray-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <Motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <a href={sectionHref('features')} className="text-base font-medium text-gray-600 py-2" onClick={closeMobileMenu}>Features</a>
              <a href={sectionHref('testimonials')} className="text-base font-medium text-gray-600 py-2" onClick={closeMobileMenu}>Testimonials</a>
              <Button asChild className="w-full">
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-app-store-click
                  data-page-path={pagePath}
                  data-content-cluster="home"
                  data-cta-placement="nav-mobile"
                  data-language="en"
                  data-campaign="website-home"
                >Download App</a>
              </Button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
