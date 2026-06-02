import { useState, useCallback } from 'react';

const GEMINI_FUNCTION_URL = 'https://us-central1-ogasapp-5a003.cloudfunctions.net/geminiChat';

const SYSTEM_PROMPT = `You are OGas Assistant, a helpful AI for Nigeria's LPG cooking gas marketplace.
You help buyers find gas vendors, understand pricing, and place orders.
You help sellers manage their listings and understand their dashboard.
Keep responses short and friendly. Use Nigerian context (Naira ₦, cities like Lagos, Abuja, Warri).
If asked about pricing, typical 12.5kg refill costs ₦8,000–₦12,000 depending on location.`;

export function useAIChat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    setLoading(true);
    const updatedMessages = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);

    try {
      const response = await fetch(GEMINI_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      const data = await response.json();
      const aiText = data.text || "Sorry, I couldn't respond right now.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
      return aiText;
    } catch (error) {
      console.error('AI Chat error:', error);
      const errText = "Sorry, I'm having trouble connecting. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: errText }]);
      return errText;
    } finally {
      setLoading(false);
    }
  }, [messages]);

  return { messages, sendMessage, loading };
}
