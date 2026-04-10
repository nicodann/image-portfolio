"use client";

import { useEffect, useState } from "react";
import UploadForm from "@/components/UploadForm";
import { Artwork, SiteInfo } from "@/types/types";
import { HomeButton } from "./HomeButton";
import GalleryUI from "./GalleryUI";
import UploadSiteInfoForm from "./UploadSiteInfoForm";

type User = NonNullable<ReturnType<Window["netlifyIdentity"]["currentUser"]>>;

export default function AdminUI({
  artwork,
  siteInfo,
}: {
  artwork: Artwork[];
  siteInfo: SiteInfo;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    function init() {
      const ni = window.netlifyIdentity;
      ni.init();
      setUser(ni.currentUser() ?? null);
      setReady(true);
      ni.on("login", (user) => {
        setUser(user ?? null);
        setAutoLoggedOut(false);
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

  useEffect(() => {
    const interval = setInterval(() => {
      const u = window.netlifyIdentity.currentUser();
      if (u && u.token?.expires_at) {
        const expiresAt = u.token.expires_at * 1000;
        if (Date.now() >= expiresAt) {
          setAutoLoggedOut(true);
          window.netlifyIdentity.logout();
        }
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, []);

  function getToken(): string | null {
    return window.netlifyIdentity.currentUser()?.token?.access_token ?? null;
  }

  function handleLogout() {
    window.netlifyIdentity.logout();
  }

  //// RENDER

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
        {autoLoggedOut && (
          <p className="text-yellow-400 text-sm">
            Your session expired. Please sign in again.
          </p>
        )}
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
    <main id="admin-main" className="px-4">
      <header className="bg-slate-800 border-b-black border-b-[1.5em] p-8">
        <div className="h-12">
          {!isEditingTitle ? (
            <h1
              id="title"
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer leading-tight max-w-72"
            >
              {siteInfo.title}
            </h1>
          ) : (
            <UploadSiteInfoForm
              getToken={getToken}
              setIsEditingTitle={setIsEditingTitle}
            />
          )}
        </div>
        <p>(click to edit title)</p>
        <div id="upload-form-header" className="p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-sm uppercase tracking-widest text-neutral-400">
              Upload artwork
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-600">{user.email}</span>
              <HomeButton />
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
      </header>
      <GalleryUI artwork={artwork} siteInfo={siteInfo} />
      {/* <MasonryGrid artwork={artwork} /> */}
    </main>
  );
}
