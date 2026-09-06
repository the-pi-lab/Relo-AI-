import { Background } from "@/components/landing/Background";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen relative">
      <Background />
      <Navbar />
      <main className="pt-32 pb-16 container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm border-sky-200 bg-sky-50 text-sky-700">
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            About ChatFlow AI
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We're on a mission to revolutionize how businesses interact with their customers through smart automation.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-16">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Who We Are</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                ChatFlow AI was founded by a team of engineers and designers passionate about solving the communication gap between businesses and customers. We believe that automation shouldn't feel robotic—it should feel personal, timely, and helpful.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Proudly developed in India by THE Π LAB, we are building the tools for businesses worldwide to process conversations efficiently with our state-of-the-art automation technology.
              </p>
            </div>
            <div className="bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 mb-2">Smart Logic</div>
                <div className="text-slate-600">Rule-Based Flows</div>
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse"
          >
            <div className="order-2 md:order-1 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 mb-2">24/7</div>
                <div className="text-slate-600">Always Available</div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Our Vision</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We envision a world where businesses can be available 24/7 without burnout. Where customers get instant answers to their questions, regardless of time zones or language barriers.
              </p>
              <p className="text-slate-600 leading-relaxed">
                By leveraging powerful workflow engines and real-time messaging APIs, we're building the infrastructure for the next generation of social commerce.
              </p>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}