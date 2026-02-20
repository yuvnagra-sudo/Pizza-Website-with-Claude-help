import { BUSINESS_INFO } from "@/../../shared/const";
import { Button } from "@/components/ui/button";
import { Phone, Users, Pizza } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Design Philosophy: Bold Value Brutalism
 * - Aggressive royal blue and electric yellow
 * - Oversized Bebas Neue typography
 * - Heavy black borders with brutal shadows
 * - Zero fluff, direct communication
 */

export default function Catering() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    guestCount: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Catering inquiry sent! We'll call you within 24 hours.");
    setFormData({ name: "", email: "", phone: "", eventDate: "", guestCount: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-b-8 border-black">
        <div className="container mx-auto">
          <h1 className="font-['Bebas_Neue'] text-center mb-4">Catering Services</h1>
          <p className="text-xl md:text-2xl font-bold text-center max-w-3xl mx-auto">
            Feed your crew. Office parties, team events, family gatherings—we've got you covered.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto">
          
          {/* What We Offer */}
          <div className="mb-16">
            <h2 className="font-['Bebas_Neue'] text-[var(--brand-blue)] text-center mb-12">What We Cater</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-[var(--brand-yellow)] p-8 border-8 border-black brutal-shadow text-center">
                <div className="w-20 h-20 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-4 border-6 border-black">
                  <Pizza className="w-10 h-10" />
                </div>
                <h3 className="font-['Bebas_Neue'] text-3xl mb-3">Pizzas</h3>
                <p className="font-medium">
                  All our pizza varieties available in any size. Mix and match to suit your guests.
                </p>
              </div>

              <div className="bg-white p-8 border-8 border-[var(--brand-blue)] brutal-shadow text-center">
                <div className="w-20 h-20 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-4 border-6 border-black">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="font-['Bebas_Neue'] text-3xl mb-3 text-[var(--brand-blue)]">Wings & Sides</h3>
                <p className="font-medium">
                  Wing platters in all our flavors. Add fries, onion rings, and other sides.
                </p>
              </div>

              <div className="bg-[var(--brand-blue)] text-white p-8 border-8 border-black brutal-shadow text-center">
                <div className="w-20 h-20 bg-[var(--brand-yellow)] text-black rounded-full flex items-center justify-center mx-auto mb-4 border-6 border-black">
                  <Pizza className="w-10 h-10" />
                </div>
                <h3 className="font-['Bebas_Neue'] text-3xl mb-3 text-[var(--brand-yellow)]">Gluten-Free Options</h3>
                <p className="font-medium">
                  Full gluten-free menu available for catering orders.
                </p>
              </div>
            </div>

            {/* Key Points */}
            <div className="bg-[var(--brand-yellow)] p-8 border-8 border-black brutal-shadow max-w-3xl mx-auto">
              <h3 className="font-['Bebas_Neue'] text-4xl mb-6 text-center">How It Works</h3>
              <ul className="space-y-4 font-medium text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-2xl font-bold">1.</span>
                  <span>Fill out the form below or call us directly at <strong>{BUSINESS_INFO.phone}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl font-bold">2.</span>
                  <span>We'll discuss your event details, guest count, and menu preferences</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl font-bold">3.</span>
                  <span>We'll provide a custom quote based on your needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl font-bold">4.</span>
                  <span>We deliver fresh, hot food right when you need it</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Catering Inquiry Form */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 border-8 border-[var(--brand-blue)] brutal-shadow">
              <h2 className="font-['Bebas_Neue'] text-4xl mb-6 text-center text-[var(--brand-blue)]">Request A Catering Quote</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block font-bold mb-2">Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block font-bold mb-2">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
                      placeholder="403-555-1234"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block font-bold mb-2">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventDate" className="block font-bold mb-2">Event Date *</label>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      required
                      value={formData.eventDate}
                      onChange={handleChange}
                      className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="guestCount" className="block font-bold mb-2">Number of Guests *</label>
                    <input
                      type="number"
                      id="guestCount"
                      name="guestCount"
                      required
                      min="10"
                      value={formData.guestCount}
                      onChange={handleChange}
                      className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
                      placeholder="25"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block font-bold mb-2">Event Details & Special Requests</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)] resize-none"
                    placeholder="Tell us about your event, dietary restrictions, delivery location, etc."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[var(--brand-blue)] text-white border-6 border-black brutal-shadow font-['Bebas_Neue'] text-2xl py-6 hover:bg-black transition-colors"
                >
                  Request Quote
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-[var(--brand-blue)] text-white border-t-8 border-black">
        <div className="container mx-auto text-center">
          <h3 className="font-['Bebas_Neue'] text-4xl mb-4">Prefer To Talk? Call Us</h3>
          <p className="text-lg font-bold mb-6 max-w-2xl mx-auto">
            Last-minute catering? Rush order? Pick up the phone. We'll make it happen.
          </p>
          <a href={BUSINESS_INFO.phoneLink}>
            <Button className="bg-[var(--brand-yellow)] text-black border-6 border-black brutal-shadow font-['Bebas_Neue'] text-2xl px-8 py-6 hover:bg-white transition-colors">
              <Phone className="w-6 h-6 mr-2" />
              Call {BUSINESS_INFO.phone}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
