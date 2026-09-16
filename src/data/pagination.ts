export const PAGE_SIZE = 12;

export type FeedSort = "latest" | "liked";

export type Paged<T> = {
  items: T[];
  hasMore: boolean;
};
