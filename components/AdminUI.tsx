"use client";

import { useEffect, useState } from "react";
import UploadForm from "@/components/UploadForm";
import MasonryGrid from "@/components/MasonryGrid";
import { Artwork } from "@/types/artwork";

type User = NonNullable<ReturnType<Window["netlifyIdentity"]["currentUser"]>>;

export default function AdminUI({ artwork }: { artwork: Artwork[] }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function init() {
      const ni = window.netlifyIdentity;
      ni.init();
      setUser(ni.currentUser() ?? null);
      setReady(true);
      ni.on("login", (u) => {
        setUser(u ?? null);
        ni.close();
      });
      ni.on("logout", () => setUser(null));
    }

    if (window.netlifyIdentity) {
      init();
      return;
    }

    const interval = setInterval(() => {
      if (window.netlifyIdentity) {
        clearInterval(interval);
        init();
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  function getToken(): string | null {
    return window.netlifyIdentity.currentUser()?.token?.access_token ?? null;
  }

  function handleLogout() {
    window.netlifyIdentity.logout();
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="text-neutral-600 text-sm">Loading…</span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-400 text-sm">Sign in to manage artwork.</p>
        <button
          onClick={() => window.netlifyIdentity.open("login")}
          className="px-5 py-2 bg-neutral-100 text-neutral-950 text-sm font-medium rounded-sm hover:bg-white transition-colors"
        >
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="px-4">
      <div id="admin" className="p-8 max-w-2xl mx-auto bg-slate-800">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-sm uppercase tracking-widest text-neutral-400">
            Upload artwork
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        </div>
        <UploadForm getToken={getToken} />
      </div>
      <MasonryGrid artwork={artwork} />
    </main>
  );
}
