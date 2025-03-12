import OpenAI from 'openai';

class AIAssistant {
  private static instance: AIAssistant;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  static getInstance(): AIAssistant {
    if (!AIAssistant.instance) {
      AIAssistant.instance = new AIAssistant();
    }
    return AIAssistant.instance;
  }

  async generateResponse(prompt: string, context: any = {}): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I apologize, but I'm having trouble processing your request right now.";
    }
  }

  private buildSystemPrompt(context: any): string {
    return `You are KESEGO MOLOSIWA, an AI assistant for Smart Transport Botswana. 
    You help users with transportation needs, bookings, and travel information.
    
    Current context:
    - User location: ${context.location || 'Unknown'}
    - Available routes: ${context.routes?.join(', ') || 'All routes'}
    - Time: ${new Date().toLocaleTimeString()}
    
    Please provide helpful, accurate, and friendly responses. 
    Focus on transportation-related queries but be able to handle general questions as well.
    Always maintain a professional and courteous tone.`;
  }

  async analyzeUserIntent(text: string): Promise<{
    intent: string;
    confidence: number;
    entities: any[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Analyze the user's intent and extract relevant entities. 
            Return a JSON object with:
            - intent: The primary intent (booking, inquiry, support, feedback, etc.)
            - confidence: Confidence score between 0 and 1
            - entities: Array of extracted entities (locations, dates, times, etc.)`
          },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing user intent:', error);
      return {
        intent: 'unknown',
        confidence: 0,
        entities: []
      };
    }
  }

  async generateSuggestions(userHistory: string[]): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Based on the user's chat history, suggest relevant follow-up questions or actions."
          },
          {
            role: "user",
            content: `Chat history: ${JSON.stringify(userHistory)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const suggestions = response.choices[0].message.content?.split('\n') || [];
      return suggestions.map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}

export const openai = AIAssistant.