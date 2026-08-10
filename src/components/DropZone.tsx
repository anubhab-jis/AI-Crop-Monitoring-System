import { useCallback, useRef, useState } from "react";
import { UploadCloud, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropZone({
  onImage,
  imageData,
  imageMime,
  onClear,
}: {
  onImage: (dataUrl: string, mime: string) => void;
  imageData: string | null;
  imageMime: string | null;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        onImage(reader.result as string, file.type);
      };
      reader.readAsDataURL(file);
    },
    [onImage]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200",
        dragging
          ? "border-emerald-400 bg-emerald-50/60 scale-[1.01]"
          : "border-ink-200 bg-ink-50/40 hover:border-emerald-300 hover:bg-emerald-50/30"
      )}
      onClick={() => !imageData && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {imageData ? (
        <div className="relative w-full">
          <div className="overflow-hidden rounded-xl ring-1 ring-ink-100">
            <img src={imageData} alt="Crop preview" className="mx-auto max-h-[320px] w-full object-cover" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <ImageIcon className="h-3.5 w-3.5" /> {imageMime ?? "image"} · ready for analysis
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
              dragging ? "bg-emerald-500 text-white scale-110" : "bg-white text-emerald-500 shadow-card ring-1 ring-ink-100"
            )}
          >
            <UploadCloud className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <p className="mt-4 font-display text-base font-bold text-ink-800">
            {dragging ? "Drop to upload" : "Drag & drop crop / soil imagery"}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            or <span className="font-semibold text-emerald-600">browse files</span> — JPG, PNG, WebP
          </p>
          <p className="mt-3 text-xs text-ink-400">
            Multimodal AI analyzes leaf, stem & canopy indicators alongside telemetry
          </p>
        </>
      )}
    </div>
  );
}
