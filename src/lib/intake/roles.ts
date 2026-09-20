export const HIRING_ROLE_PRESETS = [
  "Founding Engineer",
  "AI Engineer",
  "Systems Architect",
  "Full-stack Engineer",
  "Product Designer",
  "Developer Advocate",
] as const;

export function suggestHiringRoles(goal: string): string[] {
  const text = goal.toLowerCase();
  const picked: string[] = [];

  function add(role: (typeof HIRING_ROLE_PRESETS)[number]) {
    if (!picked.includes(role)) picked.push(role);
  }

  if (/\b(ai|llm|agent|models?|machine learning|ml)\b/.test(text)) add("AI Engineer");
  if (/\b(design|designer|ux|ui|figma)\b/.test(text)) add("Product Designer");
  if (/\b(architect|systems|infrastructure|infra|protocol)\b/.test(text)) add("Systems Architect");
  if (/\b(full[- ]?stack|next\.js|react|frontend|backend|typescript)\b/.test(text)) add("Full-stack Engineer");
  if (/\b(advocate|docs|community|developer relations|devrel)\b/.test(text)) add("Developer Advocate");
  if (picked.length === 0) add("Founding Engineer");

  return picked.slice(0, 4);
}
