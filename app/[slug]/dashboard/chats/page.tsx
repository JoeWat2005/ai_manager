import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { requireDashboardPageOrg } from "@/lib/dashboard/page-access";
import { prisma } from "@/lib/prisma";
import { startTimer } from "@/lib/perf";
import { cn } from "@/lib/utils";

export default async function ChatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ channel?: string; id?: string }>;
}) {
  const { slug } = await params;
  const { channel, id } = await searchParams;

  const tAuth = startTimer("chats auth+org");
  const { organization } = await requireDashboardPageOrg(slug);
  tAuth();

  const normalizedChannel = channel === "phone" || channel === "web" ? channel : undefined;

  let conversations: Awaited<ReturnType<typeof fetchConversationList>>;
  let selectedConversation: Awaited<ReturnType<typeof fetchSelectedConversation>> | null;

  if (id) {
    const tParallel = startTimer(`chats parallel [org=${organization.id}]`);
    [conversations, selectedConversation] = await Promise.all([
      fetchConversationList(organization.id, normalizedChannel),
      fetchSelectedConversation(id, organization.id),
    ]);
    tParallel();
  } else {
    const tList = startTimer(`chats list [org=${organization.id}]`);
    conversations = await fetchConversationList(organization.id, normalizedChannel);
    tList();
    const firstId = conversations[0]?.id;
    if (firstId) {
      const tDetail = startTimer("chats detail (serial, no ?id)");
      selectedConversation = await fetchSelectedConversation(firstId, organization.id);
      tDetail();
    } else {
      selectedConversation = null;
    }
  }

  return (
    <main className="space-y-6">
      <DashboardPageHeader
        eyebrow="Chats"
        title="Chat and call transcript history"
        description="Unified inbox for web chat sessions and recorded phone call summaries."
        actions={
          <>
            <Link
              href={`/${slug}/dashboard/chats`}
              className={cn(
                buttonVariants({
                  variant: !normalizedChannel ? "default" : "outline",
                  size: "sm",
                })
              )}
            >
              All channels
            </Link>
            <Link
              href={`/${slug}/dashboard/chats?channel=web`}
              className={cn(
                buttonVariants({
                  variant: normalizedChannel === "web" ? "default" : "outline",
                  size: "sm",
                })
              )}
            >
              Web chats
            </Link>
            <Link
              href={`/${slug}/dashboard/chats?channel=phone`}
              className={cn(
                buttonVariants({
                  variant: normalizedChannel === "phone" ? "default" : "outline",
                  size: "sm",
                })
              )}
            >
              Phone calls
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversation list</CardTitle>
            <CardDescription>Browse recent AI chat and phone sessions.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ScrollArea className="h-[680px] px-3">
              {conversations.length === 0 ? (
                <p className="p-1 text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                <ul className="space-y-2">
                  {conversations.map((conversation) => (
                    <li key={conversation.id}>
                      <Link
                        href={`/${slug}/dashboard/chats?id=${conversation.id}${
                          normalizedChannel ? `&channel=${normalizedChannel}` : ""
                        }`}
                        className={`block rounded-xl border p-3 transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold capitalize">
                            {conversation.channel} conversation
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {conversation.outcome ?? "open"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {conversation.lead?.contact?.name ?? "Unknown caller"} |{" "}
                          {conversation._count.messages} messages
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          {new Date(conversation.updatedAt).toLocaleString()}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transcript details</CardTitle>
            <CardDescription>
              Review who engaged, the outcome, and what the assistant captured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedConversation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold capitalize">
                    {selectedConversation.channel} conversation details
                  </h2>
                  <Badge variant="outline">{selectedConversation.outcome ?? "open"}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground uppercase">Lead</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedConversation.lead?.contact?.name ?? "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.lead?.contact?.phone ?? "No phone captured"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground uppercase">Recording</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedConversation.callRecording?.durationSeconds
                        ? `${selectedConversation.callRecording.durationSeconds}s`
                        : "No duration"}
                    </p>
                    {selectedConversation.callRecording?.recordingUrl ? (
                      <a
                        href={selectedConversation.callRecording.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Open recording
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recording URL stored</p>
                    )}
                  </div>
                </div>

                {selectedConversation.callRecording?.transcriptSummary ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground/80">
                    <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                      Transcript summary
                    </p>
                    <p className="mt-1">{selectedConversation.callRecording.transcriptSummary}</p>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Transcript
                  </h3>
                  <ScrollArea className="mt-2 h-[420px] rounded-2xl border border-border bg-muted/20 p-3">
                    {selectedConversation.messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages captured yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedConversation.messages.map((message) => (
                          <article
                            key={message.id}
                            className={`rounded-xl border p-3 text-sm ${
                              message.role === "assistant"
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-background"
                            }`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {message.role}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a conversation to view details.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

// Lean list query — only fetches what the list UI actually renders.
// Previously included callRecording (with large transcriptText) and unused lead fields.
function fetchConversationList(organizationId: string, channel?: "phone" | "web") {
  return prisma.receptionConversation.findMany({
    where: {
      organizationId,
      ...(channel ? { channel } : {}),
    },
    select: {
      id: true,
      channel: true,
      outcome: true,
      updatedAt: true,
      lead: {
        select: {
          contact: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

function fetchSelectedConversation(id: string, organizationId: string) {
  return prisma.receptionConversation.findFirst({
    where: { id, organizationId },
    include: {
      lead: {
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      // Capped at 150 — conversations with hundreds of messages were causing
      // unbounded fetches that pushed total page time above 1 second.
      messages: { orderBy: { createdAt: "asc" }, take: 150 },
      callRecording: {
        select: {
          recordingUrl: true,
          durationSeconds: true,
          transcriptSummary: true,
          updatedAt: true,
        },
      },
    },
  });
}
