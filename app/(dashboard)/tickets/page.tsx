import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, statusColor, priorityColor } from "@/lib/utils";
import { Ticket, Plus } from "lucide-react";

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    include: { raisedBy: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Service Desk</h1>
          <p className="text-slate-500 mt-1">{tickets.length} tickets</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Raise Ticket
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", "Open", "In Progress", "Resolved", "Closed"].map((f) => (
          <button key={f} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 hover:bg-slate-50 text-slate-600">
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Date</div>
        </div>

        <div className="divide-y divide-slate-100">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Ticket size={40} className="mb-3 opacity-40" />
              <p className="font-medium">No tickets yet</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50 cursor-pointer">
                <div className="col-span-5">
                  <p className="text-sm font-medium text-slate-800">{ticket.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">by {ticket.raisedBy.name}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {ticket.category}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${priorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="col-span-1 text-xs text-slate-400">
                  {formatDate(ticket.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
