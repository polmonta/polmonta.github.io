import { Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img 
                                src="/img/ManageState logo.png" 
                                alt="ManageState Logo" 
                                className="w-8 h-8 rounded-lg"
                            />
                            <span className="text-xl font-bold text-white">ManageState</span>
                        </div>
                        <p className="text-gray-400 max-w-xs">
                            The modern way to manage your property portfolio. Built for iOS.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
                            <li><a href="https://apps.apple.com/us/app/managestate/id6751497970" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Download</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li><a href="/contact.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} ManageState. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="https://www.linkedin.com/company/110310916/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
