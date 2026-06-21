"use client";

import { useState } from "react";
import { Hash, MessageSquare, Plus, Search, X, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface ChannelUser {
  id: string; name: string; avatar: string | null; jobTitle: string | null;
}
interface Message {
  id: string; content: string; createdAt: string;
  sender: { id: string; name: string };
}
export interface Channel {
  id: string; name: string | null; type: string; createdBy: string; createdAt: string;
  members: { user: ChannelUser }[];
  messages: (Message & { sender: { id: string; name: string } })[];
}

interface ChatSidebarProps {
  channels: Channel[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (channel: Channel) => void;
  onNewDm: () => void;
  onNewChannel: () => void;
}

export function ChatSidebar({ channels, activeId, currentUserId, onSelect, onNewDm, onNewChannel }: ChatSidebarProps) {
  const [search, setSearch] = useState("");

  const dms = channels.filter((c) => c.type === "direct");
  const groupChannels = channels.filter((c) => c.type === "channel");

  function dmName(channel: Channel) {
    const other = channel.members.find((m) => m.user.id !== currentUserId);
    return other?.user.name ?? "Unknown";
  }
  function dmUser(channel: Channel) {
    return channel.members.find((m) => m.user.id !== currentUserId)?.user ?? null;
  }

  function filterChannel(c: Channel) {
    if (!search) return true;
    const name = c.type === "direct" ? dmName(c) : (c.name ?? "");
    return name.toLowerCase().includes(search.toLowerCase());
  }

  const filteredDms = dms.filter(filterChannel);
  const filteredChannels = groupChannels.filter(filterChannel);

  function lastMessage(c: Channel) {
    const m = c.messages[0];
    if (!m) return null;
    return { text: m.content, sender: m.sender.name };
  }

  return (
    <div className="w-64 shrink-0 flex flex-col bg-slate-900 text-slate-100 rounded-l-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
          <Search size={13} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none flex-1"
          />
          {search && <button onClick={() => setSearch("")}><X size={11} className="text-slate-500" /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4">
        {/* Direct Messages */}
        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Messages</span>
            <button onClick={onNewDm} className="text-slate-500 hover:text-slate-300 transition-colors" title="New DM">
              <Plus size={13} />
            </button>
          </div>
          {filteredDms.length === 0 && !search && (
            <button onClick={onNewDm} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <Plus size={11} /> Start a conversation
            </button>
          )}
          {filteredDms.map((c) => {
            const user = dmUser(c);
            const last = lastMessage(c);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left ${
                  activeId === c.id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Avatar name={user?.name ?? "?"} src={user?.avatar ?? null} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{user?.name ?? "Unknown"}</p>
                  {last && (
                    <p className={`text-xs truncate ${activeId === c.id ? "text-blue-200" : "text-slate-500"}`}>
                      {last.sender === user?.name ? "" : "You: "}{last.text}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* Channels */}
        <section>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channels</span>
            <button onClick={onNewChannel} className="text-slate-500 hover:text-slate-300 transition-colors" title="New Channel">
              <Plus size={13} />
            </button>
          </div>
          {filteredChannels.length === 0 && !search && (
            <button onClick={onNewChannel} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <Plus size={11} /> Create a channel
            </button>
          )}
          {filteredChannels.map((c) => {
            const last = lastMessage(c);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left ${
                  activeId === c.id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Hash size={13} className={activeId === c.id ? "text-blue-200 shrink-0" : "text-slate-500 shrink-0"} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{c.name}</p>
                  {last && (
                    <p className={`text-xs truncate ${activeId === c.id ? "text-blue-200" : "text-slate-500"}`}>
                      {last.text}
                    </p>
                  )}
                </div>
                <span className={`text-xs shrink-0 flex items-center gap-0.5 ${activeId === c.id ? "text-blue-200" : "text-slate-600"}`}>
                  <Users size={10} />{c.members.length}
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
