import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// AI Chatbot Router for conversational ordering
export const aiChatbotRouter = router({
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      // Get menu context for AI
      const allPizzas = await db.getAllMenuItemsWithPrices("pizza");
      const allWings = await db.getAllMenuItemsWithPrices("wings");
      const allSides = await db.getAllMenuItemsWithPrices("sides");
      const allGlutenFree = await db.getAllMenuItemsWithPrices("gluten-free");
      const allToppings = await db.getAllToppings();
      
      // Build menu context string
      const pizzaList = allPizzas
        .filter(p => p.available && !p.name.toLowerCase().includes("walk-in") && !p.name.toLowerCase().includes("test"))
        .map(p => {
          const sizes = p.prices.map(pr => `${pr.size}: $${pr.price}`).join(", ");
          return `- ${p.name} (${sizes})${p.description ? ` - ${p.description}` : ""}`;
        })
        .join("\n");
      
      const wingsList = allWings
        .filter(w => w.available)
        .map(w => {
          const sizes = w.prices.map(pr => `${pr.size}: $${pr.price}`).join(", ");
          return `- ${w.name} (${sizes})${w.description ? ` - ${w.description}` : ""}`;
        })
        .join("\n");
      
      const sidesList = allSides
        .filter(s => s.available)
        .map(s => {
          const price = s.prices[0]?.price || "N/A";
          return `- ${s.name} ($${price})${s.description ? ` - ${s.description}` : ""}`;
        })
        .join("\n");
      
      const glutenFreeList = allGlutenFree
        .filter(g => g.available)
        .map(g => {
          const sizes = g.prices.map(pr => `${pr.size}: $${pr.price}`).join(", ");
          return `- ${g.name} (${sizes})${g.description ? ` - ${g.description}` : ""}`;
        })
        .join("\n");
      
      const toppingsList = allToppings
        .filter(t => t.available && t.category !== "gluten-free")
        .map(t => `- ${t.name} (+$${t.price})`)
        .join("\n");
      
      // System prompt with menu context
      const systemPrompt = `You are Johnny's Pizza & Wings AI ordering assistant. Help customers order food naturally and conversationally.

**BUSINESS INFORMATION:**
- Name: Johnny's Pizza & Wings
- Location: Airdrie, Alberta, Canada (serving since 2010)
- Phone: 403-948-2020
- Tagline: "Fresh ingredients. Bold flavors. Made to order."

**MENU:**

**PIZZAS:**
${pizzaList}

**GLUTEN-FREE PIZZAS:**
${glutenFreeList}
Note: All gluten-free pizzas are made with certified gluten-free crust.

**WINGS:**
${wingsList}

**SIDES:**
${sidesList}

**AVAILABLE TOPPINGS:**
${toppingsList}

**SPECIALS & DEALS:**
- **Classic Combo**: Choose 2 pizzas OR pizza + wings at a discounted price. Same size pizzas, any toppings. Available in 10", 12", and 14".
- **Walk-in Special**: Available in-store only. Ask about current walk-in special pricing.

**FREQUENTLY ASKED QUESTIONS:**
- **Delivery**: We offer delivery within Airdrie. Minimum order may apply.
- **Pickup**: Call ahead for faster pickup at 403-948-2020
- **Dietary**: We offer gluten-free options and can accommodate most dietary restrictions
- **Catering**: Large orders and catering available - call for details
- **Hours**: Check our website for current hours
- **Payment**: We accept cash, credit, and debit

**ORDERING RULES:**
1. When customer orders a pizza, ask for size (10", 12", or 14")
2. Ask if they want to customize toppings (add/remove)
3. Ask about cooking preferences (well done, light cheese, etc.)
4. Suggest sides or drinks to complete the order
5. Be friendly, concise, and helpful
6. If customer is vague, ask clarifying questions
7. Always confirm the order before adding to cart
8. If customer asks about gluten-free, mention our certified gluten-free crust options
9. If customer wants a deal, suggest the Classic Combo
10. For questions about delivery, hours, or catering, provide relevant info above

**FUNCTION CALLING:**
Use the provided functions to:
- \`add_to_cart\`: Add items to customer's cart
- \`search_menu\`: Search for specific menu items
- \`get_cart\`: View current cart contents

Be conversational and natural. Don't be overly formal or robotic. You're a helpful local pizza shop assistant!`;

      // Prepare messages with system prompt
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages,
      ];
      
      // Define tools for function calling
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "add_to_cart",
            description: "Add a menu item to the customer's cart",
            parameters: {
              type: "object",
              properties: {
                menuItemName: {
                  type: "string",
                  description: "Name of the menu item (e.g., 'Pepperoni', 'Hot Wings')",
                },
                size: {
                  type: "string",
                  description: "Size of the item (10, 12, 14 for pizzas; 1lb, 2lb, 3lb for wings)",
                },
                quantity: {
                  type: "number",
                  description: "Quantity to add (default: 1)",
                },
                customizations: {
                  type: "object",
                  description: "Topping modifications and cooking preferences",
                  properties: {
                    addedToppings: {
                      type: "array",
                      items: { type: "string" },
                      description: "Toppings to add",
                    },
                    removedToppings: {
                      type: "array",
                      items: { type: "string" },
                      description: "Toppings to remove",
                    },
                    cookingNotes: {
                      type: "string",
                      description: "Special cooking instructions (e.g., 'well done', 'light cheese')",
                    },
                  },
                },
                notes: {
                  type: "string",
                  description: "Additional notes or special requests",
                },
              },
              required: ["menuItemName", "size"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "search_menu",
            description: "Search for menu items by name or description",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query (e.g., 'spicy', 'vegetarian', 'meat')",
                },
                category: {
                  type: "string",
                  enum: ["pizza", "wings", "sides", "all"],
                  description: "Category to search in",
                },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "get_cart",
            description: "Get the current contents of the customer's cart",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
      ];
      
      // Call LLM with function calling
      const response = await invokeLLM({
        messages,
        tools,
        tool_choice: "auto",
      });
      
      const choice = response.choices[0];
      const message = choice.message;
      
      // Handle function calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        let functionResult: any = null;
        
        if (functionName === "add_to_cart") {
          // Find the menu item
          const allItems = [...allPizzas, ...allWings, ...allSides, ...allGlutenFree];
          const menuItem = allItems.find(
            item => item.name.toLowerCase() === functionArgs.menuItemName.toLowerCase()
          );
          
          if (menuItem) {
            // Find the price for the specified size
            const priceObj = menuItem.prices.find(p => p.size === functionArgs.size);
            
            if (priceObj) {
              // Calculate price with customizations
              let totalPrice = parseFloat(priceObj.price);
              const customizations = functionArgs.customizations || {};
              
              // Add topping costs
              if (customizations.addedToppings && customizations.addedToppings.length > 0) {
                for (const toppingName of customizations.addedToppings) {
                  const topping = allToppings.find(
                    t => t.name.toLowerCase() === toppingName.toLowerCase()
                  );
                  if (topping) {
                    totalPrice += parseFloat(topping.price);
                  }
                }
              }
              
              // Build customizations string
              const customizationsStr = JSON.stringify({
                added: customizations.addedToppings || [],
                removed: customizations.removedToppings || [],
                cooking: customizations.cookingNotes || "",
              });
              
              // Add to cart
              await db.addToCart({
                userId,
                menuItemId: menuItem.id,
                size: functionArgs.size,
                quantity: functionArgs.quantity || 1,
                price: totalPrice.toString(),
                notes: functionArgs.notes || null,
                customizations: customizationsStr,
              });
              
              functionResult = {
                success: true,
                message: `Added ${functionArgs.quantity || 1}x ${menuItem.name} (${functionArgs.size}) to cart - $${totalPrice.toFixed(2)}`,
              };
            } else {
              functionResult = {
                success: false,
                message: `Size ${functionArgs.size} not available for ${menuItem.name}`,
              };
            }
          } else {
            functionResult = {
              success: false,
              message: `Menu item "${functionArgs.menuItemName}" not found`,
            };
          }
        } else if (functionName === "search_menu") {
          const query = functionArgs.query.toLowerCase();
          const category = functionArgs.category || "all";
          
          let itemsToSearch = [...allPizzas, ...allWings, ...allSides, ...allGlutenFree];
          if (category !== "all") {
            itemsToSearch = itemsToSearch.filter(item => item.category === category);
          }
          
          const results = itemsToSearch.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
          );
          
          functionResult = {
            results: results.map(item => ({
              name: item.name,
              category: item.category,
              description: item.description,
              sizes: item.prices.map(p => ({ size: p.size, price: p.price })),
            })),
          };
        } else if (functionName === "get_cart") {
          const cartItems = await db.getCartItems(userId);
          const total = cartItems.reduce((sum, item) => {
            const price = parseFloat(item.price?.toString() || "0");
            return sum + (price * item.quantity);
          }, 0);
          
          functionResult = {
            items: cartItems.map(item => ({
              name: item.menuItem?.name,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
            })),
            total: total.toFixed(2),
          };
        }
        
        // Call LLM again with function result
        const followUpMessages = [
          ...messages,
          {
            role: "assistant" as const,
            content: message.content || "",
            tool_calls: message.tool_calls,
          },
          {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          },
        ];
        
        const followUpResponse = await invokeLLM({
          messages: followUpMessages,
          tools,
          tool_choice: "auto",
        });
        
        return {
          message: followUpResponse.choices[0].message.content || "I've processed your request!",
          functionCalled: functionName,
          functionResult,
        };
      }
      
      // No function call, return AI response
      return {
        message: message.content || "How can I help you order today?",
        functionCalled: null,
        functionResult: null,
      };
    }),
});
