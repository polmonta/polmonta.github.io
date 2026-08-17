import { Linkedin } from 'lucide-react';

const defaultAppStoreUrl = 'https://apps.apple.com/app/managestate/id6751497970';

export default function Footer({ isHomepage = false, appStoreUrl = defaultAppStoreUrl, pagePath = '/', showTestimonials = true }) {
  const sectionHref = (section) => (isHomepage ? `#${section}` : `/#${section}`);

  return (
    <footer className="site-footer site-footer--legacy bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4" aria-label="ManageState home">
              <img src="/img/managestate-logo.png" alt="ManageState logo" width="32" height="32" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold text-white">ManageState</span>
            </a>
            <p className="text-gray-400 max-w-xs">A straightforward iPhone app for rental income, expenses, documents, and property performance.</p>
          </div>
          <div>
            <h2 className="text-white font-semibold mb-4 text-base">Product</h2>
            <ul className="space-y-2">
              <li><a href={sectionHref('features')} className="hover:text-white transition-colors">Features</a></li>
              {showTestimonials && <li><a href={sectionHref('testimonials')} className="hover:text-white transition-colors">Testimonials</a></li>}
              <li><a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" data-app-store-click data-page-path={pagePath} data-content-cluster="home" data-cta-placement="footer" data-language="en" data-campaign="website-home">Download</a></li>
            </ul>
          </div>
          <div>
            <h2 className="text-white font-semibold mb-4 text-base">Legal</h2>
            <ul className="space-y-2"><li><a href="/privacy/" className="hover:text-white transition-colors">Privacy Policy</a></li><li><a href="/terms/" className="hover:text-white transition-colors">Terms of Service</a></li></ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {new Date().getUTCFullYear()} ManageState. All rights reserved.</p>
          <a href="https://www.linkedin.com/company/110310916/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="ManageState on LinkedIn"><Linkedin size={20} aria-hidden="true" /></a>
        </div>
      </div>
    </footer>
  );
}
