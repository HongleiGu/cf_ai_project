import { Card, Typography, Avatar, Spin } from "antd";
import {
  RobotOutlined,
  UserOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import type { ChatMessage } from "../../../worker/types";

const { Text } = Typography;

export interface ChatBubbleProps {
  msg: ChatMessage;
}

export default function ChatBubble({ msg }: ChatBubbleProps) {
  const isUser = msg.role === "user";
  const isImage = msg.type === "image";

  const avatarIcon = isUser ? (
    <UserOutlined />
  ) : isImage ? (
    <PictureOutlined />
  ) : (
    <RobotOutlined />
  );

  // Stylized gradients and colors
  const userBubble =
    "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-2xl rounded-br-none shadow-md";
  const botBubble =
    "bg-gradient-to-br from-[#ffffff] to-[#f1f1f1] text-gray-900 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm";

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-end gap-3 max-w-[85%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <Avatar
          size={48}
          icon={avatarIcon}
          className={`shadow-lg transition-transform transform hover:scale-105 ${
            isUser
              ? "bg-[#25D366] text-white border-2 border-[#128C7E]"
              : "bg-[#E5E5EA] text-gray-700 border-2 border-gray-200"
          }`}
        />

        {/* Message + Timestamp */}
        <div
          className={`flex flex-col ${
            isUser ? "items-end text-right" : "items-start text-left"
          }`}
        >
          <Card
            className={`!border-none !shadow-md transition-all duration-200 ${
              isUser ? userBubble : botBubble
            }`}
            bodyStyle={{
              padding: "0.75rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              maxWidth: "100%",
            }}
          >
            {/* Message Content */}
            {isImage ? (
              <div className="flex flex-col items-center">
                <img
                  src={msg.content}
                  alt="AI Generated"
                  className="rounded-xl max-w-[250px] max-h-[250px] object-cover shadow-sm"
                />
                {msg.streaming && (
                  <Spin size="small" className="mt-2 opacity-70" />
                )}
              </div>
            ) : (
              <Text
                className={`text-[1rem] leading-relaxed whitespace-pre-wrap word-break break-words ${
                  isUser ? "text-right" : "text-left"
                }`}
              >
                {msg.content || (msg.streaming ? "…" : "")}
              </Text>
            )}
          </Card>

          {/* Timestamp */}
          <div
            className={`flex mt-1 ${
              isUser ? "justify-end pr-1" : "justify-start pl-1"
            }`}
          >
            <Text
              className={`text-[0.75rem] italic ${
                isUser ? "text-gray-200" : "text-gray-500"
              }`}
            >
              {msg.created_at}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}