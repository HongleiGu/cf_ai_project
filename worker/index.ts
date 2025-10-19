import handleChatRequest from "./chat/Chat";
import type { Env } from "./types";

export default {
  async fetch(
    request: Request,
    env: Env,
    // ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/chat") {
        // Handle POST requests for chat
        if (request.method === "POST") {
          return handleChatRequest(request, env);
        }

        // Method not allowed for other request types
        return new Response("Method not allowed", { status: 405 });
      }
      return Response.json({
        name: "Cloudflare",
      });
    }
		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;


