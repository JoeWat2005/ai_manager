import { clerkClient, auth } from "@clerk/nextjs/server";
import { MailIcon, ShieldIcon, TrashIcon, UserIcon } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { InviteMemberForm } from "./InviteMemberForm";
import { revokeInvitation, revokeMember } from "./actions";

function roleLabel(role: string) {
  if (role === "org:admin") return "Admin";
  return "Member";
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { organization } = await requireDashboardPageOrg(slug);
  const { orgId, userId: currentUserId } = await auth();

  const clerk = await clerkClient();

  const [membershipList, invitationList] = await Promise.all([
    clerk.organizations.getOrganizationMembershipList({
      organizationId: orgId!,
      limit: 100,
    }),
    clerk.organizations.getOrganizationInvitationList({
      organizationId: orgId!,
      status: ["pending"],
      limit: 50,
    }),
  ]);

  const members = membershipList.data ?? [];
  const invitations = invitationList.data ?? [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Organization"
        title="Members and invites"
        description="Manage your team and access controls for this workspace."
      />

      {/* Org overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Organization</CardDescription>
            <CardTitle className="text-base">{organization.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">/{organization.slug}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Members</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums text-primary">
              {members.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active workspace members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Pending invites</CardDescription>
            <CardTitle className="text-3xl font-black tabular-nums">
              {invitations.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a team member</CardTitle>
          <CardDescription>
            Send an email invitation to add someone to this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm />
        </CardContent>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""} in this organization</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const user = m.publicUserData;
              const name =
                user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName ?? user?.identifier ?? "Unknown";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isCurrentUser = user?.userId === currentUserId;

              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user?.imageUrl} alt={name} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.identifier}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.role === "org:admin" ? "default" : "secondary"} className="text-xs">
                      {m.role === "org:admin" ? (
                        <><ShieldIcon className="mr-1 size-3" />Admin</>
                      ) : (
                        <><UserIcon className="mr-1 size-3" />Member</>
                      )}
                    </Badge>
                    {!isCurrentUser && user?.userId && (
                      <form action={revokeMember}>
                        <input type="hidden" name="userId" value={user.userId} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <TrashIcon className="size-3.5" />
                          <span className="sr-only">Remove {name}</span>
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invitations</CardTitle>
            <CardDescription>These users have been invited but haven't joined yet.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {invitations.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full border border-border bg-muted">
                      <MailIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.emailAddress}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabel(inv.role)} · Invited {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <form action={revokeInvitation}>
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
