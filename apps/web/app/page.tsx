import { ApiStatus } from "@/components/ApiStatus";
import { ButtonLink } from "@/components/ui/ButtonLink";

// A placeholder until Home is built (Phase 10): the name of the product and the way to the flagship.
export default function HomePage() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-page-x-phone text-center">
      <h1 className="type-page">SolarLayout Rooftop</h1>
      <ButtonLink kind="primary" size="l" href="/find" icon="arrow-right">
        Find my roof
      </ButtonLink>
      {isDevelopment ? <ApiStatus /> : null}
    </main>
  );
}
