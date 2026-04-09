import { readFileSync } from "fs";
import { join } from "path";
import { Artwork } from "@/types/artwork";
import AdminUI from "@/components/AdminUI";

export default function AdminPage() {
  const raw = readFileSync(
    join(process.cwd(), "content", "artwork.json"),
    "utf-8",
  );
  const artwork: Artwork[] = JSON.parse(raw);

  return <AdminUI artwork={artwork} />;
}
