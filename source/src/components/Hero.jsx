import { useEffect, useMemo, useState } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { HeroScrollDemo } from './HeroScrollDemo';

const defaultAppStoreUrl = 'https://apps.apple.com/app/managestate/id6751497970';

export default function Hero({ appStoreUrl = defaultAppStoreUrl, pagePath = '/' }) {
  const [titleNumber, setTitleNumber] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const titles = useMemo(() => [
    'for independent landlords.',
    'with financial clarity.',
    'with document storage.',
    'with data exports.',
    'in one iPhone app.'
  ], []);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const timeoutId = setTimeout(() => setTitleNumber((current) => (current + 1) % titles.length), 2500);
    return () => clearTimeout(timeoutId);
  }, [shouldReduceMotion, titleNumber, titles]);

  const reveal = (delay = 0) => (shouldReduceMotion
    ? undefined
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } });

  return (
    <section className="hero hero--legacy relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animation-delay-2000 animate-blob" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animation-delay-4000 animate-blob" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <Motion.div {...reveal()} className="inline-flex items-center rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm px-3 py-1 text-sm font-medium text-gray-800 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2" aria-hidden="true" />
            v1.0 is now available
          </Motion.div>

          <h1 id="hero-title" className="w-full text-3xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-1">
            Property management <br className="hidden md:block" />
            <span className="relative inline-flex w-full justify-center overflow-hidden text-center h-[1.4em] -mb-4" aria-live="off">
              {titles.map((title, index) => (
                <Motion.span
                  key={title}
                  className="absolute top-0 pb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 whitespace-nowrap"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: '-100%' }}
                  animate={shouldReduceMotion || titleNumber === index ? { y: 0, opacity: 1 } : { y: titleNumber > index ? -150 : 150, opacity: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 50 }}
                >
                  {title}
                </Motion.span>
              ))}
            </span>
          </h1>

          <Motion.p {...reveal(0.2)} className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            ManageState helps independent landlords track rental income, expenses, documents, and property performance in one straightforward iPhone app.
          </Motion.p>

          <Motion.div {...reveal(0.3)} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8">
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-app-store-click
                data-page-path={pagePath}
                data-content-cluster="home"
                data-cta-placement="hero"
                data-language="en"
                data-campaign="website-home"
              >
                Download for iOS <ArrowRight size={18} aria-hidden="true" />
              </a>
            </Button>
          </Motion.div>

          <Motion.div {...reveal(0.4)} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" aria-hidden="true" /><span>Monthly financial summaries</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" aria-hidden="true" /><span>Property document storage</span></div>
          </Motion.div>
        </div>
      </div>

      <HeroScrollDemo />
    </section>
  );
}
