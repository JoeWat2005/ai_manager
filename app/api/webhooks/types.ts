export type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

export type ClerkUserEventData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
};

export type ClerkOrganizationEventData = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_by: string | null;
};

export type ClerkOrganizationMembershipEventData = {
  id: string;
  role: string | null;
  organization: {
    id: string;
  };
  public_user_data?: {
    user_id?: string | null;
  } | null;
};

export type ClerkSubscriptionEventData = {
  id: string;
  status?: string | null;
  plan_name?: string | null;
  price_id?: string | null;
  customer_id?: string | null;
  current_period_start?: number | string | null;
  current_period_end?: number | string | null;
  cancel_at_period_end?: boolean | null;
  organization_id?: string | null;
  organization?: {
    id?: string | null;
  } | null;
};

export type ClerkDeletedEventData = {
  id: string | null;
};

export type ClerkPaymentAttemptEventData = {
  id: string;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
};

export type VerifiedClerkEvent = {
  type: string;
  data: unknown;
};