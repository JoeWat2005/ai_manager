import { socialLinks } from "./social-links";

type SocialLinksProps = {
  variant?: "outline" | "ghost";
  className?: string;
};

export function SocialLinks({
  variant = "outline",
  className = "",
}: SocialLinksProps) {
  const buttonClass =
    variant === "ghost" ? "btn btn-ghost btn-sm" : "btn btn-outline btn-sm";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {socialLinks.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          className={buttonClass}
        >
          {social.label}
        </a>
      ))}
    </div>
  );
}
