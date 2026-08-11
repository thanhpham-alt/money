import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <PublicHeader />
      <main>{children}</main>
    </div>
  );
}
