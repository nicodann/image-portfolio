"use client";

import { SiteInfo, NetlifyUser } from "@/types/types";
import UploadSiteInfoForm from "./UploadSiteInfoForm";
import { useState } from "react";
import UploadForm from "./UploadForm";
import Modal from "./Modal";
import Link from "next/link";

export default function AdminHeader({
  siteInfo,
  user,
}: {
  siteInfo: SiteInfo;
  user: NetlifyUser;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  function getToken(): string | null {
    return window.netlifyIdentity.currentUser()?.token?.access_token ?? null;
  }

  function handleLogout() {
    window.netlifyIdentity.logout();
  }
  return (
    <header className="flex justify-between bg-slate-800 border-b-black border-b-[1.5em] p-8">
      <div id="header-title-box">
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
      </div>

      <button
        className="bg-neutral-400 hover:border-2 text-black text-2xl px-4 rounded-xl h-12"
        onClick={() => setIsUploadModalOpen(true)}
      >
        Upload Image
      </button>

      <div
        id="header-nav-links"
        className="flex items-center gap-4 text-xs lg:text-lg text-neutral-400"
      >
        <span>{user.email}</span>
        <Link
          href="/"
          className="underline underline-offset-2 hover:text-neutral-300"
        >
          Go to Main Site
        </Link>
        <button
          onClick={handleLogout}
          className="hover:text-neutral-300 underline underline-offset-2"
        >
          Sign out
        </button>
      </div>

      {isUploadModalOpen && (
        <Modal onClose={() => setIsUploadModalOpen(false)}>
          <div id="upload-form-header" className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-sm uppercase tracking-widest text-neutral-400">
                Upload artwork
              </h2>
            </div>
            <UploadForm getToken={getToken} />
          </div>
        </Modal>
      )}
    </header>
  );
}
