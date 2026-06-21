"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Hash, MessageSquare, MoreHorizontal, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { Channel } from "./chat-sidebar";

interface Message {
  id: string; content: string; createdAt: string; fileUrl?: string | null;
  sender: { id: string; name: string; avatar: string | null };
}

interface ChatWindowProps {
  channel: Channel;
  currentUserId: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function ChatWindow({ channel, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDm = channel.type === "direct";
  const dmOther = channel.members.find((m) => m.user.id !== currentUserId)?.user;
  const channelName = isDm ? (dmOther?.name ?? "Unknown") : `#${channel.name}`;

  // Initial load
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    lastIdRef.current = null;

    fetch(`/api/channels/${channel.id}/messages`)
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data);
        if (data.length > 0) lastIdRef.current = data[data.length - 1].id;
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 50);
      });

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [channel.id]);

  // Poll for new messages every 2s
  const poll = useCallback(async () => {
    if (!lastIdRef.current) return;
    const res = await fetch(`/api/channels/${channel.id}/messages?after=${lastIdRef.current}`);
    const data: Message[] = await res.json();
    if (data.length > 0) {
      lastIdRef.current = data[data.length - 1].id;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const fresh = data.filter((m) => !ids.has(m.id));
        if (!fresh.length) return prev;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        return [...prev, ...fresh];
      });
    }
  }, [channel.id]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const res = await fetch(`/api/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const data: Message = await res.json();
    setSending(false);
    if (res.ok) {
      lastIdRef.current = data.id;
      setMessages((prev) => [...prev, data]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }

    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Group consecutive messages from same sender
  function shouldShowHeader(i: number) {
    if (i === 0) return true;
    const prev = messages[i - 1];
    const curr = messages[i];
    if (prev.sender.id !== curr.sender.id) return true;
    const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return diff > 5 * 60 * 1000; // 5 minute gap = new group
  }

  function shouldShowDateSeparator(i: number) {
    if (i === 0) return true;
    const prev = new Date(messages[i - 1].createdAt).toDateString();
    const curr = new Date(messages[i].createdAt).toDateString();
    return prev !== curr;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white rounded-r-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          {isDm ? (
            <>
              <Avatar name={dmOther?.name ?? "?"} src={dmOther?.avatar ?? null} size="sm" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{dmOther?.name}</p>
                {dmOther?.jobTitle && <p className="text-xs text-slate-400">{dmOther.jobTitle}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Hash size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{channel.name}</p>
                <p className="text-xs text-slate-400">{channel.members.length} members</p>
              </div>
            </>
          )}
        </div>

        {!isDm && (
          <button
            onClick={() => setShowMembers((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showMembers ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Users size={13} /> Members
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            {loading ? (
              <div className="flex justify-center pt-20">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-16">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  {isDm ? <MessageSquare size={24} className="text-slate-400" /> : <Hash size={24} className="text-slate-400" />}
                </div>
                <p className="font-semibold text-slate-600">
                  {isDm ? `Start a conversation with ${dmOther?.name}` : `Welcome to #${channel.name}`}
                </p>
                <p className="text-sm mt-1">Send your first message below</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isOwn = msg.sender.id === currentUserId;
                const showHeader = shouldShowHeader(i);
                const showDate = shouldShowDateSeparator(i);

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-xs text-slate-400 font-medium">{formatDateSeparator(msg.createdAt)}</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>
                    )}

                    <div className={`flex items-start gap-3 ${showHeader ? "mt-4" : "mt-0.5"} group`}>
                      {/* Avatar — only show on first of group */}
                      <div className="w-8 shrink-0">
                        {showHeader ? (
                          <Avatar name={msg.sender.name} src={msg.sender.avatar} size="sm" />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        {showHeader && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className={`text-sm font-semibold ${isOwn ? "text-blue-700" : "text-slate-900"}`}>
                              {isOwn ? "You" : msg.sender.name}
                            </span>
                            <span className="text-xs text-slate-400">{formatTime(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words flex-1">
                            {msg.content}
                          </p>
                          {!showHeader && (
                            <span className="text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {formatTime(msg.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-4 pt-2 shrink-0">
            <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-blue-300 focus-within:bg-white transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${channelName}…`}
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 px-1">
              Press <kbd className="bg-slate-100 px-1 rounded text-slate-500">Enter</kbd> to send · <kbd className="bg-slate-100 px-1 rounded text-slate-500">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>

        {/* Members panel */}
        {showMembers && !isDm && (
          <div className="w-56 border-l border-slate-100 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Members — {channel.members.length}</p>
              <button onClick={() => setShowMembers(false)} className="text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {channel.members.map(({ user }) => (
                <div key={user.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                  <Avatar name={user.name} src={user.avatar} size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{user.name}</p>
                    {user.jobTitle && <p className="text-xs text-slate-400 truncate">{user.jobTitle}</p>}
                  </div>
                  {user.id === currentUserId && (
                    <span className="text-xs text-blue-500 shrink-0">you</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
