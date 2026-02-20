import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIOrderAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your AI ordering assistant. I can help you order pizzas, wings, and sides. Just tell me what you'd like!",
    },
  ]);

  const chatMutation = trpc.aiChatbot.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.message },
      ]);

      // Show success toast if item was added to cart
      if (response.functionCalled === "add_to_cart" && response.functionResult?.success) {
        toast({
          title: "Added to cart!",
          description: response.functionResult.message,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (content: string) => {
    // Add user message to chat
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);

    // Send to backend
    chatMutation.mutate({ messages: newMessages });
  };

  const suggestedPrompts = [
    "I want a large pepperoni pizza",
    "What are your most popular pizzas?",
    "I'd like wings and a side",
    "Show me vegetarian options",
    "What's in the Meat Supreme pizza?",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[var(--brand-blue)] text-white py-8">
        <div className="container">
          <Link href="/menu">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 mb-4 border-2 border-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
          </Link>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-6xl mb-2">
            AI ORDER ASSISTANT
          </h1>
          <p className="text-xl">Order naturally with our AI-powered chatbot</p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-4 border-black brutal-shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Bebas_Neue'] text-2xl">Chat with AI</h2>
              <Link href="/cart">
                <Button
                  variant="outline"
                  className="border-2 border-black"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Cart
                </Button>
              </Link>
            </div>

            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatMutation.isPending}
              placeholder="Type your order here... (e.g., 'I want a large pepperoni pizza')"
              height="600px"
              emptyStateMessage="Start ordering by typing what you'd like!"
              suggestedPrompts={suggestedPrompts}
              className="border-2 border-gray-200"
            />
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-black brutal-shadow p-6">
            <h3 className="font-['Bebas_Neue'] text-2xl mb-4 text-[var(--brand-blue)]">
              How It Works
            </h3>
            <div className="space-y-3 text-lg">
              <p>
                <strong>1. Tell me what you want:</strong> "I'd like a large pepperoni pizza"
              </p>
              <p>
                <strong>2. Customize your order:</strong> "Add extra cheese and make it well done"
              </p>
              <p>
                <strong>3. Add more items:</strong> "Also add 2lb hot wings"
              </p>
              <p>
                <strong>4. Check out:</strong> I'll add everything to your cart, then you can proceed to checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
