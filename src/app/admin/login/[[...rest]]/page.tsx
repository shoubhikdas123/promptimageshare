"use client";

import { SignIn } from "@clerk/nextjs";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <SignIn afterSignInUrl="/admin/dashboard" />
      </div>
    </div>
  );
}