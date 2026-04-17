export function DelayBadge() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-delay text-white text-sm font-semibold"
      role="status"
      aria-label="Gold Line delay active"
    >
      <span aria-hidden="true">⚠</span>
      Gold Line delay active
    </div>
  );
}
