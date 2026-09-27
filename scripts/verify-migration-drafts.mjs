import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationDirectory = path.join(projectRoot, "supabase", "migrations");
const names = (await readdir(migrationDirectory))
  .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
  .sort();

assert.ok(names.length > 0, "No migration drafts were found.");

for (const [index, name] of names.entries()) {
  const expectedPrefix = String(index + 1).padStart(4, "0");
  assert.equal(name.slice(0, 4), expectedPrefix, `Migration sequence gap before ${name}.`);

  const sql = await readFile(path.join(migrationDirectory, name), "utf8");
  assert.match(sql, /^-- VERSIONED MIGRATION: /, `${name} must remain explicitly marked as a reviewed versioned migration.`);
  assert.match(sql, /\bbegin;/i, `${name} must open a transaction.`);
  assert.match(sql, /\bcommit;\s*$/i, `${name} must end by committing its transaction.`);
  assert.doesNotMatch(sql, /\b(?:drop\s+database|drop\s+schema|truncate\s+table)\b/i, `${name} contains a prohibited destructive statement.`);

  for (const dependency of sql.matchAll(/\b(\d{4}_[a-z0-9_]+\.sql)\b/g)) {
    const dependencyName = dependency[1];
    assert.ok(names.includes(dependencyName), `${name} references missing dependency ${dependencyName}.`);
    assert.ok(dependencyName < name, `${name} must depend only on an earlier migration, not ${dependencyName}.`);
  }
}

console.log(`Verified ${names.length} ordered versioned migrations without database access.`);
