import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Chat</h1>
        <p className="text-slate-500 mt-1">Team messaging</p>
      </div>
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Chat coming soon</p>
          <p className="text-sm mt-1">Real-time messaging with Socket.io</p>
        </div>
      </div>
    </div>
  );
}
