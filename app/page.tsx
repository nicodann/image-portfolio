import { readFileSync } from "fs";
import { join } from "path";
import MasonryGrid from "@/components/MasonryGrid";
import { Artwork } from "@/types/artwork";

export default function GalleryPage() {
  const raw = readFileSync(
    join(process.cwd(), "content", "artworks.json"),
    "utf-8",
  );
  const artwork: Artwork[] = JSON.parse(raw);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <MasonryGrid artwork={artwork} />
    </main>
  );
}
