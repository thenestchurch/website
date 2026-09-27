import assert from "node:assert/strict";
import test from "node:test";
import { collectAllPages, PaginationCollectionError } from "../../lib/repositories/pagination.ts";
import type { PageResult } from "../../lib/repositories/contracts.ts";

const result = (
  page: number,
  docs: number[],
  totalDocs: number,
  totalPages: number,
): PageResult<number> => ({
  docs,
  hasNextPage: page < totalPages,
  hasPrevPage: page > 1,
  limit: 2,
  page,
  totalDocs,
  totalPages,
});

test("pagination collector loads every page in order", async () => {
  const requested: unknown[] = [];
  const pages = [result(1, [1, 2], 5, 3), result(2, [3, 4], 5, 3), result(3, [5], 5, 3)];
  const docs = await collectAllPages(async (request) => {
    requested.push(request);
    return pages[request.page - 1]!;
  }, { maxItems: 5, maxPages: 3, pageSize: 2 });

  assert.deepEqual(docs, [1, 2, 3, 4, 5]);
  assert.deepEqual(requested, [
    { limit: 2, page: 1 },
    { limit: 2, page: 2 },
    { limit: 2, page: 3 },
  ]);
});

test("pagination collector rejects collections above configured limits", async () => {
  await assert.rejects(
    collectAllPages(async () => result(1, [1, 2], 6, 3), {
      maxItems: 5,
      maxPages: 3,
      pageSize: 2,
    }),
    PaginationCollectionError,
  );
});

test("pagination collector rejects totals that change between pages", async () => {
  const pages = [result(1, [1, 2], 3, 2), result(2, [3, 4], 4, 2)];
  await assert.rejects(
    collectAllPages(async ({ page }) => pages[page - 1]!, { pageSize: 2 }),
    /Pagination totals changed/,
  );
});

test("pagination collector rejects missing rows instead of silently truncating", async () => {
  await assert.rejects(
    collectAllPages(async () => result(1, [1], 2, 1), { pageSize: 2 }),
    /does not match the repository total/,
  );
});
