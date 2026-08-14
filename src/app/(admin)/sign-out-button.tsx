"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm text-neutral-500 underline hover:text-neutral-900 dark:hover:text-neutral-50"
    >
      Sign out
    </button>
  );
}
