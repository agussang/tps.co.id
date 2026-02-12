import { FC, useRef } from "react";
import { structure } from "../../../../../typings/prisma";
import { useLocal } from "@/utils/use-local";
import { FMLocal, FieldLocal } from "@/comps/form/typings";
import { toast } from "sonner";
import { renameFile } from "app/admin/utils";
import {
  Upload,
  X,
  RefreshCcw,
  File,
  Image as ImageIcon,
  ExternalLink,
  Undo2,
} from "lucide-react";

export const FieldFile: FC<{
  fm: FMLocal;
  st: structure;
  name: string;
}> = ({ fm, st, name }) => {
  const local = useLocal({
    no_image: false,
    undo: null as any,
    isDragging: false,
    uploading: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const value = fm.data[name];

  // Get file URL
  const getFileUrl = () => {
    if (typeof value === "object" && value?.path) {
      return siteurl(`/_file/${value.path}`);
    }
    if (typeof value === "string" && value) {
      return siteurl(`/_file/${value}`);
    }
    return null;
  };

  // Get image URL with size
  const getImageUrl = (height = 80) => {
    if (typeof value === "object" && value?.path) {
      return siteurl(`/_img/${value.path}?h=${height}`);
    }
    if (typeof value === "string" && value) {
      return siteurl(`/_img/${value}?h=${height}`);
    }
    return null;
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    if (!file?.name) return;

    local.uploading = true;
    local.render();

    const new_file = renameFile(file);
    const path = st.path?.replace(/\./gi, "/");

    toast.info("Mengupload file...");

    if (new_file) {
      try {
        const res = await api._raw(`/_upload?to=${path}`, new_file);
        fm.data[name] = res[0];
        toast.dismiss();
        toast.success("File berhasil diupload");
      } catch (e) {
        toast.dismiss();
        toast.error("Gagal mengupload file");
      }
    } else {
      toast.dismiss();
    }

    local.no_image = false;
    local.uploading = false;
    local.render();
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    local.isDragging = true;
    local.render();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    local.isDragging = false;
    local.render();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    local.isDragging = false;
    local.render();

    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  // Remove file
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    local.undo = fm.data[name];
    fm.data[name] = null;
    local.render();
  };

  // Undo remove
  const handleUndo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fm.data[name] = local.undo;
    local.undo = null;
    local.render();
  };

  return (
    <div
      className={cx(
        "c-border-2 c-border-dashed c-rounded-lg c-transition-all c-overflow-hidden",
        local.isDragging
          ? "c-border-blue-500 c-bg-blue-50"
          : value
            ? "c-border-gray-200 c-border-solid"
            : "c-border-gray-300 hover:c-border-gray-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={inputRef}
        className="c-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />

      {!value ? (
        // Upload Area - Empty State
        <label
          className="c-flex c-flex-col c-items-center c-justify-center c-py-6 c-px-4 c-cursor-pointer hover:c-bg-gray-50 c-transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div
            className={cx(
              "c-w-12 c-h-12 c-rounded-full c-flex c-items-center c-justify-center c-mb-3",
              local.isDragging ? "c-bg-blue-100" : "c-bg-gray-100"
            )}
          >
            <Upload
              className={cx(
                "c-w-6 c-h-6",
                local.isDragging ? "c-text-blue-500" : "c-text-gray-400"
              )}
            />
          </div>
          <span className="c-text-sm c-font-medium c-text-gray-600">
            {local.uploading
              ? "Mengupload..."
              : local.isDragging
                ? "Lepaskan file di sini"
                : "Klik untuk upload atau drag & drop"}
          </span>
          <span className="c-text-xs c-text-gray-400 c-mt-1">
            PNG, JPG, PDF, DOC hingga 10MB
          </span>

          {/* Undo option when empty */}
          {local.undo && (
            <button
              onClick={handleUndo}
              className="c-mt-3 c-flex c-items-center c-text-sm c-text-blue-600 hover:c-text-blue-700"
            >
              <Undo2 className="c-w-4 c-h-4 c-mr-1" />
              Urungkan penghapusan
            </button>
          )}
        </label>
      ) : (
        // Preview Area - Has File
        <div className="c-flex c-items-center c-p-3 c-gap-3">
          {/* Thumbnail / Icon */}
          <div className="c-flex-shrink-0">
            {!local.no_image && getImageUrl() ? (
              <a
                href={getFileUrl() || "#"}
                target="_blank"
                className="c-block"
              >
                <img
                  src={getImageUrl(80) || ""}
                  className="c-w-16 c-h-16 c-object-cover c-rounded-lg c-border c-bg-gray-100"
                  onError={() => {
                    local.no_image = true;
                    local.render();
                  }}
                />
              </a>
            ) : (
              <div className="c-w-16 c-h-16 c-bg-gray-100 c-rounded-lg c-flex c-items-center c-justify-center">
                <File className="c-w-8 c-h-8 c-text-gray-400" />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="c-flex-1 c-min-w-0">
            <a
              href={getFileUrl() || "#"}
              target="_blank"
              className="c-flex c-items-center c-text-sm c-font-medium c-text-blue-600 hover:c-text-blue-700 hover:c-underline"
            >
              <span className="c-truncate">Lihat File</span>
              <ExternalLink className="c-w-3 c-h-3 c-ml-1 c-flex-shrink-0" />
            </a>
            <p className="c-text-xs c-text-gray-400 c-mt-0.5">
              Klik untuk membuka di tab baru
            </p>
          </div>

          {/* Action Buttons */}
          <div className="c-flex c-items-center c-gap-1">
            {/* Replace */}
            <button
              onClick={() => inputRef.current?.click()}
              className="c-p-2 c-rounded-lg c-text-gray-500 hover:c-bg-gray-100 c-transition-colors"
              title="Ganti file"
            >
              <RefreshCcw className="c-w-4 c-h-4" />
            </button>

            {/* Remove */}
            <button
              onClick={handleRemove}
              className="c-p-2 c-rounded-lg c-text-red-500 hover:c-bg-red-50 c-transition-colors"
              title="Hapus file"
            >
              <X className="c-w-4 c-h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {local.uploading && (
        <div className="c-px-3 c-pb-3">
          <div className="c-w-full c-bg-gray-200 c-rounded-full c-h-1 c-overflow-hidden">
            <div
              className={cx(
                "c-h-full c-bg-blue-500 c-rounded-full",
                css`
                  animation: progress 1.5s ease-in-out infinite;
                  @keyframes progress {
                    0% {
                      width: 0%;
                    }
                    50% {
                      width: 70%;
                    }
                    100% {
                      width: 100%;
                    }
                  }
                `
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
