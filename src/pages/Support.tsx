import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Mail, 
  MessageSquare, 
  Search,
  HelpCircle,
  FileText,
  BookOpen,
  Users
} from "lucide-react";
import { useNavigate } from "react-router";
import { Background } from "@/components/landing/Background";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function Support() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I connect my Instagram account?",
      answer: "Go to the Integrations page, click 'Connect' on the Instagram card, and follow the Facebook login prompts. Make sure you have an Instagram Business account linked to a Facebook Page."
    },
    {
      question: "Why aren't my auto-replies working?",
      answer: "Check if your integration is active in the Dashboard. Ensure your Instagram account is a Business account and that you've granted all necessary permissions during the connection process."
    },
    {
      question: "Can I use this with a personal Instagram account?",
      answer: "No, Instagram Automation is only available for Business and Creator accounts due to Meta's API limitations."
    },
    {
      question: "What happens if I reach my message limit?",
      answer: "If you're on a plan with limits, automation will pause until the next day or until you upgrade your plan. We'll notify you when you're close to the limit."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can manage your subscription in the Settings page under the Billing tab. You can cancel at any time."
    }
  ];

  return (
    <div className="min-h-screen relative font-sans">
      <Background />
      <Navbar />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center relative z-10 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-8 shadow-sm">
              <HelpCircle className="h-4 w-4" />
              <span>24/7 Support Center</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
              How can we <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">help you?</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Search our knowledge base, join the community, or contact our support team directly.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <Input 
                type="text" 
                placeholder="Search for answers, guides, and troubleshooting..." 
                className="pl-12 h-14 text-lg shadow-xl border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-xl rounded-2xl transition-all"
              />
            </div>
          </motion.div>
        </section>

        {/* Support Options */}
        <section className="container mx-auto px-4 relative z-10 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-md border-slate-200 hover:border-blue-300 group cursor-pointer hover:-translate-y-1">
                <CardHeader>
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Documentation</CardTitle>
                  <CardDescription>Detailed guides and API references</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-6">
                    Learn how to set up integrations, create flows, and use advanced features step-by-step.
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent font-medium group-hover:translate-x-1 transition-transform">
                    Browse Docs <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-md border-slate-200 hover:border-sky-300 group cursor-pointer hover:-translate-y-1">
                <CardHeader>
                  <div className="h-14 w-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Community</CardTitle>
                  <CardDescription>Join the conversation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-6">
                    Connect with other users, share tips, and get help from the community on Discord.
                  </p>
                  <Button variant="ghost" className="p-0 h-auto text-sky-600 hover:text-sky-700 hover:bg-transparent font-medium group-hover:translate-x-1 transition-transform" asChild>
                    <a href="https://discord.gg/uJzau2BW" target="_blank" rel="noreferrer">
                      Join Discord <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-md border-slate-200 hover:border-green-300 group cursor-pointer hover:-translate-y-1">
                <CardHeader>
                  <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Email Support</CardTitle>
                  <CardDescription>Get direct assistance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-6">
                    Our team typically responds within 24 hours for all technical inquiries.
                  </p>
                  <a href="mailto:thepilab77@gmail.com" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium group-hover:translate-x-1 transition-transform">
                    thepilab77@gmail.com <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 mb-24">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-center mb-10 text-slate-900">Frequently Asked Questions</h2>
              <Card className="shadow-xl border-slate-200/60 bg-white/90 backdrop-blur-xl">
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border-slate-100">
                        <AccordionTrigger className="text-left text-lg font-medium text-slate-800 hover:text-blue-600 hover:no-underline py-4">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 text-base leading-relaxed pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="shadow-2xl border-0 bg-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-pink-500" />
                <CardHeader className="text-center pt-10 pb-2">
                  <CardTitle className="text-2xl font-bold text-slate-900">Still need help?</CardTitle>
                  <CardDescription className="text-lg">Send us a message and we'll get back to you shortly.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-700">Name</Label>
                        <Input id="name" placeholder="Your name" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-slate-700">Subject</Label>
                      <Input id="subject" placeholder="How can we help?" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-slate-700">Message</Label>
                      <Textarea id="message" placeholder="Describe your issue..." rows={5} className="bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none" />
                    </div>
                    <Button className="w-full h-12 text-lg font-medium bg-sky-600 hover:bg-sky-700 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}