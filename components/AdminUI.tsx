"use client";

import { useEffect, useState } from "react";
import { Artwork, SiteInfo, NetlifyUser } from "@/types/types";
import MasonryGrid from "./MasonryGrid";
import AdminHeader from "./AdminHeader";
import Modal from "./Modal";
import EditArtworkForm from "./EditArtworkForm";
import UserSettingsForm from "./UserSettingsForm";

export default function AdminUI({
  artwork,
  siteInfo,
}: {
  artwork: Artwork[];
  siteInfo: SiteInfo;
}) {
  const [artworkList, setArtworkList] = useState<Artwork[]>(artwork);
  const [user, setUser] = useState<NetlifyUser | null>(null);
  const [ready, setReady] = useState(false);
  const [autoLoggedOut, setAutoLoggedOut] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Artwork | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<Artwork | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function getToken(): string | null {
    return window.netlifyIdentity.currentUser()?.token?.access_token ?? null;
  }

  function handleEditSuccess(updated: Artwork) {
    setArtworkList((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
    setPendingEdit(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const token =
      window.netlifyIdentity.currentUser()?.token?.access_token ?? null;
    if (!token) return;

    setIsDeleting(true);
    const res = await fetch("/.netlify/functions/delete-artwork", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: pendingDelete.id,
        imageUrl: pendingDelete.imageUrl,
      }),
    });
    setIsDeleting(false);

    if (res.ok) {
      setArtworkList((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setPendingDelete(null);
    } else {
      const { error } = await res.json();
      alert(`Delete failed: ${error}`);
    }
  }

  useEffect(() => {
    async function checkToken() {
      const u = window.netlifyIdentity.currentUser();
      if (!u?.token?.expires_at) return;

      const expiresAt = u.token.expires_at * 1000;
      const fiveMinutes = 5 * 60 * 1000;

      if (Date.now() >= expiresAt - fiveMinutes) {
        try {
          const refreshed = await window.netlifyIdentity.refresh(true);
          setUser(refreshed as NetlifyUser);
        } catch {
          setAutoLoggedOut(true);
          window.netlifyIdentity.logout();
        }
      }
    }

    async function init() {
      const ni = window.netlifyIdentity;
      ni.init();
      setUser(ni.currentUser() ?? null);
      setReady(true);
      await checkToken();
      ni.on("login", (user) => {
        setUser(user ?? null);
        setAutoLoggedOut(false);
        ni.close();
      });
      ni.on("logout", () => setUser(null));
    }

    if (window.netlifyIdentity) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.netlifyIdentity) {
          clearInterval(interval);
          init();
        }
      }, 50);
      return () => clearInterval(interval);
    }

    const tokenInterval = setInterval(checkToken, 60_000);
    return () => clearInterval(tokenInterval);
  }, []);

  //// RENDER //////////////////////////

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
    <main id="admin-main">
      <AdminHeader
        siteInfo={siteInfo}
        user={user}
        onOpenSettings={() => setSettingsOpen(true)}
        onArtworkUploaded={(a) => setArtworkList((prev) => [a, ...prev])}
      />
      <MasonryGrid
        artwork={artworkList}
        onDelete={setPendingDelete}
        onEdit={setPendingEdit}
      />

      {settingsOpen && (
        <Modal onClose={() => setSettingsOpen(false)}>
          <div className="bg-neutral-900 rounded-sm p-8 max-w-lg w-full ">
            <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-8">
              Settings
            </h2>
            <UserSettingsForm
              user={user}
              getToken={getToken}
              onSuccess={(updatedUser) => {
                setUser(updatedUser);
                setSettingsOpen(false);
              }}
            />
          </div>
        </Modal>
      )}

      {pendingEdit && (
        <Modal onClose={() => setPendingEdit(null)}>
          <div className="bg-neutral-900 rounded-sm p-8 max-w-2xl w-full">
            <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-8">
              Edit artwork
            </h2>
            <EditArtworkForm
              artwork={pendingEdit}
              getToken={getToken}
              onSuccess={handleEditSuccess}
            />
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)}>
          <div className="bg-neutral-900 rounded-sm p-8 max-w-sm w-full text-center">
            <h2 className="text-neutral-100 text-lg font-medium mb-2">
              Delete artwork?
            </h2>
            <p className="text-neutral-400 text-sm mb-6">
              &ldquo;{pendingDelete.title}&rdquo; will be permanently removed.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-sm transition-colors"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
