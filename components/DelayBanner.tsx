'use client';

export default function DelayBanner() {
  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-yellow-400 px-4 py-2 text-sm font-semibold text-yellow-900"
    >
      <span aria-hidden>⚠</span>
      Blue Line delay active
    </div>
  );
}
