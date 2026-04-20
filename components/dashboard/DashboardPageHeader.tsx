import type { ReactNode } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: Props) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="gap-3 px-6 py-6 sm:px-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
            {eyebrow}
          </p>
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardHeader>
    </Card>
  );
}
