"use client";

const faqs = [
  {
    question: "How quickly can I set up Deskcaptain?",
    answer:
      "Most teams can configure business hours, desks, and booking rules in one session. You can start taking bookings immediately after setup.",
  },
  {
    question: "Does Deskcaptain handle both chat and phone workflows?",
    answer:
      "Yes. The AI chatbot is available across plans. AI receptionist phone handling is included with Pro.",
  },
  {
    question: "Can customers reschedule without calling my team?",
    answer:
      "Yes. Rescheduling flows are built in so customers can move appointments while your calendar and staff get updated automatically.",
  },
  {
    question: "How do reminders work?",
    answer:
      "Deskcaptain sends automated reminders by email and SMS based on your timing rules, helping reduce no-shows.",
  },
  {
    question: "Will this sync with my existing calendar process?",
    answer:
      "Deskcaptain syncs booking availability so your team calendar stays accurate while appointments are confirmed and tracked.",
  },
  {
    question: "What is included in the Free tier?",
    answer:
      "You get all core features with practical limits and up to 5 staff per business. AI phone receptionist is not included.",
  },
  {
    question: "When should I move to Pro?",
    answer:
      "Upgrade when you need higher limits, up to 15 staff, AI receptionist phone workflows, and custom domain support.",
  },
];

export function LandingFaq() {
  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={faq.question}
          className="collapse collapse-arrow border border-base-300 bg-base-100"
        >
          <input
            type="radio"
            name="landing-faq"
            defaultChecked={index === 0}
            aria-label={faq.question}
          />
          <div className="collapse-title text-base font-semibold">
            {faq.question}
          </div>
          <div className="collapse-content text-sm text-base-content/75">
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
}
