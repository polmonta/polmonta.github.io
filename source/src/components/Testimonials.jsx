import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "This app has completely transformed how I manage my rental units. The financial tracking is a lifesaver.",
        author: "Sarah Johnson",
        role: "Property Investor"
    },
    {
        quote: "Simple, clean, and effective. Exactly what I was looking for to keep track of my Airbnb properties.",
        author: "Michael Chen",
        role: "Host"
    },
    {
        quote: "The best property management app on iOS. The interface is beautiful and intuitive.",
        author: "David Smith",
        role: "Landlord"
    },
    {
        quote: "ManageState has saved me countless hours. Everything I need is right at my fingertips.",
        author: "Emma Williams",
        role: "Real Estate Investor"
    },
    {
        quote: "Finally, a property management app that doesn't overwhelm you with features. It's perfect.",
        author: "James Martinez",
        role: "Owner"
    },
    {
        quote: "The reporting features are incredible. Tax season has never been easier!",
        author: "Lisa Anderson",
        role: "Property Manager"
    }
];

const TestimonialCard = ({ quote, author, role }) => (
    <motion.div
        className="flex-shrink-0 w-[350px] md:w-[420px] p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow mx-4 flex flex-col min-h-[220px] justify-between"
    >
        <p className="text-gray-700 text-lg leading-relaxed">
            "{quote}"
        </p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {author.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
                <div className="font-semibold text-gray-900">{author}</div>
                <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

export default function Testimonials() {
    // Duplicate testimonials for seamless loop
    const duplicatedTestimonials = [...testimonials, ...testimonials];

    return (
        <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 mb-12">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                        Loved by property owners.
                    </h2>
                    <p className="text-xl text-gray-600">
                        Don't take our word for it. See why ManageState is trusted by investors around the world.
                    </p>
                </div>
            </div>

            {/* Mobile: Static 3 testimonials */}
            <div className="md:hidden px-4">
                <div className="flex flex-col gap-6 items-center">
                    {testimonials.slice(0, 3).map((testimonial, index) => (
                        <TestimonialCard
                            key={index}
                            {...testimonial}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop: Scrolling testimonials */}
            <div className="hidden md:block relative">
                <motion.div
                    className="flex"
                    animate={{
                        x: [0, -testimonials.length * 460],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 40,
                            ease: "linear",
                        },
                    }}
                >
                    {duplicatedTestimonials.map((testimonial, index) => (
                        <TestimonialCard
                            key={index}
                            {...testimonial}
                        />
                    ))}
                </motion.div>

                {/* Gradient overlays */}
                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            </div>
        </section>
    );
}
