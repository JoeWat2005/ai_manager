// app/[slug]/layout.tsx
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="flex items-center justify-between p-4 border-b">
        <OrganizationSwitcher hidePersonal />
        <UserButton />
      </header>
      {children}
    </div>
  );
}