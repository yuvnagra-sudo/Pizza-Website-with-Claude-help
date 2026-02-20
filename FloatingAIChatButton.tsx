import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIChatBox } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";

const SUGGESTED_PROMPTS = [
  "I want a large pepperoni pizza with extra cheese",
  "Show me your specials and deals",
  "What gluten-free options do you have?",
  "I'd like to order wings and a pizza",
];

const WELCOME_MESSAGE = {
  role: "assistant" as const,
  content: "👋 Hi! I'm your AI ordering assistant. I can help you:\n\n• Order pizzas, wings, and sides\n• Answer questions about our menu\n• Find deals and specials\n• Customize your order\n\nWhat would you like today?",
};

export default function FloatingAIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const chatMutation = trpc.aiChat.sendMessage.useMutation();

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = { role: "user" as const, content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to AI
      const response = await chatMutation.mutateAsync({
        messages: [...messages, userMessage],
      });

      // Add AI response
      setMessages((prev) => [...prev, { role: "assistant" as const, content: response.message }]);
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again or call us at 403-948-2020.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[var(--brand-blue)] text-white p-4 rounded-full border-4 border-black brutal-shadow hover:scale-110 transition-transform group"
        aria-label="Order with AI"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[var(--brand-blue)] text-white px-4 py-2 rounded border-2 border-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-['Bebas_Neue'] text-lg">
          Order with AI
        </span>
      </button>

      {/* AI Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 border-4 border-black">
          <DialogHeader className="p-6 pb-4 border-b-4 border-black bg-[var(--brand-blue)] text-white">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-['Bebas_Neue'] text-3xl">AI Order Assistant</DialogTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm opacity-90 mt-2">
              Ask me anything about our menu or tell me what you'd like to order!
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <AIChatBox
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Type your message or click a suggestion below..."
              suggestedPrompts={messages.length === 1 ? SUGGESTED_PROMPTS : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
