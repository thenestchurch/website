import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { loadLocalEnv } from "./_shared.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const pgDump = process.env.PG_DUMP_PATH ?? "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";
const pgRestore = process.env.PG_RESTORE_PATH ?? "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_restore.exe";
const backupDirectory = path.resolve("backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDirectory, `thenestchurch-${timestamp}.dump`);

const run = (command, args, environment = process.env, timeoutMs = 120_000) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { env: environment, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  const timeout = setTimeout(() => {
    child.kill();
    reject(new Error(`${path.basename(command)} timed out after ${timeoutMs / 1000} seconds.`));
  }, timeoutMs);
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.once("error", (error) => {
    clearTimeout(timeout);
    reject(error);
  });
  child.once("close", (code) => {
    clearTimeout(timeout);
    if (code === 0) resolve(stdout);
    else reject(new Error(stderr.trim() || `${path.basename(command)} exited with code ${code}.`));
  });
});

await fs.mkdir(backupDirectory, { recursive: true });
await run(pgDump, [
  "--format=custom",
  "--file", backupPath,
  "--no-owner",
  "--no-privileges",
  "--schema=public",
  "--schema=private",
  "--dbname", process.env.DATABASE_URL,
], { ...process.env, PGCONNECT_TIMEOUT: "30" });

const archiveList = await run(pgRestore, ["--list", backupPath]);
const size = (await fs.stat(backupPath)).size;
if (size === 0 || !archiveList.includes("; Archive created")) {
  throw new Error("Backup archive verification failed.");
}

console.log(`Backup created and verified: ${backupPath}`);
console.log(`Archive size: ${size} bytes`);
