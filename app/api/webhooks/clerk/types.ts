// Types for Clerk webhook payloads

// Represents a single email address attached to a user
export type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

// Data sent when a user-related event happens (e.g. user.created)
export type ClerkUserEventData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;

  // ID of the primary email
  primary_email_address_id: string | null;

  // All emails for the user
  email_addresses: ClerkEmailAddress[];
};

// Data for organization events (e.g. organization.created)
export type ClerkOrganizationEventData = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;

  // User who created the org
  created_by: string | null;
};

// Data for membership events (user joins/leaves org)
export type ClerkOrganizationMembershipEventData = {
  id: string;
  role: string | null;

  // Organization reference
  organization: {
    id: string;
  };

  // User reference (nested)
  public_user_data?: {
    user_id?: string | null;
  } | null;
};

// Data for subscription/billing events
export type ClerkSubscriptionEventData = {
  id: string;

  status?: string | null;
  plan_name?: string | null;
  price_id?: string | null;
  customer_id?: string | null;

  // Billing period timestamps
  current_period_start?: number | string | null;
  current_period_end?: number | string | null;

  cancel_at_period_end?: boolean | null;

  // Organization associated with subscription
  organization_id?: string | null;

  organization?: {
    id?: string | null;
  } | null;

  // Sometimes the payer is separate
  payer?: {
    organization_id?: string | null;
  } | null;

  // Subscription items (plans, etc.)
  items?: Array<{
    id?: string | null;
    status?: string | null;
    plan_id?: string | null;

    period_start?: number | string | null;
    period_end?: number | string | null;

    plan?: {
      name?: string | null;
      slug?: string | null;
    } | null;
  }> | null;
};

// Used when something is deleted (user/org/etc.)
export type ClerkDeletedEventData = {
  id: string | null;
};

// Payment attempt events (billing failures/successes)
export type ClerkPaymentAttemptEventData = {
  id: string;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
};

// Generic verified event wrapper
export type VerifiedClerkEvent = {
  type: string;  // e.g. "user.created"
  data: unknown; // actual payload (you cast this later)
};