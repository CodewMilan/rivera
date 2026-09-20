import { resetStore } from "@/lib/store";
import { setRuntimeOverride } from "@/lib/runtime";

process.env.RIVERA_STORE = "memory";
process.env.DEMO_MODE = "true";
delete process.env.LLM_API_KEY;
delete process.env.HIGGSFIELD_API_KEY_ID;
delete process.env.HIGGSFIELD_API_KEY_SECRET;
delete process.env.X_BEARER_TOKEN;
delete process.env.X_API_KEY;
delete process.env.X_API_SECRET;
delete process.env.X_ACCESS_TOKEN;
delete process.env.X_ACCESS_TOKEN_SECRET;

resetStore();
setRuntimeOverride(null);
