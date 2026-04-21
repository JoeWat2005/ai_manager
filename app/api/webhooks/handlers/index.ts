// Import all the typed shapes for different Clerk event payloads
import {
  ClerkDeletedEventData,
  ClerkOrganizationEventData,
  ClerkOrganizationMembershipEventData,
  ClerkPaymentAttemptEventData,
  ClerkSubscriptionEventData,
  ClerkUserEventData,
  VerifiedClerkEvent,
} from "../clerk/types";

// Import success response helper
import { ok } from "../clerk/responses";

// Import handlers for each domain
import { handleUserDeleted, handleUserUpsert } from "./user";
import {
  handleOrganizationDeleted,
  handleOrganizationUpsert,
} from "./organization";
import {
  handleMembershipDeleted,
  handleMembershipUpsert,
} from "../handlers/membership";
import { handleSubscriptionUpsert } from "../handlers/subscription";
import { handlePaymentAttempt } from "../handlers/payment";

// Main dispatcher function
export async function handleClerkEvent(
  evt: VerifiedClerkEvent
): Promise<Response> {

  // Switch based on event type (string from Clerk)
  switch (evt.type) {

    // =====================
    // USER EVENTS
    // =====================
    case "user.created":
    case "user.updated":
      return handleUserUpsert(
        evt.type,
        evt.data as ClerkUserEventData // cast from unknown → known type
      );

    case "user.deleted":
      return handleUserDeleted(
        evt.type,
        evt.data as ClerkDeletedEventData
      );

    // =====================
    // ORGANIZATION EVENTS
    // =====================
    case "organization.created":
    case "organization.updated":
      return handleOrganizationUpsert(
        evt.type,
        evt.data as ClerkOrganizationEventData
      );

    case "organization.deleted":
      return handleOrganizationDeleted(
        evt.type,
        evt.data as ClerkDeletedEventData
      );

    // =====================
    // MEMBERSHIP EVENTS
    // =====================
    case "organizationMembership.created":
    case "organizationMembership.updated":
      return handleMembershipUpsert(
        evt.type,
        evt.data as ClerkOrganizationMembershipEventData
      );

    case "organizationMembership.deleted":
      return handleMembershipDeleted(
        evt.type,
        evt.data as ClerkOrganizationMembershipEventData
      );

    // =====================
    // SUBSCRIPTION EVENTS
    // =====================
    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.pastDue":
      return handleSubscriptionUpsert(
        evt.type,
        evt.data as ClerkSubscriptionEventData
      );

    // =====================
    // PAYMENT EVENTS
    // =====================
    case "paymentAttempt.created":
    case "paymentAttempt.updated":
      return handlePaymentAttempt(
        evt.type,
        evt.data as ClerkPaymentAttemptEventData
      );

    // =====================
    // DEFAULT (IGNORE)
    // =====================
    default:
      return ok(evt.type, "Unhandled event type - ignored");
  }
}