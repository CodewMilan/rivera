import { completeJson, type LLMProvider } from "@/lib/providers/llm";
import { z } from "zod";
import type { Organization } from "@/types";

const STOP = new Set([
  "that",
  "this",
  "with",
  "from",
  "your",
  "have",
  "will",
  "into",
  "about",
  "build",
  "helps",
  "help",
  "tool",
  "product",
  "using",
  "want",
  "need",
  "just",
  "more",
  "than",
  "them",
  "they",
  "their",
]);

export type ScoredMail = {
  gmailId: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  threadId: string;
  relevanceScore: number;
  relevanceReason: string;
  relevant: boolean;
};

const llmScoreSchema = z.object({
  items: z.array(
    z.object({
      gmailId: z.string(),
      relevant: z.boolean(),
      score: z.number().min(0).max(1),
      reason: z.string().min(1),
    }),
  ),
});

export function launchTerms(org: Organization): string[] {
  const raw = [org.goal, org.domain, org.targetUser, org.technology, ...(org.hiringRoles ?? [])].join(" ");
  return [...new Set((raw.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).filter((word) => !STOP.has(word)))];
}

export function keywordScore(
  terms: string[],
  mail: { from: string; subject: string; snippet: string },
): { score: number; hits: string[] } {
  const hay = `${mail.from} ${mail.subject} ${mail.snippet}`.toLowerCase();
  const hits = terms.filter((term) => hay.includes(term));
  const denom = Math.max(3, Math.min(terms.length, 8));
  return { score: Math.min(1, hits.length / denom), hits };
}

export async function scoreInbox(
  org: Organization,
  messages: Array<{ gmailId: string; threadId: string; from: string; subject: string; snippet: string; receivedAt: string }>,
  llm?: LLMProvider,
): Promise<ScoredMail[]> {
  const terms = launchTerms(org);
  const keyworded = messages.map((message) => {
    const { score, hits } = keywordScore(terms, message);
    return {
      ...message,
      relevanceScore: score,
      relevanceReason: hits.length ? `Matched ${hits.slice(0, 4).join(", ")}` : "No launch keywords in subject or snippet",
      relevant: hits.length >= 1,
    };
  });

  if (!llm || messages.length === 0) return keyworded;

  try {
    const scored = await completeJson(
      llm,
      {
        system:
          "You score founder inbox mail against a product launch. Mark a message relevant if it is customer demand, a user pain, a hiring reply, a partner intro, press, or a competitor mention for this business. Ignore newsletters, receipts, and noise. Return JSON { items: [{ gmailId, relevant, score, reason }] }.",
        user: JSON.stringify({
          goal: org.goal,
          targetUser: org.targetUser,
          domain: org.domain,
          technology: org.technology,
          messages: keyworded.map((item) => ({
            gmailId: item.gmailId,
            from: item.from,
            subject: item.subject,
            snippet: item.snippet.slice(0, 280),
          })),
        }),
      },
      (value) => llmScoreSchema.parse(value),
    );
    const byId = new Map(scored.value.items.map((item) => [item.gmailId, item]));
    return keyworded.map((item) => {
      const llmItem = byId.get(item.gmailId);
      if (!llmItem) return item;
      return {
        ...item,
        relevant: llmItem.relevant || item.relevant,
        relevanceScore: Math.max(item.relevanceScore, llmItem.score),
        relevanceReason: llmItem.reason,
      };
    });
  } catch {
    return keyworded;
  }
}
