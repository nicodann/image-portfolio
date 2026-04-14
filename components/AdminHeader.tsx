"use client";

import { SiteInfo, NetlifyUser, Artwork } from "@/types/types";
import UploadSiteInfoForm from "./UploadSiteInfoForm";
import React, { Dispatch, SetStateAction, useState } from "react";
import UploadImageForm from "./UploadImageForm";
import Modal from "./Modal";
import Link from "next/link";
import CustomButton from "./CustomButton";
import SiteHeader from "./SiteHeader";

export default function AdminHeader({
  siteInfo,
  user,
  onOpenSettings,
  onArtworkUploaded,
}: {
  siteInfo: SiteInfo;
  user: NetlifyUser;
  onOpenSettings: () => void;
  onArtworkUploaded: (artwork: Artwork) => void;
}) {
  const [displayTitle, setDisplayTitle] = useState(siteInfo.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInPreviewMode, setIsInPreviewMode] = useState(false);

  function getToken(): string | null {
    return window.netlifyIdentity.currentUser()?.token?.access_token ?? null;
  }

  function handleLogout() {
    window.netlifyIdentity.logout();
  }

  const animateClassName = "transition-all ease-in-out duration-600";

  return (
    <>
      <SiteHeader
        className={`overflow-hidden ${animateClassName} ${isInPreviewMode ? "max-h-40" : "max-h-0 py-0"}`}
      >
        <div
          id="admin-site-header-container"
          className="flex justify-between px-4"
        >
          <h1>{displayTitle}</h1>
          <button
            onClick={() => setIsInPreviewMode(false)}
            className="hover:text-neutral-300 underline underline-offset-2 text-xs"
          >
            Edit Site
          </button>
        </div>
      </SiteHeader>

      <SiteHeader
        className={`bg-neutral-600 overflow-hidden ${animateClassName} ${isInPreviewMode ? "max-h-0 py-0" : "max-h-[800px]"}`}
      >
        <div
          id="header-row-1"
          className="flex flex-col gap-4 md:grid grid-cols-3 items-center px-4"
        >
          <div id="header-title-box">
            {!isEditingTitle ? (
              <>
                <h1
                  id="title"
                  onClick={() => {
                    setIsEditingTitle(true);
                    setTitleError(null);
                  }}
                  className="cursor-pointer leading-tight max-w-72"
                >
                  {displayTitle}
                </h1>
              </>
            ) : (
              <UploadSiteInfoForm
                getToken={getToken}
                setIsEditingTitle={setIsEditingTitle}
                onOptimisticUpdate={setDisplayTitle}
                onError={(msg) => {
                  setDisplayTitle(siteInfo.title);
                  setTitleError(msg);
                }}
              />
            )}
            {titleError && (
              <p className="text-xs text-red-400 mt-1">{titleError}</p>
            )}
          </div>

          <div
            id="header-upload-button-container"
            className="flex justify-center"
          >
            <CustomButton onClick={() => setIsUploadModalOpen(true)}>
              Upload Artwork
            </CustomButton>
          </div>

          <div
            id="header-nav-links"
            className="flex flex-col md:flex-row justify-end items-center gap-1 lg:gap-4 text-xs xl:text-lg text-neutral-400"
          >
            {isInPreviewMode ? (
              <button
                onClick={() => setIsInPreviewMode(false)}
                className="hover:text-neutral-300 underline underline-offset-2 text-xs"
              >
                Edit Site
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenSettings}
                  className="hover:text-neutral-300 hover:underline underline-offset-2"
                >
                  {user.user_metadata?.full_name || user.email}
                </button>

                <button
                  onClick={handleLogout}
                  className="hover:text-neutral-300 underline underline-offset-2"
                >
                  Sign out
                </button>

                <button
                  onClick={() => setIsInPreviewMode(true)}
                  className="underline underline-offset-2 hover:text-neutral-300"
                >
                  Preview Site
                </button>
              </>
            )}
          </div>

          {/* <div className="col-span-3">
            {!isEditingTitle && <p>(click to edit title)</p>}
          </div> */}
        </div>

        {/* <svg
          className="w-full block mt-6"
          viewBox="0 0 1200 30"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,15 Q300,0 600,15 Q900,30 1200,15 L1200,30 L0,30 Z"
            fill="black"
          />
        </svg> */}

        {isUploadModalOpen && (
          <Modal onClose={() => setIsUploadModalOpen(false)}>
            <div id="upload-form-header" className="p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-sm uppercase tracking-widest text-neutral-400">
                  Upload artwork
                </h2>
              </div>
              <UploadImageForm
                getToken={getToken}
                onSuccess={onArtworkUploaded}
              />
            </div>
          </Modal>
        )}
      </SiteHeader>
    </>
  );
}
