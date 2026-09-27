import type { PageRequest, PageResult } from "./contracts.ts";

export type CollectAllPagesOptions = {
  maxItems?: number;
  maxPages?: number;
  pageSize?: number;
};

export class PaginationCollectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaginationCollectionError";
  }
}

const positiveInteger = (name: string, value: number) => {
  if (!Number.isInteger(value) || value < 1) {
    throw new PaginationCollectionError(`${name} must be a positive integer.`);
  }
};

export const collectAllPages = async <TEntity>(
  loadPage: (request: PageRequest) => Promise<PageResult<TEntity>>,
  options: CollectAllPagesOptions = {},
): Promise<TEntity[]> => {
  const pageSize = options.pageSize ?? 500;
  const maxPages = options.maxPages ?? 100;
  const maxItems = options.maxItems ?? 50_000;
  positiveInteger("pageSize", pageSize);
  positiveInteger("maxPages", maxPages);
  positiveInteger("maxItems", maxItems);

  const docs: TEntity[] = [];
  let expectedTotalDocs: number | null = null;
  let expectedTotalPages: number | null = null;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await loadPage({ limit: pageSize, page });

    if (result.page !== page || result.limit < 1 || result.limit > pageSize) {
      throw new PaginationCollectionError("The repository returned inconsistent page metadata.");
    }
    if (!Number.isInteger(result.totalDocs) || result.totalDocs < 0) {
      throw new PaginationCollectionError("The repository returned an invalid total item count.");
    }
    if (!Number.isInteger(result.totalPages) || result.totalPages < 1) {
      throw new PaginationCollectionError("The repository returned an invalid total page count.");
    }
    if (result.totalDocs > maxItems || result.totalPages > maxPages) {
      throw new PaginationCollectionError("The requested collection exceeds its configured safety limit.");
    }
    if (result.docs.length > result.limit) {
      throw new PaginationCollectionError("The repository returned more items than its page limit.");
    }

    expectedTotalDocs ??= result.totalDocs;
    expectedTotalPages ??= result.totalPages;
    if (result.totalDocs !== expectedTotalDocs || result.totalPages !== expectedTotalPages) {
      throw new PaginationCollectionError("Pagination totals changed while the collection was loading.");
    }

    const expectedHasNextPage = page < result.totalPages;
    if (result.hasNextPage !== expectedHasNextPage || result.hasPrevPage !== (page > 1)) {
      throw new PaginationCollectionError("The repository returned inconsistent pagination flags.");
    }
    if (result.docs.length === 0 && result.hasNextPage) {
      throw new PaginationCollectionError("The repository returned an empty page before the collection ended.");
    }

    docs.push(...result.docs);
    if (docs.length > maxItems) {
      throw new PaginationCollectionError("The collected items exceed the configured safety limit.");
    }

    if (!result.hasNextPage) {
      if (docs.length !== result.totalDocs) {
        throw new PaginationCollectionError("The collected item count does not match the repository total.");
      }
      return docs;
    }
  }

  throw new PaginationCollectionError("The collection exceeded its configured page limit.");
};
