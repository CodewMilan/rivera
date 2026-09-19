export function calculate(expression: string): number {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
    throw new Error("Calculator only accepts numeric expressions");
  }
  const result = Function(`"use strict"; return (${expression})`)();
  if (typeof result !== "number" || Number.isNaN(result)) {
    throw new Error("Calculator could not evaluate expression");
  }
  return result;
}
