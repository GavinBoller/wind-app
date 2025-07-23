"use client";

import { signOut, useSession } from "next-auth/react";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name;
  return (
    <button className={className} onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out {userName && <span className="signout-username">({userName})</span>}
    </button>
  );
}