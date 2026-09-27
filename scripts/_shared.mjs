import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

export const loadLocalEnv = () => {
  const envFilePath = path.resolve(process.cwd(), ".env.local");

  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const envFile = fs.readFileSync(envFilePath, "utf8");

  for (const [key, value] of Object.entries(parseEnv(envFile))) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

export const chunk = (items, size) => {
  const batches = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
};
