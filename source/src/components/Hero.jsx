import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { HeroScrollDemo } from './HeroScrollDemo';

export default function Hero() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => [
            "simplified for everyone.",
            "driven by data.",
            "that maximizes returns.",
            "with financial clarity.",
            "at your fingertips."
        ],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2500); // Change this value (2000ms) to adjust the animation timing
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
                <div className="absolute top-20 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
            </div>

            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-gray-800 mb-6"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                        v1.0 is now available
                    </motion.div>

                    <h1 className="w-full text-3xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-1">
                        Property management <br className="hidden md:block" />
                        <span className="relative inline-flex w-full justify-center overflow-hidden text-center h-[1.4em] -mb-4">
                            {titles.map((title, index) => (
                                <motion.span
                                    key={index}
                                    className="absolute top-0 pb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 whitespace-nowrap"
                                    initial={{ opacity: 0, y: "-100" }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                    animate={
                                        titleNumber === index
                                            ? {
                                                y: 0,
                                                opacity: 1,
                                            }
                                            : {
                                                y: (titleNumber > index && !(titleNumber === titles.length - 1 && index === 0)) || (titleNumber === 0 && index === titles.length - 1) ? -150 : 150,
                                                opacity: 0,
                                            }
                                    }
                                >
                                    {title}
                                </motion.span>
                            ))}
                        </span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
                    >
                        ManageState helps you track income, expenses, and property performance in one beautiful app. Built for modern investors.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                    >
                        <a href="https://apps.apple.com/us/app/managestate/id6751497970" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
                                Download for iOS <ArrowRight size={18} />
                            </Button>
                        </a>
                        {/*<Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                            View Demo
                        </Button>*/}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 flex items-center gap-6 text-sm text-gray-500"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span>Free to start</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span>No credit card required</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Scroll Animation */}
            <HeroScrollDemo />
        </section>
    );
}
