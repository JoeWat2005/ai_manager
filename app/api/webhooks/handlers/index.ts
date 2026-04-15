import {
  ClerkDeletedEventData,
  ClerkOrganizationEventData,
  ClerkOrganizationMembershipEventData,
  ClerkPaymentAttemptEventData,
  ClerkSubscriptionEventData,
  ClerkUserEventData,
  VerifiedClerkEvent,
} from "../clerk/types";
import { ok } from "../clerk/responses";
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

export async function handleClerkEvent(
  evt: VerifiedClerkEvent
): Promise<Response> {
  switch (evt.type) {
    case "user.created":
    case "user.updated":
      return handleUserUpsert(evt.type, evt.data as ClerkUserEventData);

    case "user.deleted":
      return handleUserDeleted(evt.type, evt.data as ClerkDeletedEventData);

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

    case "subscription.created":
    case "subscription.updated":
    case "subscription.active":
    case "subscription.pastDue":
      return handleSubscriptionUpsert(
        evt.type,
        evt.data as ClerkSubscriptionEventData
      );

    case "paymentAttempt.created":
    case "paymentAttempt.updated":
      return handlePaymentAttempt(
        evt.type,
        evt.data as ClerkPaymentAttemptEventData
      );

    default:
      return ok(evt.type, "Unhandled event type - ignored");
  }
}