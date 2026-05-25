"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-[#F5F5F2]">
        <h1 className="text-4xl font-bold">SPACEART</h1>
        <p className="mt-4 text-neutral-400">A critical error occurred.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-lg bg-[#FF5A1F] px-6 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
