import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ title, description, children }: Props) {
  return (
    <main className="min-h-screen bg-base-200/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-5 p-6 sm:p-8">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/deskcaptain.png"
                alt="Deskcaptain logo"
                width={200}
                height={200}
                className="rounded-xl"
                priority
              />
            </Link>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-base-content">{title}</h1>
              <p className="mt-2 text-sm text-base-content/70">{description}</p>
            </div>
          </div>
        </section>

        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 sm:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
