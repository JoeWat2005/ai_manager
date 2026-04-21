import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: Props) {
  return (
    <main className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="hidden w-80 shrink-0 flex-col justify-between border-r border-border bg-muted/30 p-8 lg:flex xl:w-96">
        <Link href="/" className="flex items-center">
          <Image
            src="/deskcaptain.png"
            alt="Deskcaptain"
            width={120}
            height={120}
            className="rounded-xl"
            priority
          />
        </Link>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/8 blur-2xl" />
            <p className="relative text-xs font-semibold tracking-[0.15em] text-primary uppercase mb-3">
              What you get
            </p>
            <ul className="relative space-y-2">
              {[
                "24/7 AI phone receptionist",
                "Instant booking confirmations",
                "Leads & chat transcript inbox",
                "Unified operations dashboard",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary/15">
                    <svg viewBox="0 0 12 12" className="size-2.5 text-primary" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Deskcaptain
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        {/* Mobile logo */}
        <div className="mb-6 lg:hidden">
          <Link href="/">
            <Image
              src="/deskcaptain.png"
              alt="Deskcaptain"
              width={110}
              height={110}
              className="rounded-xl"
              priority
            />
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
