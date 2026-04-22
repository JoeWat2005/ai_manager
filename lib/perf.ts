const isDev = process.env.NODE_ENV !== "production";

export function startTimer(label: string): () => void {
  if (!isDev) return () => {};
  const t = performance.now();
  return () => {
    const ms = Math.round(performance.now() - t);
    console.log(`[perf] ${label}: ${ms}ms`);
  };
}
