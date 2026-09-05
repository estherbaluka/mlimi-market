"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (value.length + files.length > MAX_IMAGES) {
      setError(`You can add at most ${MAX_IMAGES} images per product.`);
      return;
    }
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`"${f.name}" is not supported. Use JPG, PNG or WebP.`);
        return;
      }
      if (f.size <= 0 || f.size > MAX_SIZE) {
        setError(`"${f.name}" must be smaller than 5MB.`);
        return;
      }
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Image upload failed.");
        return;
      }
      onChange([...value, ...(data.urls as string[])].slice(0, MAX_IMAGES));
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setPrimary(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        id="product-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploading || value.length >= MAX_IMAGES}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full min-h-[44px] rounded-md border border-border bg-card px-4 py-2.5 text-base text-text file:mr-4 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-text hover:file:bg-primary-soft disabled:opacity-50"
        aria-describedby="product-images-hint"
      />
      <p id="product-images-hint" className="mt-1 text-xs text-muted">
        JPG, PNG or WebP · up to 5MB each · {value.length}/{MAX_IMAGES} images. First image is the primary photo.
      </p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {uploading && <p className="mt-1 text-sm text-muted">Uploading…</p>}

      {value.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((url, i) => (
            <li key={`${url}-${i}`} className="relative overflow-hidden rounded-md border border-border bg-primary-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product image ${i + 1}`} className="h-20 w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                  Primary
                </span>
              )}
              <div className="flex gap-1 p-1">
                {i !== 0 && (
                  <button type="button" onClick={() => setPrimary(i)} className="flex-1 rounded bg-card px-1 py-1 text-[11px] font-medium text-text hover:bg-primary-soft" aria-label={`Make image ${i + 1} primary`}>
                    Primary
                  </button>
                )}
                <button type="button" onClick={() => removeAt(i)} className="flex-1 rounded bg-card px-1 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50" aria-label={`Remove image ${i + 1}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
