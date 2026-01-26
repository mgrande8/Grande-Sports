import Link from 'next/link'
import { Instagram, Twitter, Youtube, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gs-black text-gs-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">Grande Sports</h3>
            <p className="text-gs-gray-400 text-sm">
              Become a Better Footballer
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/book" className="text-gs-gray-400 hover:text-gs-green transition-colors">
                  Book a Session
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gs-gray-400 hover:text-gs-green transition-colors">
                  Athlete Dashboard
                </Link>
              </li>
              <li>
                <a 
                  href="https://grandesportstraining.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gs-gray-400 hover:text-gs-green transition-colors"
                >
                  Digital Products
                </a>
              </li>
              <li>
                <a 
                  href="https://grandesportstraining.com/pages/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gs-gray-400 hover:text-gs-green transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/grandesportstraining/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gs-gray-400 hover:text-gs-green transition-colors"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://x.com/@grandesportsHQ" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gs-gray-400 hover:text-gs-green transition-colors"
              >
                <Twitter size={24} />
              </a>
              <a 
                href="https://youtube.com/@footytactics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gs-gray-400 hover:text-gs-green transition-colors"
              >
                <Youtube size={24} />
              </a>
              <a 
                href="https://facebook.com/grandesportstraining" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gs-gray-400 hover:text-gs-green transition-colors"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gs-gray-800 mt-8 pt-8 text-center text-sm text-gs-gray-500">
          <p>© {new Date().getFullYear()} Grande Sports. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
