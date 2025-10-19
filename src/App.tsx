import { useState } from "react";
import { Layout, Input, Button, Spin } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { Header, Content, Footer } = Layout;

import type { ChatAPIParam, ChatMessage, ImageAPIParam } from "../worker/types";
import ChatBubble from "./components/chat-bubble/ChatBubble";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const generateImage = async (prompt: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt } as ImageAPIParam),
      });

      if (!res.ok) throw new Error("Image generation failed");

      const blob = await res.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;

        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: base64data,
          created_at: new Date().toISOString(),
          streaming: false,
          type: "image",
        };

        setMessages((prev) => [...prev, msg]);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const sendMessage = async (addToHistory: boolean = true, prompt: string = input) => {
    if (!prompt.trim()) return "";

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      created_at: new Date().toISOString(),
      streaming: false,
      type: "text",
    };

    let temp = messages;
    if (addToHistory) setMessages((prev) => [...prev, userMsg]);
    else temp = [...temp, userMsg];

    setInput("");
    setLoading(true);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      streaming: true,
      type: "text",
    };
    setMessages((prev) => [...prev, assistantMsg]);

    let final = "";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: addToHistory ? [...messages, userMsg] : temp,
        } as ChatAPIParam),
      });

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("Empty Response Body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line === "data: [DONE]") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsg.id ? { ...msg, streaming: false } : msg
              )
            );
            break;
          }

          try {
            const jsonString = line.startsWith("data: ") ? line.slice(6) : line;
            const jsonData = JSON.parse(jsonString);

            if (jsonData.response) {
              if (addToHistory) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsg.id
                      ? { ...msg, content: msg.content + jsonData.response }
                      : msg
                  )
                );
              }
              final += jsonData.response;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e, "Line:", line);
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (addToHistory) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id
              ? { ...msg, content: "Error: Failed to get response", streaming: false }
              : msg
          )
        );
      }
    } finally {
      setLoading(false);
    }

    return final;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      workflow();
    }
  };

  const workflow = async () => {
    const res = await sendMessage();

    const prompt = await sendMessage(
      false,
      `Rewrite the following Input into a detailed, vivid image prompt for an AI art generator. Focus on key visual elements, mood, colors, lighting, and style. Exclude abstract concepts unless visually representable. Keep concise but rich in detail.\n\n${res}`
    );

    if (prompt) await generateImage(prompt);
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

      <Content style={{ padding: "1rem", overflowY: "auto", background: "#f5f5f5" }}>
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
        <Button type="primary" icon={<SendOutlined />} onClick={workflow} loading={loading}>
          Send
        </Button>
      </Footer>
    </Layout>
  );
}
