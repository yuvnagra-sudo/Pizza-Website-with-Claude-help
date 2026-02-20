import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReviewSubmissionForm() {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      toast({
        title: "Thank you for your review!",
        description: "Your review has been submitted and will appear after approval.",
      });
      // Reset form
      setCustomerName("");
      setEmail("");
      setRating(0);
      setReviewText("");
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !rating || !reviewText) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (reviewText.length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitReview.mutate({
      customerName,
      email: email || undefined,
      rating,
      reviewText,
    });
  };

  return (
    <div className="bg-white border-6 border-black p-6 md:p-8 brutal-shadow">
      <h3 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-[var(--brand-blue)] mb-6">
        Leave a Review
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block font-bold text-lg mb-2">
            Your Name <span className="text-red-600">*</span>
          </label>
          <Input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Doe"
            className="border-4 border-black"
            required
            maxLength={100}
          />
        </div>

        {/* Email Input (Optional) */}
        <div>
          <label className="block font-bold text-lg mb-2">
            Email (Optional)
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="border-4 border-black"
          />
          <p className="text-sm text-gray-600 mt-1">
            We'll only use this to follow up if needed
          </p>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block font-bold text-lg mb-2">
            Rating <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 md:w-12 md:h-12 ${
                    star <= (hoverRating || rating)
                      ? 'fill-[var(--brand-yellow)] text-[var(--brand-yellow)]'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block font-bold text-lg mb-2">
            Your Review <span className="text-red-600">*</span>
          </label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell us about your experience with Johnny's Pizza & Wings..."
            className="border-4 border-black min-h-[120px]"
            required
            minLength={10}
            maxLength={1000}
          />
          <p className="text-sm text-gray-600 mt-1">
            {reviewText.length}/1000 characters (minimum 10)
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--brand-blue)] text-white px-8 py-6 font-['Bebas_Neue'] text-2xl tracking-wide border-6 border-black brutal-shadow snap-grow hover:bg-[var(--brand-blue)]/90"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>

        <p className="text-sm text-gray-600 text-center">
          Your review will be published after approval by our team
        </p>
      </form>
    </div>
  );
}
