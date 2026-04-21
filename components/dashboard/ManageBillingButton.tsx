"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "@/app/[slug]/dashboard/billing/actions";

type Props = {
  slug: string;
  planName: string;
};

export function ManageBillingButton({ slug, planName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleCancel() {
    setPending(true);
    const result = await cancelSubscription(slug);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      setConfirming(false);
    } else {
      toast.success(
        "Subscription cancelled. Your access continues until the end of the billing period."
      );
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Cancel your <span className="font-semibold capitalize text-foreground">{planName}</span>{" "}
          subscription?
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={pending}
        >
          {pending ? "Cancelling..." : "Yes, cancel"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Never mind
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      Cancel subscription
    </Button>
  );
}
