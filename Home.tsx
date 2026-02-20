import { BUSINESS_INFO } from "@/../../shared/const";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Clock, Star, DollarSign, Zap } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function Home() {

  return (
    <>
      <Helmet>
        <title>Johnny's Pizza & Wings | Airdrie AB</title>
        <meta name="description" content="Fresh pizza & wings in Airdrie since 2010. Fast delivery to Luxstone, Bayview, Coopers Crossing. Call 403-948-2020." />
        <link rel="canonical" href="https://johnnyspizza-wings.com/" />
      </Helmet>
      
      {/* LocalBusiness Schema for SEO and geographic relevance */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "@id": "https://johnnyspizza-wings.com/#restaurant",
            "name": BUSINESS_INFO.name,
            "image": "https://johnnyspizza-wings.com/images/pizza-hero.jpg",
            "description": "Fresh pizza and wings in Airdrie since 2010. Fast delivery to Luxstone, Bayview, Coopers Crossing.",
            "servesCuisine": ["Pizza", "Wings", "Italian"],
            "priceRange": "$$",
            "telephone": BUSINESS_INFO.phone,
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
              "latitude": "51.2917",
              "longitude": "-114.0119"
            },
            "url": "https://johnnyspizza-wings.com",
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
                "closes": "23:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "12:00",
                "closes": "21:00"
              }
            ],
            "areaServed": [
              "Airdrie",
              "Luxstone",
              "Bayview",
              "Coopers Crossing",
              "Williamstown",
              "Hillcrest"
            ]
          })
        }}
      />
      
      <div className="min-h-screen">
      {/* Hero Section - Bold Value Proposition */}
      <section className="bg-[var(--brand-blue)] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="/images/pizza-hero.jpg" 
            alt="Fresh pizza and wings from Johnny's Pizza & Wings in Airdrie" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto py-16 md:py-24 relative z-10">
          <div className="max-w-4xl">
            <h1 className="font-['Bebas_Neue'] text-white mb-6">
              Airdrie's Favorite Pizza & Wings
            </h1>
            <p className="text-2xl md:text-3xl font-bold mb-8 leading-tight">
              Fresh ingredients. Bold flavors. Made to order.<br />
              That's how we've served Airdrie since 2010.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={BUSINESS_INFO.phoneLink}
                className="bg-[var(--brand-yellow)] text-black px-8 py-6 font-['Bebas_Neue'] text-3xl tracking-wide border-8 border-black brutal-shadow snap-grow inline-flex items-center justify-center gap-3"
              >
                <Phone className="w-8 h-8" />
                Call {BUSINESS_INFO.phone}
              </a>
              <Link href="/menu">
                <Button
                  variant="outline"
                  className="bg-white text-[var(--brand-blue)] px-8 py-6 font-['Bebas_Neue'] text-3xl tracking-wide border-8 border-black brutal-shadow snap-grow h-auto"
                >
                  See Full Menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Johnny's - Direct Benefits */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] text-center text-[var(--brand-blue)] mb-4">
            Why People Choose Johnny's
          </h2>
          <p className="text-center text-xl font-bold mb-12 max-w-2xl mx-auto">
            We don't do "fancy." We do GREAT FOOD at FAIR PRICES.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-[var(--brand-yellow)] p-8 border-8 border-black brutal-shadow">
              <div className="w-24 h-24 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-6 border-6 border-black">
                <DollarSign className="w-16 h-16" strokeWidth={3} />
              </div>
              <h3 className="font-['Bebas_Neue'] text-3xl text-center mb-4">Great Value</h3>
              <p className="text-center font-medium">
                Fair prices, generous portions. More food, less money. Simple.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white p-8 border-8 border-[var(--brand-blue)] brutal-shadow">
              <div className="w-24 h-24 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-6 border-6 border-black">
                <Star className="w-12 h-12" fill="currentColor" />
              </div>
              <h3 className="font-['Bebas_Neue'] text-3xl text-center mb-4 text-[var(--brand-blue)]">Quality Ingredients</h3>
              <p className="text-center font-medium">
                Fresh toppings. Real cheese. Dough made right. We don't cut corners on what matters.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-[var(--brand-blue)] text-white p-8 border-8 border-black brutal-shadow">
              <div className="w-24 h-24 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-6 border-6 border-black">
                <Zap className="w-16 h-16" fill="white" strokeWidth={0} />
              </div>
              <h3 className="font-['Bebas_Neue'] text-3xl text-center mb-4 text-[var(--brand-yellow)]">Lightning-Fast Service</h3>
              <p className="text-center font-medium">
                HOT FOOD, FAST. We don't mess around. Your order is out the door in MINUTES, not hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 md:py-24 bg-[var(--brand-yellow)]">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] text-center text-[var(--brand-blue)] mb-12">
            What Airdrie Says About Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 border-8 border-black brutal-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-[var(--brand-blue)] text-[var(--brand-blue)]" />
                ))}
              </div>
              <p className="font-bold mb-4 text-lg">
                "Johnny's is our go-to for pizza and wings. Great food, great service!"
              </p>
              <p className="text-sm font-medium text-gray-600">- Airdrie Local, Facebook Review</p>
            </div>

            <div className="bg-white p-8 border-8 border-black brutal-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-[var(--brand-blue)] text-[var(--brand-blue)]" />
                ))}
              </div>
              <p className="font-bold mb-4 text-lg">
                "Best value in Airdrie. The pizza is delicious and the portions are generous!"
              </p>
              <p className="text-sm font-medium text-gray-600">- Google Review</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/reviews">
              <Button
                variant="outline"
                className="bg-[var(--brand-blue)] text-white px-8 py-6 font-['Bebas_Neue'] text-2xl tracking-wide border-8 border-black brutal-shadow snap-grow h-auto"
              >
                Read More Reviews
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] text-center text-[var(--brand-blue)] mb-12">
            Find Us In Luxstone Plaza
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Map */}
            <div className="border-8 border-black brutal-shadow h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2509.8!2d-114.018015!3d51.271598!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x53715fa1485bc847%3A0x5db61cccab9f11ce!2sJohnny's%20Pizza%20%26%20Wings!5e0!3m2!1sen!2sca!4v1738538400000!5m2!1sen!2sca"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Johnny's Pizza & Wings Location"
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div className="bg-[var(--brand-blue)] text-white p-6 border-8 border-black brutal-shadow">
                <div className="flex items-start gap-4">
                  <MapPin className="w-8 h-8 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-2xl mb-2">Address</h3>
                    <p className="font-medium">
                      {BUSINESS_INFO.address.street}<br />
                      {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.province} {BUSINESS_INFO.address.postalCode}
                    </p>
                    <p className="mt-2 text-sm">In Luxstone Plaza, near 7-11</p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--brand-yellow)] text-black p-6 border-8 border-black brutal-shadow">
                <div className="flex items-start gap-4">
                  <Clock className="w-8 h-8 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-2xl mb-2">Hours</h3>
                    <div className="space-y-1 font-medium">
                      <p>Mon-Thu: {BUSINESS_INFO.hours.monday}</p>
                      <p>Holiday Mondays: 4:00 PM - 10:00 PM</p>
                      <p>Fri-Sat: {BUSINESS_INFO.hours.friday}</p>
                      <p>Sunday: {BUSINESS_INFO.hours.sunday}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border-8 border-[var(--brand-blue)] brutal-shadow">
                <div className="flex items-start gap-4">
                  <Phone className="w-8 h-8 flex-shrink-0 mt-1 text-[var(--brand-blue)]" />
                  <div>
                    <h3 className="font-['Bebas_Neue'] text-2xl mb-2 text-[var(--brand-blue)]">Phone</h3>
                    <a
                      href={BUSINESS_INFO.phoneLink}
                      className="font-['Bebas_Neue'] text-3xl text-[var(--brand-blue)] hover:text-[var(--brand-yellow)] transition-colors"
                    >
                      {BUSINESS_INFO.phone}
                    </a>
                    <p className="mt-2 font-medium text-sm">Delivery: ${BUSINESS_INFO.deliveryFee.toFixed(2)} within {BUSINESS_INFO.deliveryArea}</p>
                    <p className="mt-1 font-medium text-sm text-gray-600">{BUSINESS_INFO.deliveryNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Areas - Neighborhood Keywords for Local SEO */}
      <section className="py-16 bg-white">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] text-center mb-6 text-[var(--brand-blue)]">
            Serving All of Airdrie
          </h2>
          <p className="text-xl text-center max-w-3xl mx-auto mb-8 text-gray-800">
            We deliver to <span className="font-bold text-[var(--brand-blue)]">Luxstone</span> (our home base!), <span className="font-bold text-[var(--brand-blue)]">Bayview</span>, <span className="font-bold text-[var(--brand-blue)]">Coopers Crossing</span>, <span className="font-bold text-[var(--brand-blue)]">Williamstown</span>, <span className="font-bold text-[var(--brand-blue)]">Kings Heights</span>, <span className="font-bold text-[var(--brand-blue)]">Reunion</span>, <span className="font-bold text-[var(--brand-blue)]">Downtown Airdrie</span>, and all Airdrie neighborhoods. Fast, hot, and fresh every time.
          </p>
          <p className="text-center text-lg text-gray-700">
            <span className="font-bold">Delivery fee:</span> $5 within Airdrie | <span className="font-bold">Balzac & Range Road areas:</span> Additional fee applies - call for quote
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-[var(--brand-blue)] text-white text-center">
        <div className="container mx-auto">
          <h2 className="font-['Bebas_Neue'] mb-6">
            Ready To Order?
          </h2>
          <p className="text-2xl font-bold mb-8 max-w-2xl mx-auto">
            Call now to place your order. <br />
            We're open 7 days a week.
          </p>
          <a
            href={BUSINESS_INFO.phoneLink}
            className="bg-[var(--brand-yellow)] text-black px-12 py-8 font-['Bebas_Neue'] text-4xl tracking-wide border-8 border-black brutal-shadow snap-grow inline-flex items-center gap-4"
          >
            <Phone className="w-10 h-10" />
            {BUSINESS_INFO.phone}
          </a>
        </div>
      </section>
      </div>
    </>
  );
}
