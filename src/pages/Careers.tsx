import { Background } from "@/components/landing/Background";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Careers() {
  const positions = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "AI Research Scientist",
      department: "AI & ML",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Customer Success Manager",
      department: "Sales",
      location: "Remote",
      type: "Full-time"
    }
  ];

  return (
    <div className="min-h-screen relative">
      <Background />
      <Navbar />
      <main className="pt-32 pb-16 container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm border-green-200 bg-green-50 text-green-700">
            Join the Team
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            Build the future of communication
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We're looking for passionate individuals to help us shape how businesses connect with their customers.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6">
            {positions.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow border-slate-200/60 bg-white/50 backdrop-blur-sm cursor-pointer group">
                  <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {position.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Badge variant="secondary" className="rounded-md">{position.department}</Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {position.type}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="gap-2 group-hover:translate-x-1 transition-transform"
                      asChild
                    >
                      <a href="https://www.linkedin.com/company/the-%CF%80-lab/" target="_blank" rel="noreferrer">
                        Apply Now <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Don't see the right role?</h3>
            <p className="text-slate-600 mb-6">
              We're always looking for talented people. Send us your resume and we'll keep you in mind for future openings.
            </p>
            <Button variant="outline" asChild>
              <a href="https://www.linkedin.com/company/the-%CF%80-lab/" target="_blank" rel="noreferrer">
                Contact Us
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}