"use client";

const placeholderBrands = [
  "Northfield Dental",
  "Maple & Moss Salon",
  "Bluebridge Physio",
  "Harborview Legal",
  "Elm Street Clinics",
  "Sparrow Fitness",
  "Monarch Tutors",
  "Cedar Home Services",
  "Aster Real Estate",
  "Willow Optics",
];

const marqueeItems = [...placeholderBrands, ...placeholderBrands];

export function CompanyCarousel() {
  return (
    <div
      className="relative overflow-x-auto md:overflow-hidden"
      aria-label="Example businesses using Deskcaptain"
    >
      <div className="brand-marquee-track flex w-max items-center gap-3 py-2 md:gap-4">
        {marqueeItems.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="badge badge-lg border border-base-300 bg-base-100 px-4 py-4 text-sm font-medium whitespace-nowrap shadow-sm"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
