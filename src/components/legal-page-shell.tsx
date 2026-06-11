import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft } from "lucide-react";

interface LegalPageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 border-b bg-muted/20">
        <div className="container max-w-3xl py-10 md:py-14">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description ? (
              <p className="mt-2 text-muted-foreground">{description}</p>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated: 11 June 2026
            </p>
          </header>
          <article className="legal-content space-y-6 text-sm leading-relaxed text-foreground md:text-base [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:first:mt-0 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-medium [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm">
            {children}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
