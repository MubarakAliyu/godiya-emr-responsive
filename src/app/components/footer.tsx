import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">Godiya Hospital</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Trusted 24/7 healthcare in Birnin Kebbi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  to="/doctors"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Doctors
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/emr-login"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  EMR Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm text-gray-300">
                <Phone className="h-4 w-4 mt-1 flex-shrink-0" />
                <div>
                  <div>0706 669 4965</div>
                  <div>0803 224 0767</div>
                  <div>0803 586 8002</div>
                </div>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span>
                  Umaru Gwadu Road, beside Forte Filling Station, Birnin Kebbi,
                  Kebbi State, Nigeria
                </span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-300">
                <Clock className="h-4 w-4 mt-1 flex-shrink-0" />
                <span>Open 24 Hours (Monday - Sunday)</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 text-sm hover:text-white transition-colors"
                >
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Godiya Hospital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}