import Link from "next/link";

export function HomeButton() {
  return (
    <Link
      href="/"
      className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
    >
      Go to Main Site
    </Link>
  );
}
