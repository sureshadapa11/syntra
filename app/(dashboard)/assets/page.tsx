import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Package, Plus } from "lucide-react";

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({
    include: { assignedTo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Asset Management</h1>
          <p className="text-slate-500 mt-1">{assets.length} assets tracked</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} />
          Add Asset
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <div className="col-span-3">Asset</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Serial No.</div>
          <div className="col-span-3">Assigned To</div>
          <div className="col-span-2">Status</div>
        </div>

        <div className="divide-y divide-slate-100">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package size={40} className="mb-3 opacity-40" />
              <p className="font-medium">No assets tracked</p>
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50">
                <div className="col-span-3 text-sm font-medium text-slate-800">{asset.name}</div>
                <div className="col-span-2 text-sm text-slate-600 capitalize">{asset.type}</div>
                <div className="col-span-2 text-sm text-slate-500">{asset.serialNumber ?? "—"}</div>
                <div className="col-span-3 text-sm text-slate-600">{asset.assignedTo?.name ?? "Unassigned"}</div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    asset.status === "available"
                      ? "bg-green-50 text-green-700"
                      : asset.status === "assigned"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {asset.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
