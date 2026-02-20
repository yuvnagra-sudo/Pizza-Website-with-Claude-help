import { BUSINESS_INFO } from "@/../../shared/const";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Design Philosophy: Bold Value Brutalism
 * - Aggressive royal blue and electric yellow
 * - Oversized Bebas Neue typography
 * - Heavy black borders with brutal shadows
 * - Zero fluff, direct communication
 */

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", phone: "", message: "" });
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
          <h1 className="font-['Bebas_Neue'] text-center mb-4">Get In Touch</h1>
          <p className="text-xl md:text-2xl font-bold text-center max-w-3xl mx-auto">
            Questions? Catering? Special orders? We're here to help.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Phone */}
            <div className="bg-[var(--brand-yellow)] p-8 border-8 border-black brutal-shadow text-center">
              <div className="w-20 h-20 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-4 border-6 border-black">
                <Phone className="w-10 h-10" />
              </div>
              <h3 className="font-['Bebas_Neue'] text-3xl mb-3">Call Us</h3>
              <a href={`tel:${BUSINESS_INFO.phone}`} className="text-xl font-bold hover:text-[var(--brand-blue)] transition-colors">
                {BUSINESS_INFO.phone}
              </a>
            </div>

            {/* Location */}
            <div className="bg-white p-8 border-8 border-[var(--brand-blue)] brutal-shadow text-center">
              <div className="w-20 h-20 bg-[var(--brand-blue)] text-white rounded-full flex items-center justify-center mx-auto mb-4 border-6 border-black">
                <MapPin className="w-10 h-10" />
              </div>
              <h3 className="font-['Bebas_Neue'] text-3xl mb-3 text-[var(--brand-blue)]">Visit Us</h3>
              <p className="font-bold">
                {BUSINESS_INFO.address.street}<br />
                {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.province} {BUSINESS_INFO.address.postalCode}
              </p>
            </div>

            {/* Hours */}
            <div className="bg-[var(--brand-blue)] text-white p-8 border-8 border-black brutal-shadow text-center">
              <div className="w-20 h-20 bg-[var(--brand-yellow)] text-black rounded-full flex items-center justify-center mx-auto mb-4 border-6 border-black">
                <Clock className="w-10 h-10" />
              </div>
              <h3 className="font-['Bebas_Neue'] text-3xl mb-3 text-[var(--brand-yellow)]">Hours</h3>
              <div className="text-sm font-medium space-y-1">
                <p>Mon-Thu: 11am - 10pm</p>
                <p>Fri-Sat: 11am - 12am</p>
                <p>Sunday: 4pm - 10pm</p>
              </div>
            </div>
          </div>

          {/* Map & Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Google Maps */}
            <div className="border-8 border-black brutal-shadow overflow-hidden h-[500px]">
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

            {/* Contact Form */}
            <div className="bg-[var(--brand-yellow)] p-8 border-8 border-black brutal-shadow">
              <h2 className="font-['Bebas_Neue'] text-4xl mb-6">Send Us A Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label htmlFor="phone" className="block font-bold mb-2">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)]"
                    placeholder="403-555-1234"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block font-bold mb-2">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-3 border-4 border-black font-medium focus:outline-none focus:ring-4 focus:ring-[var(--brand-blue)] resize-none"
                    placeholder="Tell us about your catering needs, special requests, or questions..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[var(--brand-blue)] text-white border-6 border-black brutal-shadow font-['Bebas_Neue'] text-2xl py-6 hover:bg-black transition-colors"
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Note */}
      <section className="py-12 bg-[var(--brand-blue)] text-white border-t-8 border-black">
        <div className="container mx-auto text-center">
          <h3 className="font-['Bebas_Neue'] text-4xl mb-4">Delivery Information</h3>
          <p className="text-lg font-bold max-w-3xl mx-auto">
            We deliver throughout Airdrie with a ${BUSINESS_INFO.deliveryFee} delivery fee. 
            Areas outside Airdrie (Balzac, Range Roads, Townships)? Give us a call for delivery rates.
          </p>
        </div>
      </section>
    </div>
  );
}
