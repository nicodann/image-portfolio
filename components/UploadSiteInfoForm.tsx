import { useRef, useState } from "react";

type Status = { type: "success" | "error"; message: string } | null;

export default function UploadSiteInfoForm({
  getToken,
}: {
  getToken: () => string | null;
}) {
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    const token = getToken();
    if (!token) {
      setStatus({ type: "error", message: "Not authenticated" });
      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    setLoading(true);

    try {
      const res = await fetch("/api/upload-site-info", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: data.get("title") }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }

      setStatus({
        type: "success",
        message:
          "Site Info edits published successfully. The site will rebuild shortly.",
      });
      formRef.current?.reset();
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full bg-neutral-900 border border-neutral-700 rounded-sm px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-neutral-400"
        />
        {status && (
          <p
            className={`text-sm ${
              status.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {status.message}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Submitting" : "Submit"}
        </button>
      </div>
    </form>
  );
}
