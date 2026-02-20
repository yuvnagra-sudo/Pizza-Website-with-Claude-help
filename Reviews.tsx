import { BUSINESS_INFO } from "@/../../shared/const";
import { Phone, Star, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ReviewSubmissionForm from "@/components/ReviewSubmissionForm";

interface CustomerReview {
  id: number;
  customerName: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
  featured: boolean;
}

export default function Reviews() {
  // Fetch first-party reviews from database
  const { data: reviews = [], isLoading } = trpc.reviews.getApproved.useQuery();
  const { data: stats } = trpc.reviews.getStats.useQuery();

  const averageRating = stats?.averageRating?.toFixed(1) || "0.0";
  const totalReviews = stats?.totalReviews || 0;

  // Restaurant Schema with AggregateRating (only for first-party reviews)
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": BUSINESS_INFO.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": BUSINESS_INFO.address.street,
      "addressLocality": BUSINESS_INFO.address.city,
      "addressRegion": BUSINESS_INFO.address.province,
      "postalCode": BUSINESS_INFO.address.postalCode,
      "addressCountry": "CA"
    },
    "telephone": BUSINESS_INFO.phone,
    "servesCuisine": "Pizza, Wings",
    "priceRange": "$$",
    ...(totalReviews > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": totalReviews,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="container mx-auto text-center">
          <p className="text-2xl font-bold">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Restaurant Schema with AggregateRating */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />

      {/* Hero Section */}
      <section className="bg-[var(--brand-blue)] text-white py-12 md:py-16 border-b-8 border-black">
        <div className="container mx-auto text-center">
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl mb-4">
            Johnny's Pizza & Wings Reviews — Airdrie's Favourite Pizza
          </h1>
          {totalReviews > 0 && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-8 h-8 ${
                      i < Math.round(parseFloat(averageRating))
                        ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]'
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-3xl font-bold">{averageRating}/5.0</span>
              <span className="text-xl">({totalReviews} reviews)</span>
            </div>
          )}
          <p className="text-xl font-medium max-w-3xl mx-auto">
            See what Airdrie customers are saying about our hand-tossed pizza, crispy wings, and unbeatable service. Real reviews from real customers who love Johnny's!
          </p>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-[var(--brand-blue)] mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg font-medium max-w-2xl mx-auto">
              Authentic reviews from Airdrie locals. We're proud to serve the best pizza and wings in town!
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl font-bold text-gray-600 mb-4">
                Be the first to leave a review!
              </p>
              <p className="text-lg text-gray-500">
                Share your experience with Johnny's Pizza & Wings
              </p>
            </div>
          )}

          {/* Review Submission Form */}
          <div className="max-w-2xl mx-auto mb-12">
            <ReviewSubmissionForm />
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-[var(--brand-yellow)] p-8 md:p-12 border-8 border-black brutal-shadow text-center">
            <h3 className="font-['Bebas_Neue'] text-4xl md:text-5xl mb-4">Join Our Happy Customers</h3>
            <p className="text-xl font-bold mb-6">
              Order today and taste why Airdrie loves Johnny's!
            </p>
            <a
              href={BUSINESS_INFO.phoneLink}
              className="bg-[var(--brand-blue)] text-white px-12 py-6 font-['Bebas_Neue'] text-3xl tracking-wide border-8 border-black brutal-shadow snap-grow inline-flex items-center gap-3"
            >
              <Phone className="w-8 h-8" />
              {BUSINESS_INFO.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewCard({ review }: { review: CustomerReview }) {
  // Individual Review Schema (only for first-party reviews)
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Restaurant",
      "name": BUSINESS_INFO.name
    },
    "author": {
      "@type": "Person",
      "name": review.customerName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "reviewBody": review.reviewText,
    "datePublished": new Date(review.createdAt).toISOString()
  };

  return (
    <div className="bg-white border-6 border-black p-6 brutal-shadow relative">
      {/* Review Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />

      <Quote className="w-8 h-8 text-[var(--brand-yellow)] mb-3" />

      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < review.rating
                ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      <p className="text-base font-medium mb-4 text-gray-800 leading-relaxed">
        "{review.reviewText}"
      </p>

      <div className="border-t-2 border-gray-200 pt-3">
        <p className="font-['Bebas_Neue'] text-xl text-[var(--brand-blue)]">
          {review.customerName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(review.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
