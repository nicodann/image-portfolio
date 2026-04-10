import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import CustomButton from "./CustomButton";

type Status = { type: "success" | "error"; message: string } | null;

export default function UploadSiteInfoForm({
  getToken,
  setIsEditingTitle,
}: {
  getToken: () => string | null;
  setIsEditingTitle: Dispatch<SetStateAction<boolean>>;
}) {
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [titleInputValue, setTitleInputValue] = useState("");
  const inputWidthRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>(20);

  useLayoutEffect(() => {
    inputWidthRef.current?.getBoundingClientRect().width &&
      setInputWidth(inputWidthRef.current?.getBoundingClientRect().width);
  }, [titleInputValue]);

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
      <div className="flex flex-col gap-4">
        <div
          id="form-fields_buttons"
          className="flex gap-4 items-center flex-wrap"
        >
          <span
            aria-hidden
            ref={inputWidthRef}
            className="input-title absolute invisible whitespace-pre"
          >
            {titleInputValue}
          </span>
          <input
            name="title"
            type="text"
            required
            autoFocus
            value={titleInputValue}
            style={{ width: `${inputWidth}px` }}
            onChange={(e) => {
              setTitleInputValue(e.target.value);
            }}
            className="input-title bg-transparent border-none outline-none p-0 leading-none"
          />

          <CustomButton type="submit" disabled={loading}>
            {loading ? "Submitting" : "Submit"}
          </CustomButton>

          <CustomButton onClick={() => setIsEditingTitle(false)}>
            X
          </CustomButton>
        </div>

        {status && (
          <p
            className={`text-sm ${
              status.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
