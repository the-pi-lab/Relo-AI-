import { Logo } from "@/components/Logo";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Logo size="sm" />
              <span className="font-bold text-xl text-slate-900">ChatFlow AI</span>
            </div>
            <p className="text-slate-600 mb-6 max-w-sm">
              The complete automation platform for Instagram and WhatsApp. Scale your business with intelligent automation workflows.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/the-%CF%80-lab/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://discord.gg/uJzau2BW" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.48 13.48 0 0 0-.59 1.227 18.355 18.355 0 0 0-5.526 0 13.482 13.482 0 0 0-.59-1.227.074.074 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.418-2.157 2.418z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="mailto:thepilab77@gmail.com" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="/features" className="hover:text-blue-600 transition-colors">Features</a></li>
              <li><a href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</a></li>
              <li><a href="/integrations" className="hover:text-blue-600 transition-colors">Integrations</a></li>
              <li><a href="/changelog" className="hover:text-blue-600 transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li><a href="/about" className="hover:text-blue-600 transition-colors">About Us</a></li>
              <li><a href="/careers" className="hover:text-blue-600 transition-colors">Careers</a></li>
              <li><a href="/support" className="hover:text-blue-600 transition-colors">Support</a></li>
              <li><a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>© 2024 ChatFlow AI by THE Π LAB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}