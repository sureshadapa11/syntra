"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { ChatSidebar, type Channel } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { NewDmModal } from "@/components/chat/new-dm-modal";
import { NewChannelModal } from "@/components/chat/new-channel-modal";

export default function ChatPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showNewDm, setShowNewDm] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id ?? "";

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((data) => {
      setChannels(data);
      setLoading(false);
    });
  }, []);

  function handleSelect(channel: Channel) {
    setActiveChannel(channel);
  }

  function handleChannelCreated(channelId: string) {
    setShowNewDm(false);
    setShowNewChannel(false);
    fetch("/api/channels").then((r) => r.json()).then((data: Channel[]) => {
      setChannels(data);
      const created = data.find((c) => c.id === channelId);
      if (created) setActiveChannel(created);
    });
  }

  return (
    // -m-6 cancels the dashboard layout's p-6, then h-[calc...] fills the space
    <div className="-m-6 h-[calc(100vh-3.5rem)] flex">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-1 min-w-0 p-3 gap-0">
          <ChatSidebar
            channels={channels}
            activeId={activeChannel?.id ?? null}
            currentUserId={userId}
            onSelect={handleSelect}
            onNewDm={() => setShowNewDm(true)}
            onNewChannel={() => setShowNewChannel(true)}
          />

          {activeChannel ? (
            <ChatWindow
              key={activeChannel.id}
              channel={activeChannel}
              currentUserId={userId}
            />
          ) : (
            <div className="flex-1 bg-white rounded-r-2xl flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-600 text-base">Select a conversation</p>
              <p className="text-sm mt-1">Choose from the left or start a new message</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowNewDm(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  New Message
                </button>
                <button
                  onClick={() => setShowNewChannel(true)}
                  className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  New Channel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <NewDmModal
        open={showNewDm}
        currentUserId={userId}
        onClose={() => setShowNewDm(false)}
        onCreated={handleChannelCreated}
      />
      <NewChannelModal
        open={showNewChannel}
        currentUserId={userId}
        onClose={() => setShowNewChannel(false)}
        onCreated={handleChannelCreated}
      />
    </div>
  );
}
