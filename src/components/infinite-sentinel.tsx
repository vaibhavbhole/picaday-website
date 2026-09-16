"use client";

import { useEffect, useRef } from "react";

export function InfiniteSentinel({
  onLoadMore,
  disabled,
}: {
  onLoadMore: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, onLoadMore]);

  return <div ref={ref} className="h-10 w-full" aria-hidden />;
}
