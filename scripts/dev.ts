import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
import fs from "node:fs";

const ROOT = process.cwd();

function ensureDataDir() {
  fs.mkdirSync(path.join(ROOT, ".data"), { recursive: true });
}

function portFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findPort(start = 3000, end = 3015) {
  for (let port = start; port <= end; port++) {
    if (await portFree(port)) return port;
  }
  throw new Error(`No free port between ${start} and ${end}`);
}

function child(command: string, args: string[], extraEnv: Record<string, string>) {
  const proc = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return proc;
}

async function main() {
  ensureDataDir();
  const port = await findPort(Number(process.env.PORT) || 3000);
  const url = `http://localhost:${port}`;
  const children: ChildProcess[] = [];

  const next = child("npx", ["next", "dev", "-H", "127.0.0.1", "-p", String(port)], {
    PORT: String(port),
    NEXT_PUBLIC_SITE_URL: url,
    STOCKIFY_INDEXER_EXTERNAL: "1",
  });
  children.push(next);

  const indexer = child("npx", ["tsx", "--tsconfig", "tsconfig.json", "scripts/indexer.ts"], {
    PORT: String(port),
    STOCKIFY_INDEXER_WRITER: "1",
  });
  children.push(indexer);

  const stop = () => {
    for (const proc of children) {
      try {
        proc.kill();
      } catch {
        /* already exited */
      }
    }
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  next.on("exit", (code) => {
    if (code) process.exit(code);
  });

  await new Promise((r) => setTimeout(r, 1500));
  console.log("");
  console.log("STOCKIFY READY");
  console.log(url);
  console.log("");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
