import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/referrers", label: "Referrers" },
  { href: "/referrals", label: "Referrals" },
  { href: "/payouts", label: "Payouts" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-4">
              <Image
                src="/shinzo-logo.svg"
                alt="Shinzo"
                width={136}
                height={24}
                priority
                className="h-7 w-auto dark:hidden"
              />
              <Image
                src="/shinzo-logo-white.svg"
                alt="Shinzo"
                width={136}
                height={24}
                priority
                className="hidden h-7 w-auto dark:block"
              />
            </Link>
            <nav className="flex gap-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>{session.user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
