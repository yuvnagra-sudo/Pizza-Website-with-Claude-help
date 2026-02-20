import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

/**
 * Design Philosophy: Bold Value Brutalism
 * - Direct, no-BS answers to customer questions
 * - Strong hierarchy with yellow accent highlights
 * - Conversational tone optimized for voice search & AI
 * - Schema markup for rich snippets in search results
 */

const faqData: Array<{ question: string; answer: string | React.ReactNode }> = [
  {
    question: "Do you deliver to Balzac?",
    answer: (<>Yes, we deliver to Balzac, Rocky View County, Range Road, and Township areas for an additional delivery charge. Call <a href="tel:+14039482020" className="text-brand-blue font-bold hover:underline">403-948-2020</a> to confirm delivery fees for your specific location.</>)
  },
  {
    question: "What are your hours?",
    answer: "Monday-Thursday: 11am-10pm, Friday-Saturday: 11am-12am (midnight!), Sunday: 4pm-10pm. During holidays that fall on a Monday, we're open 4pm-10pm."
  },
  {
    question: "Do you have gluten-free pizza?",
    answer: "Yes! We offer 24 different gluten-free pizzas in 9\" and 11\" sizes, plus gluten-free wings prepared in a dedicated fryer. Check out our full Gluten-Free Menu."
  },
  {
    question: "How long does delivery take?",
    answer: (<>Most deliveries within Airdrie arrive in 30-45 minutes. We prioritize speed without sacrificing quality. If you're in a rush, call ahead at <a href="tel:+14039482020" className="text-brand-blue font-bold hover:underline">403-948-2020</a>.</>)
  },
  {
    question: "Do you accept credit cards?",
    answer: "Yes, we accept cash, Visa, Mastercard, debit cards, and e-transfer. We do not accept American Express."
  },
  {
    question: "Can I customize my pizza?",
    answer: (<>Absolutely! Call <a href="tel:+14039482020" className="text-brand-blue font-bold hover:underline">403-948-2020</a> to build your perfect pizza with your choice of toppings, crust, and size. We'll make it exactly how you want it.</>)
  },
  {
    question: "What's your most popular pizza?",
    answer: "Our best sellers are Hawaiian, Meat Supreme, and Super Loaded, but every pizza is made fresh with quality ingredients. You can't go wrong."
  },
  {
    question: "Do you have vegetarian options?",
    answer: "Yes! We have multiple vegetarian pizzas including our Vegetarian, Greek Style, Dill Pickle, Cheese pizza and Johnny's Special. Plus you can customize any pizza to be vegetarian."
  },
  {
    question: "Where do you deliver in Airdrie?",
    answer: "We deliver to all Airdrie neighborhoods: Luxstone (our home base!), Bayview, Coopers Crossing, Williamstown, Kings Heights, Reunion, Downtown Airdrie, and more. Delivery fee is $5 within Airdrie."
  },
  {
    question: "Do you have dine-in?",
    answer: "No, we're delivery and pickup only. This lets us focus on getting your food to you fast and hot."
  },
  {
    question: "Can I order online?",
    answer: (<>Online ordering is coming soon! For now, call <a href="tel:+14039482020" className="text-brand-blue font-bold hover:underline">403-948-2020</a> to place your order. We'll have you sorted in 2 minutes.</>)
  },
  {
    question: "What wing flavours do you have?",
    answer: (<>We have 11 flavours: Honey Garlic, BBQ, Hot, Teriyaki, Salt & Pepper, Lemon Pepper, Honey Hot, Breaded Golden, Extra Hot, Super Hot and Teriyaki Hot. See our <Link href="/gluten-free"><span className="text-brand-blue font-bold hover:underline">gluten free menu</span></Link> for gluten free flavors.</>)
  },
  {
    question: "Are your wings gluten-free?",
    answer: "Yes! If you want gluten-free wings, let us know. Our gluten-free wings are prepared in a dedicated fryer for your peace of mind."
  },
  {
    question: "Can I get multiple flavors for my wing order?",
    answer: "Yes! Here's how it works: 8 wings or 12 wings = ONE flavor only. 20 wings = split into 2 flavors (10 wings each flavor). 40 wings = split into up to 4 flavors (10 wings each flavor). Each flavor must be at least 10 wings."
  },
  {
    question: "Do you do catering?",
    answer: (<>Yes! We cater parties, corporate events, sports teams, and family gatherings. Call <a href="tel:+14039482020" className="text-brand-blue font-bold hover:underline">403-948-2020</a> or visit our Catering page to request a quote.</>)
  },
  {
    question: "What sizes do your pizzas come in?",
    answer: "Regular pizzas: 10\", 12\", 14\". Gluten-free pizzas: 9\" and 11\". The bigger the pizza, the better the value per slice."
  },
  {
    question: "Do you have deals or specials?",
    answer: (<>We have deals for individuals looking for a quick meal, couples on date night, family gatherings, and full catering events. Check out our <Link href="/specials"><span className="text-brand-blue font-bold hover:underline">Specials and Discounts page</span></Link> for current offers.</>)
  },
  {
    question: "How do I place an order?",
    answer: (<>Call <a href="tel:+14039482020" className="text-brand-blue font-bold hover:underline">403-948-2020</a>. Tell us what you want, where you are, and how you're paying. We'll take care of the rest. Online ordering coming soon.</>)
  },
  {
    question: "What's your address?",
    answer: "104 - 2002 Luxstone Blvd SW, Airdrie, AB T4B 0H8. We're in the Luxstone Plaza right by the 7-11 gas station and across from the St. Martin de Porres High School."
  },
  {
    question: "Do you have sides?",
    answer: (<>Yes! We have curly fries, onion rings, potato wedges, bread sticks, and a variety of dipping sauces. Check out our <Link href="/wings-and-sides"><span className="text-brand-blue font-bold hover:underline">Wings & Sides menu</span></Link>.</>)
  },
  {
    question: "Are you on Facebook?",
    answer: "Yes! Follow us at facebook.com/JohnnysPizzaWings for updates, photos, and special announcements."
  }
];

// Generate FAQ Schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqData.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

export default function FAQ() {
  return (
    <>
      <Helmet>
        <title>FAQ - Johnny's Pizza & Wings | Airdrie Pizza Delivery Questions</title>
        <meta name="description" content="Frequently asked questions about Johnny's Pizza & Wings in Airdrie. Delivery areas, hours, gluten-free options, ordering, and more. Call 403-948-2020." />
        <link rel="canonical" href="https://johnnyspizza-wings.com/faq" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-brand-blue text-white py-16">
          <div className="container">
            <p className="text-lg md:text-xl mb-3 text-brand-yellow font-semibold uppercase tracking-wide">
              Frequently Asked Questions
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
              Everything You Need To Know
            </h1>
            <p className="text-xl md:text-2xl text-brand-yellow font-semibold">
              Got questions? We've got answers.
            </p>
            <p className="text-lg mt-4 max-w-3xl">
              Can't find what you're looking for? Call us at <a href="tel:+14039482020" className="text-brand-yellow font-bold hover:underline">403-948-2020</a> - we're happy to help.
            </p>
          </div>
        </section>

        {/* FAQ Grid */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="space-y-8">
              {faqData.map((faq, index) => (
                <div 
                  key={index}
                  className="border-l-4 border-brand-yellow pl-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-blue mb-3">
                    {faq.question}
                  </h2>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-yellow py-16">
          <div className="container text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-blue mb-6">
              STILL HAVE QUESTIONS?
            </h2>
            <p className="text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
              We're here to help. Give us a call and we'll answer anything you need to know.
            </p>
            <a 
              href="tel:403-948-2020"
              className="inline-block bg-brand-blue text-white font-display text-2xl px-12 py-4 hover:bg-blue-900 transition-colors"
            >
              CALL 403-948-2020
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
