// adapted from the llm-chat-template

/**
 * Type definitions for the LLM chat application.
 */

export interface Env {
  /**
   * Binding for the Workers AI API.
   */
  AI: Ai;

  /**
   * Binding for static assets.
   */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  streaming: boolean;
  type: "text" | "image"
}

export interface ChatAPIParam {
  messages: ChatMessage[]
}

export function emptyMessage(
  streaming: boolean, 
  role: "user" | "assistant" | "system" = "user", 
  type: "text" | "image" = "text"
) {
  return {
    id: crypto.randomUUID(),
    role,
    content: "",
    created_at: Date.now().toLocaleString(),
    streaming,
    type: type
  }
}