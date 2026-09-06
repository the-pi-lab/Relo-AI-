import { Background } from "@/components/landing/Background";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen relative">
      <Background />
      <Navbar />
      <main className="pt-32 pb-16 container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm border-slate-200 bg-slate-50 text-slate-700">
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Last updated: October 24, 2023
          </p>
        </div>

        <Card className="max-w-4xl mx-auto border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <h3>1. Introduction</h3>
            <p>
              Welcome to ChatFlow AI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>

            <h3>2. Data We Collect</h3>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            </p>
            <ul>
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
            </ul>

            <h3>3. How We Use Your Data</h3>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul>
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>

            <h3>4. Data Security</h3>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>

            <h3>5. Contact Us</h3>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at: privacy@chatflow.ai
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
