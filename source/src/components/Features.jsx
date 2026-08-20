import { motion } from 'framer-motion';
import { Wallet, Building2, BarChart3, CheckCircle2 } from 'lucide-react';

const features = [
    {
        title: "Your Property's Finances at a Glance",
        description: "Get a clear, real-time view of your income and expenses. Track monthly performance and spot trends instantly.",
        icon: Wallet,
        image: "/img/yourpropertyfinances.PNG",
        benefits: ["Real-time dashboard", "Monthly comparisons", "Cash flow tracking"]
    },
    {
        title: "Make Data Driven Decisions",
        description: "Deep dive into your portfolio's performance with detailed statistics. Export reports for tax season with a single tap.",
        icon: BarChart3,
        image: "/img/makedatadriven.PNG",
        benefits: ["Visual charts", "CSV Exports", "Category based analysis"]
    },
    {
        title: "Track Every Dollar Effortlessly",
        description: "Log transactions in seconds. Categorize expenses, attach receipts, and never lose track of where your money goes.",
        icon: Building2,
        image: "/img/trackeverydollar.PNG",
        benefits: ["Smart categorization", "Recurring & one-time transactions", "Filter by date, property, category, etc."]
    },
    {
        title: "Centralize All Your Property Details",
        description: "Store everything from lease agreements to maintenance records in one secure place. Access your documents anywhere.",
        icon: CheckCircle2,
        image: "/img/centralize.PNG",
        benefits: ["Document storage", "Tenant details", "Maintenance logs"]
    }
];

export default function Features() {
    return (
        <section id="features" className="pt-8 pb-20 bg-white overflow-hidden scroll-mt-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                        Everything you need to manage your properties.
                    </h2>
                    <p className="text-xl text-gray-600">
                        Powerful features wrapped in a simple, intuitive interface.
                    </p>
                </div>

                <div className="space-y-24 md:space-y-32">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7 }}
                            className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16 max-w-5xl mx-auto`}
                        >
                            {/* Text Side */}
                            <div className="flex-1 space-y-8 max-w-xl">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                                <ul className="space-y-4">
                                    {feature.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Image Side */}
                            <div className="flex-1 relative flex items-center justify-center">
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-50 to-purple-50' : 'from-green-50 to-blue-50'} rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10`} />
                                <div className="relative w-[240px] md:w-[280px]">
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="w-full h-auto rounded-[2.5rem] shadow-2xl border-8 border-gray-900/90"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
