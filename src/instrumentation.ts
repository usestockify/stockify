export async function register() {
  if (process.env.VERCEL === "1") return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const mod = await import("./instrumentation-node");
    await mod.registerNodeInstrumentation();
  }
}
