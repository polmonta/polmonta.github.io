import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

function TestimonialCard({ quote, author, sourceUrl }) {
  return (
    <figure className="flex-shrink-0 w-[350px] md:w-[420px] p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow mx-4 flex flex-col min-h-[220px] justify-between">
      <blockquote className="text-gray-700 text-lg leading-relaxed">“{quote}”</blockquote>
      <figcaption className="flex items-center gap-3 mt-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold text-sm" aria-hidden="true">{author.slice(0, 2).toUpperCase()}</div>
        <div>
          <div className="font-semibold text-gray-900">{author}</div>
          <div className="flex gap-0.5 mt-1" aria-label="5-star App Store review">
            {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={14} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />)}
          </div>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="sr-only focus:not-sr-only">Read the App Store review</a>
        </div>
      </figcaption>
    </figure>
  );
}

export default function Testimonials({ reviews = [] }) {
  const shouldReduceMotion = useReducedMotion();
  const approvedReviews = reviews.filter((review) => review?.verified && review.quote && review.sourceUrl);
  if (approvedReviews.length === 0) return null;
  const duplicatedReviews = [...approvedReviews, ...approvedReviews];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden scroll-mt-20" aria-labelledby="testimonials-title">
      <div className="container mx-auto px-4 md:px-6 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 id="testimonials-title" className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">App Store feedback.</h2>
          <p className="text-xl text-gray-600">Read verified feedback from ManageState users.</p>
        </div>
      </div>
      <div className="md:hidden px-4">
        <div className="flex flex-col gap-6 items-center">{approvedReviews.map((review) => <TestimonialCard key={review.id} quote={review.quote} author={review.author ?? 'App Store reviewer'} sourceUrl={review.sourceUrl} />)}</div>
      </div>
      <div className="hidden md:block relative">
        <Motion.div
          className="flex"
          animate={shouldReduceMotion ? undefined : { x: [0, -approvedReviews.length * 460] }}
          transition={shouldReduceMotion ? { duration: 0 } : { x: { repeat: Infinity, repeatType: 'loop', duration: 40, ease: 'linear' } }}
        >
          {duplicatedReviews.map((review, index) => <TestimonialCard key={`${review.id}-${index}`} quote={review.quote} author={review.author ?? 'App Store reviewer'} sourceUrl={review.sourceUrl} />)}
        </Motion.div>
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10" aria-hidden="true" />
      </div>
    </section>
  );
}
