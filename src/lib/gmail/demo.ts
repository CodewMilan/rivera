import type { Organization } from "@/types";

export function demoInboxMessages(org: Organization) {
  const now = Date.now();
  const subjectHint = org.domain || org.goal.slice(0, 48);
  return [
    {
      gmailId: "demo-1",
      threadId: "demo-thread-1",
      from: "Maya Chen <maya@example.com>",
      subject: `We keep losing hours on ${subjectHint}`,
      snippet: `Is anyone building something for ${org.targetUser || "this team"}? The current workflow is a mess and we would pay for a 30-day fix.`,
      receivedAt: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
    },
    {
      gmailId: "demo-2",
      threadId: "demo-thread-2",
      from: "Jordan Hale <jordan@example.net>",
      subject: "Intro: founding engineer who shipped similar tools",
      snippet: `Saw you are hiring. I have a candidate who has built ${org.technology || "developer tools"} and wants an early-stage role.`,
      receivedAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      gmailId: "demo-3",
      threadId: "demo-thread-3",
      from: "Receipts <no-reply@stripe.com>",
      subject: "Your receipt from Stripe",
      snippet: "Invoice 2044 for $29.00 was paid. Thanks for being a customer.",
      receivedAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      gmailId: "demo-4",
      threadId: "demo-thread-4",
      from: "Alex Rivera <alex@competitor.dev>",
      subject: `Re: ${org.goal.slice(0, 42)}`,
      snippet: "We tried the incumbent last quarter. Happy to share what broke if you are still exploring this wedge.",
      receivedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
