import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 py-4' : 'bg-transparent py-6'
                }`}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img
                        src="/img/logo.png"
                        alt="ManageState Logo"
                        className="w-8 h-8 rounded-lg"
                    />
                    <span className="text-xl font-bold tracking-tight text-gray-900">ManageState</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                        Features
                    </a>
                    <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                        Testimonials
                    </a>
                    <a href="https://apps.apple.com/us/app/managestate/id6751497970" target="_blank" rel="noopener noreferrer">
                        <Button>Download App</Button>
                    </a>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-gray-600"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                            <a
                                href="#features"
                                className="text-base font-medium text-gray-600 py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Features
                            </a>
                            <a
                                href="#testimonials"
                                className="text-base font-medium text-gray-600 py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Testimonials
                            </a>
                            <a href="https://apps.apple.com/us/app/managestate/id6751497970" target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button className="w-full">Download App</Button>
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
