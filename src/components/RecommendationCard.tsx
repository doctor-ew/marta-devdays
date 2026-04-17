"use client";

interface Props {
  text: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onRetry: () => void;
}

export function RecommendationCard({
  text,
  isLoading,
  isStreaming,
  error,
  onRetry,
}: Props) {
  // Empty state
  if (!text && !isLoading && !error) {
    return (
      <div className="px-4 py-5 rounded-lg bg-surface border border-border text-center">
        <p className="text-sm text-muted">
          Pick your zone and match above to get your route.
        </p>
      </div>
    );
  }

  // Loading (pre-first-token)
  if (isLoading && !text) {
    return (
      <div className="px-4 py-5 rounded-lg bg-surface border border-border">
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-border rounded animate-pulse w-3/4" />
          <div className="h-4 bg-border rounded animate-pulse w-full" />
          <div className="h-4 bg-border rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // Error with no text
  if (error && !text) {
    return (
      <div className="px-4 py-5 rounded-lg bg-surface border border-error/40">
        <p className="text-sm text-error mb-3">
          Couldn&apos;t reach the routing service.
        </p>
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-accent hover:text-accent-hover underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Streaming or complete
  return (
    <div className="px-4 py-5 rounded-lg bg-surface border border-border">
      <p
        aria-live="polite"
        className={[
          "text-lg leading-relaxed text-text",
          isStreaming ? "streaming-cursor" : "",
        ].join(" ")}
      >
        {text}
      </p>
      {!isStreaming && text && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-muted hover:text-text underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
