"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="sign-out-button" onClick={() => signOut()}>
      Sign Out
    </button>
  );
}