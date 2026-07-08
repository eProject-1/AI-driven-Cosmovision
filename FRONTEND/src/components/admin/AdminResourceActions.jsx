import { useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { deleteData, patchData, postData } from "../../services/api";

const baseButton =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold uppercase tracking-normal transition disabled:cursor-not-allowed disabled:opacity-50";

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Admin action failed.";
}

function cleanEditableValue(value) {
  if (!value || typeof value !== "object") return value;

  const blockedKeys = new Set([
    "id",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "author",
    "comments",
    "favorites",
    "savedBy",
    "user",
    "profile",
  ]);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !blockedKeys.has(key))
      .filter(([, item]) => item !== null && item !== undefined)
  );
}

export function AdminResourceActions({
  resourceName,
  endpoint,
  slug,
  item,
  createTemplate,
  onCreated,
  onUpdated,
  onDeleted,
  className = "",
}) {
  const [mode, setMode] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const isEditing = mode === "edit" || mode === "create";
  const targetUrl = slug ? `${endpoint}/${slug}` : endpoint;
  const initialEditValue = useMemo(() => cleanEditableValue(item || createTemplate || {}), [createTemplate, item]);

  const openEditor = (nextMode) => {
    setError("");
    setMode(nextMode);
    setDraft(JSON.stringify(nextMode === "create" ? createTemplate || {} : initialEditValue, null, 2));
  };

  const closeEditor = () => {
    setMode("");
    setError("");
    setDraft("");
  };

  const runSubmit = async (event) => {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const payload = JSON.parse(draft);
      const result = mode === "create" ? await postData(endpoint, payload) : await patchData(targetUrl, payload);

      if (mode === "create") onCreated?.(result);
      if (mode === "edit") onUpdated?.(result);
      closeEditor();
    } catch (err) {
      setError(err instanceof SyntaxError ? "JSON is invalid." : getErrorMessage(err));
    } finally {
      setStatus("idle");
    }
  };

  const runDelete = async () => {
    if (!slug || status === "deleting") return;
    const confirmed = window.confirm(`Delete this ${resourceName}?`);
    if (!confirmed) return;

    setStatus("deleting");
    setError("");

    try {
      await deleteData(targetUrl);
      onDeleted?.(slug);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className={`relative z-20 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {createTemplate ? (
          <button
            type="button"
            onClick={() => openEditor("create")}
            className={`${baseButton} border-emerald-200/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/18`}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        ) : null}

        {item && slug ? (
          <>
            <button
              type="button"
              onClick={() => openEditor("edit")}
              className={`${baseButton} border-cyan-200/25 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/18`}
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={runDelete}
              disabled={status === "deleting"}
              className={`${baseButton} border-red-200/25 bg-red-400/10 text-red-100 hover:bg-red-400/18`}
            >
              <Trash2 className="h-4 w-4" />
              {status === "deleting" ? "Deleting" : "Delete"}
            </button>
          </>
        ) : null}
      </div>

      {isEditing ? (
        <form onSubmit={runSubmit} className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-normal text-cyan-100">
              {mode === "create" ? `Add ${resourceName}` : `Edit ${resourceName}`}
            </p>
            <button type="button" onClick={closeEditor} className="text-slate-400 hover:text-white" aria-label="Close editor">
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-64 w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-cyan-200/50"
            spellCheck={false}
          />
          {error ? <p className="rounded-xl border border-red-300/25 bg-red-950/35 px-3 py-2 text-sm text-red-100">{error}</p> : null}
          <button
            type="submit"
            disabled={status === "saving"}
            className={`${baseButton} border-cyan-200/30 bg-cyan-200 text-slate-950 hover:bg-white`}
          >
            <Save className="h-4 w-4" />
            {status === "saving" ? "Saving" : "Save"}
          </button>
        </form>
      ) : error ? (
        <p className="mt-2 rounded-xl border border-red-300/25 bg-red-950/35 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}
    </div>
  );
}
