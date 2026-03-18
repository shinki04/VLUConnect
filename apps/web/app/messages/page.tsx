"use client";

import { MessageCircle } from "lucide-react";

export default function MessagesIndexPage() {
  const handleNewConversation = () => {
    window.dispatchEvent(new Event("open-create-conversation"));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-muted/20">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <MessageCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Tin nhắn của bạn</h2>
      <p className="text-muted-foreground text-center max-w-[280px] mb-6">
        Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu cuộc trò chuyện mới
      </p>
      <button
        onClick={handleNewConversation}
        className="px-4 py-2 bg-mainred text-white rounded-full font-medium hover:bg-mainred/90 transition-colors"
      >
        Tin nhắn mới
      </button>
    </div>
  );
}
