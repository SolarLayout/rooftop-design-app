import { ApiStatus } from "@/components/ApiStatus";

// Placeholder until the shell arrives in phase 3.
export default function HomePage() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">SolarLayout Rooftop</h1>
      {isDevelopment ? <ApiStatus /> : null}
    </main>
  );
}
