import { BUSINESS_INFO, SITE_METADATA } from "@/../../shared/const";
import { Phone, MapPin, Clock, Facebook } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  // LocalBusiness Schema for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": BUSINESS_INFO.name,
    "image": `${SITE_METADATA.siteUrl}/images/logo.png`,
    "telephone": BUSINESS_INFO.phone,
    "email": BUSINESS_INFO.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": BUSINESS_INFO.address.street,
      "addressLocality": BUSINESS_INFO.address.city,
      "addressRegion": BUSINESS_INFO.address.province,
      "postalCode": BUSINESS_INFO.address.postalCode,
      "addressCountry": "CA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": BUSINESS_INFO.location.lat,
      "longitude": BUSINESS_INFO.location.lng
    },
    "url": SITE_METADATA.siteUrl,
    "servesCuisine": ["Pizza", "Wings", "Italian"],
    "priceRange": "$$",
    "foundingDate": BUSINESS_INFO.founded,
    "paymentAccepted": BUSINESS_INFO.paymentMethods.join(", "),
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "11:00",
        "closes": "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Friday", "Saturday"],
        "opens": "11:00",
        "closes": "00:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "16:00",
        "closes": "22:00"
      }
    ]
  };

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <footer className="bg-[var(--brand-blue)] text-white border-t-8 border-black">
        <div className="container mx-auto py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="font-['Bebas_Neue'] text-3xl mb-4 text-[var(--brand-yellow)]">Contact Us</h3>
              <div className="space-y-3 font-medium">
                <a
                  href={BUSINESS_INFO.phoneLink}
                  className="flex items-start gap-3 hover:text-[var(--brand-yellow)] transition-colors snap-grow"
                >
                  <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{BUSINESS_INFO.phoneDisplay}</span>
                </a>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <address className="not-italic">
                    {BUSINESS_INFO.address.street}<br />
                    {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.province} {BUSINESS_INFO.address.postalCode}
                  </address>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-['Bebas_Neue'] text-3xl mb-4 text-[var(--brand-yellow)]">Hours</h3>
              <div className="space-y-2 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 flex-shrink-0" />
                  <span className="font-['Bebas_Neue'] text-lg">Open 7 Days</span>
                </div>
                <div className="pl-7 space-y-1 text-sm">
                  <p>Mon-Thu: {BUSINESS_INFO.hours.monday}</p>
                  <p>Mondays with Holiday: 4:00 PM - 10:00 PM</p>
                  <p>Fri-Sat: {BUSINESS_INFO.hours.friday}</p>
                  <p>Sunday: {BUSINESS_INFO.hours.sunday}</p>
                </div>
              </div>
            </div>

            {/* Quick Links & Social */}
            <div>
              <h3 className="font-['Bebas_Neue'] text-3xl mb-4 text-[var(--brand-yellow)]">Quick Links</h3>
              <div className="space-y-2 font-medium mb-6">
                <Link href="/menu" className="block hover:text-[var(--brand-yellow)] transition-colors">Pizza Menu</Link>
                <Link href="/wings-and-sides" className="block hover:text-[var(--brand-yellow)] transition-colors">Wings & Sides</Link>
                <Link href="/gluten-free" className="block hover:text-[var(--brand-yellow)] transition-colors">Gluten-Free Options</Link>
                <Link href="/specials" className="block hover:text-[var(--brand-yellow)] transition-colors">Specials & Discounts</Link>
                <Link href="/catering" className="block hover:text-[var(--brand-yellow)] transition-colors">Catering Services</Link>
                <Link href="/reviews" className="block hover:text-[var(--brand-yellow)] transition-colors">Customer Reviews</Link>
                <Link href="/faq" className="block hover:text-[var(--brand-yellow)] transition-colors">FAQ</Link>
                <Link href="/contact" className="block hover:text-[var(--brand-yellow)] transition-colors">Contact & Location</Link>
              </div>

              <div className="flex gap-4">
                <a
                  href={BUSINESS_INFO.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[var(--brand-yellow)] text-black p-3 border-4 border-black snap-grow"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t-4 border-white/20 text-center">
            <p className="font-medium">
              &copy; {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved.
            </p>
            <p className="text-sm mt-2 text-white/80">
              Proudly serving Airdrie, Alberta with the best pizza and wings in town.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
