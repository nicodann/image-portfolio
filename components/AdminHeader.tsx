"use client";

import { SiteInfo, NetlifyUser } from "@/types/types";
import UploadSiteInfoForm from "./UploadSiteInfoForm";
import { useState } from "react";
import UploadImageForm from "./UploadImageForm";
import Modal from "./Modal";
import Link from "next/link";
import CustomButton from "./CustomButton";

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
    <header className="bg-slate-800 border-b-black border-b-[1.5em] p-8">
      <div
        id="header-row-1"
        className="flex flex-col gap-4 md:grid grid-cols-3 items-center"
      >
        <div id="header-title-box">
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

        <div
          id="header-upload-button-container"
          className="flex justify-center"
        >
          <CustomButton onClick={() => setIsUploadModalOpen(true)}>
            Upload aArtwork
          </CustomButton>
        </div>

        <div
          id="header-nav-links"
          className="flex flex-col lg:flex-row justify-end items-center gap-1 lg:gap-4 text-xs xl:text-lg text-neutral-400"
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

        {/* <div className="col-span-3">
          {!isEditingTitle && <p>(click to edit title)</p>}
        </div> */}
      </div>

      {isUploadModalOpen && (
        <Modal onClose={() => setIsUploadModalOpen(false)}>
          <div id="upload-form-header" className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-sm uppercase tracking-widest text-neutral-400">
                Upload artwork
              </h2>
            </div>
            <UploadImageForm getToken={getToken} />
          </div>
        </Modal>
      )}
    </header>
  );
}
