// adapted from the llm-chat template

import type { ChatAPIParam, Env } from "../types";
import { MODEL_ID, SYSTEM_PROMPT } from "../utils";

/**
 * Handles chat API requests with streaming response
 */
export default async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // Parse JSON request body
    const param: ChatAPIParam = (await request.json()) as ChatAPIParam;
    const messages = param.messages;

    // Add system prompt if not present
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ 
        id: crypto.randomUUID(),
        role: "system", 
        content: SYSTEM_PROMPT,
        created_at: Date.now().toLocaleString(),
        streaming: false,
        type: "text"
      });
    }

    // Get the streaming response from AI
    const response = await env.AI.run(
      MODEL_ID,
      {
        messages,
        stream: true, // Ensure streaming is enabled
        max_tokens: 1024,
      },
      {
        returnRawResponse: true,
      },
    );

    // Check if response is streamable
    if (!response.body) {
      throw new Error("No response body");
    }

    // Create a transformer to convert the AI response to SSE format
    const transformer = new TransformStream({
      transform(chunk, controller) {
        try {
          const text = new TextDecoder().decode(chunk);
          
          // If the response is JSON, wrap it in SSE format
          // If it's plain text, create a JSON object with the response field
          const data = {
            response: text,
            timestamp: Date.now()
          };
          
          // Format as SSE
          controller.enqueue(new TextEncoder().encode(data.response));
        } catch (error) {
          console.error("Error processing chunk:", error);
        }
      }
    });

    // Pipe the response through our transformer
    const transformedStream = response.body.pipeThrough(transformer);

    // Return streaming response with proper headers
    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream', // the rest are not important
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error("Error processing chat request:", error);
    
    // Return error as SSE for consistency
    const errorData = {
      error: "Failed to process request",
      timestamp: Date.now()
    };
    
    return new Response(`data: ${JSON.stringify(errorData)}\n\n`, {
      status: 500,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  }
}