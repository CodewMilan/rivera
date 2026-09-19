import { getStore, type Store } from "@/lib/store";
import { createLLMProvider, type LLMProvider } from "@/lib/providers/llm";
import { createMediaProvider, type MediaProvider } from "@/lib/providers/higgsfield";
import { createSearchProvider, type ResearchProvider } from "@/lib/tools/search";
import { createSocialPublisher, type SocialPublisher } from "@/lib/providers/social";
import type { OrchestratorDeps } from "@/lib/orchestration/run";

export type AppRuntime = OrchestratorDeps & {
  publisher: SocialPublisher;
};

let override: Partial<AppRuntime> | null = null;

export function setRuntimeOverride(next: Partial<AppRuntime> | null) {
  override = next;
}

export async function getRuntime(): Promise<AppRuntime> {
  const store = override?.store ?? (await getStore());
  return {
    store,
    llm: override?.llm ?? createLLMProvider(),
    search: override?.search ?? createSearchProvider(),
    media: override?.media ?? createMediaProvider(),
    publisher: override?.publisher ?? createSocialPublisher(),
  };
}

export function runtimeFrom(
  store: Store,
  extras?: Partial<Pick<AppRuntime, "llm" | "search" | "media" | "publisher">>,
): AppRuntime {
  return {
    store,
    llm: extras?.llm ?? createLLMProvider(),
    search: extras?.search ?? createSearchProvider(),
    media: extras?.media ?? createMediaProvider(),
    publisher: extras?.publisher ?? createSocialPublisher(),
  };
}

export type { LLMProvider, MediaProvider, ResearchProvider, SocialPublisher };
