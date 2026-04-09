import { SiteInfo } from "@/types/types";

export default function SiteHeader({ siteInfo }: { siteInfo: SiteInfo }) {
  return (
    <header className="py-8">
      <h1>{siteInfo.title}</h1>
    </header>
  );
}
