import { auth } from "@/lib/auth";
import { MembersPanel } from "@/components/projects/members-panel";

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Members</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage who has access to this project.</p>
      </div>
      <MembersPanel projectId={id} currentUserId={session!.user.id} />
    </div>
  );
}
