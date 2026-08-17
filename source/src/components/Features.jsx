import { motion as Motion, useReducedMotion } from 'framer-motion';
import { BarChart3, CheckCircle2, Wallet } from 'lucide-react';

const featureDefinitions = [
  {
    id: 'claim-monthly-financial-summary',
    title: 'Monthly financial summaries',
    benefits: ['Monthly income', 'Monthly expenses', 'Net income from property transactions'],
    icon: Wallet,
    image: '/img/feature-financial-summary.png',
    alt: 'ManageState monthly financial summary screen'
  },
  {
    id: 'claim-property-document-storage',
    title: 'Property document storage',
    benefits: ['Upload documents for a property', 'Documents for a property', 'Save document metadata'],
    icon: CheckCircle2,
    image: '/img/feature-document-storage.png',
    alt: 'ManageState property document storage screen'
  },
  {
    id: 'claim-xlsx-data-export',
    title: 'XLSX data exports',
    benefits: ['Property and transaction data as XLSX', 'Recurring-item data as XLSX', 'Monthly-summary data as XLSX'],
    icon: BarChart3,
    image: '/img/feature-data-export.png',
    alt: 'ManageState data export screen'
  }
];

export default function Features({ claims = [] }) {
  const shouldReduceMotion = useReducedMotion();
  const availableFeatures = featureDefinitions
    .map((feature) => ({ ...feature, description: claims.find((claim) => claim.id === feature.id)?.text }))
    .filter((feature) => feature.description);

  return (
    <section id="features" className="section section--features section--legacy pt-8 pb-20 bg-white overflow-hidden scroll-mt-20" aria-labelledby="features-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 id="features-title" className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">Everything you need to manage your properties.</h2>
          <p className="text-xl text-gray-600">Verified workflows for the financial and document records landlords use most.</p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {availableFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Motion.div
                key={feature.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.7 }}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16 max-w-5xl mx-auto`}
              >
                <div className="flex-1 space-y-8 max-w-xl">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Icon size={28} aria-hidden="true" /></div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{feature.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-4">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3 text-gray-700 font-medium">
                        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 relative flex items-center justify-center">
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-50 to-purple-50' : 'from-green-50 to-blue-50'} rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10`} aria-hidden="true" />
                  <div className="relative w-[240px] md:w-[280px]">
                    <img src={feature.image} alt={feature.alt} width="480" height="1039" loading="lazy" decoding="async" className="w-full h-auto rounded-[2.5rem] shadow-2xl border-8 border-gray-900/90" />
                  </div>
                </div>
              </Motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
