import { useState } from "react";
import { Layout, Input, Button, Spin } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { Header, Content, Footer } = Layout;

import { type ChatAPIParam, type ChatMessage } from "../worker/types"
import ChatBubble from "./components/chat-bubble/ChatBubble";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
      streaming: false,
      type: "text"
    };
    
    // Add user message immediately
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Create assistant message for streaming
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      streaming: true,
      type: "text"
    };
    
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        } as ChatAPIParam),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("Empty Response Body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines only
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line === "data: [DONE]") {
            // Mark streaming as complete
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMsg.id 
                ? { ...msg, streaming: false }
                : msg
            ));
            break; // the end of the generation
          }
          // console.log(line)
          try {
            // Handle both SSE format (data: {...}) and raw JSON
            const jsonString = line.startsWith("data: ") ? line.slice(6) : line;
            const jsonData = JSON.parse(jsonString);
            // console.log(jsonData)
            
            if (jsonData.response) {
              // Update the assistant message content incrementally
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMsg.id 
                  ? { ...msg, content: msg.content + jsonData.response }
                  : msg
              ));
            }
          } catch (e) {
            console.error("Error parsing JSON:", e, "Line:", line);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Update the message with error state
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsg.id 
          ? { ...msg, content: "Error: Failed to get response", streaming: false }
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout style={{ height: "100vh", width: "100vw" }}>
      <Header
        style={{
          color: "#fff",
          fontSize: "1.25rem",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        🤖 AI Chat
      </Header>

      <Content
        style={{
          padding: "1rem",
          overflowY: "auto",
          background: "#f5f5f5",
        }}
      >
        {messages.map((msg: ChatMessage) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        
        {loading && (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <Spin tip="Thinking..." />
          </div>
        )}
      </Content>

      <Footer
        style={{
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          padding: "0.75rem 1rem",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendMessage}
          loading={loading}
        >
          Send
        </Button>
      </Footer>
    </Layout>
  );
}