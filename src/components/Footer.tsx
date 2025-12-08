import React from 'react';
import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const footerLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Gear', href: '/gear' },
    { label: 'Brands', href: '/brands' },
    { label: 'Events', href: '/events' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container-narrow px-4 md:px-6">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <h3 className="text-2xl font-heading font-bold mb-4">
                Race & Rally <span className="text-motorsport-yellow">Australia</span>
              </h3>
              <p className="text-gray-400 mb-6">
                Professional motorsport equipment for Australian conditions.
                Race-proven performance, safety without compromise.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="text-gray-400 hover:text-motorsport-yellow transition-colors"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-heading font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {footerLinks.slice(0, 5).map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-motorsport-yellow transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-heading font-bold text-lg mb-4">Resources</h4>
              <ul className="space-y-2">
                {footerLinks.slice(5).map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-motorsport-yellow transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-heading font-bold text-lg mb-4">Contact</h4>
              <address className="not-italic text-gray-400 space-y-2">
                <p>123 Motorsport Way</p>
                <p>Melbourne, VIC 3000</p>
                <p>Australia</p>
                <p className="mt-4">
                  <a href="mailto:sales@raceandrallyaustralia.com.au" className="hover:text-motorsport-yellow">
                    sales@raceandrallyaustralia.com.au
                  </a>
                </p>
                <p>
                  <a href="tel:+611300123456" className="hover:text-motorsport-yellow">
                    +61 1300 123 456
                  </a>
                </p>
              </address>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>© 2025 Race & Rally Australia. All rights reserved.</p>
            <p className="mt-2">
              Professional motorsport equipment brand. This is a pre-commerce website stage.
              {/* TODO: Stage 2 - Add e-commerce functionality */}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
