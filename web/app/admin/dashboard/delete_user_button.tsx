'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteUserButton({ id, email, disabled, disabledReason }: { id: number; email: string; disabled?: boolean; disabledReason?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (disabled) return;
    if (!confirm(`Remove user ${email}? Their profile and products will be deleted. This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove user.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={onDelete}
        disabled={disabled || loading}
        title={disabled ? disabledReason : `Remove ${email}`}
        className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "Removing…" : "Remove"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
