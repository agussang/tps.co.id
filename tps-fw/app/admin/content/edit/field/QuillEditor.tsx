import { FC, useEffect, useRef } from "react";
import { useLocal } from "@/utils/use-local";
import type { FMLocal } from "lib/comps/form/typings";
import type { structure } from "../../../../../typings/prisma";
import Quill from "quill";
import "quill/dist/quill.snow.css";

// Full toolbar configuration
const TOOLBAR_OPTIONS = [
  // Heading
  [{ header: [1, 2, 3, false] }],

  // Text formatting
  ["bold", "italic", "underline", "strike"],

  // Colors
  [{ color: [] }, { background: [] }],

  // Lists
  [{ list: "ordered" }, { list: "bullet" }],

  // Alignment
  [{ align: [] }],

  // Indentation
  [{ indent: "-1" }, { indent: "+1" }],

  // Media & Links
  ["link", "image", "video"],

  // Advanced
  ["blockquote", "code-block"],

  // Clean formatting
  ["clean"],
];

export const QuillEditor: FC<{
  fm: FMLocal;
  st: structure;
  name: string;
  placeholder?: string;
}> = ({ fm, name, st, placeholder }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const local = useLocal({
    initialized: false,
    focused: false,
  });

  const value = fm.data[name] || "";
  const field = fm.fields?.[name];
  const hasError = fm.error?.get?.(name)?.length > 0;

  // Initialize Quill editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
        },
        placeholder: placeholder || `Ketik ${st.title || "konten"} di sini...`,
      });

      quillRef.current = quill;

      // Set initial content
      if (value) {
        quill.root.innerHTML = value;
      }

      // Handle content changes
      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        // Clean empty paragraphs
        const cleanHtml = html === "<p><br></p>" ? "" : html;
        fm.data[name] = cleanHtml;
      });

      // Handle focus
      quill.root.addEventListener("focus", () => {
        local.focused = true;
        if (field) field.focused = true;
        local.render();
        fm.render();
      });

      // Handle blur
      quill.root.addEventListener("blur", () => {
        local.focused = false;
        if (field) field.focused = false;
        local.render();
        fm.render();
      });

      local.initialized = true;
      local.render();
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Sync external value changes (e.g., form reset)
  useEffect(() => {
    if (quillRef.current && local.initialized) {
      const currentHtml = quillRef.current.root.innerHTML;
      const normalizedCurrent =
        currentHtml === "<p><br></p>" ? "" : currentHtml;
      const normalizedValue = value || "";

      if (normalizedCurrent !== normalizedValue) {
        quillRef.current.root.innerHTML = normalizedValue;
      }
    }
  }, [value, local.initialized]);

  return (
    <div
      ref={containerRef}
      className={cx(
        "c-border c-rounded-lg c-overflow-hidden c-transition-all",
        local.focused
          ? "c-ring-2 c-ring-blue-500 c-border-blue-500"
          : "c-border-gray-300",
        hasError && "c-border-red-500 c-bg-red-50",
        css`
          .ql-toolbar.ql-snow {
            border: none !important;
            border-bottom: 1px solid #e5e7eb !important;
            background: #f9fafb;
            padding: 8px 12px !important;
          }

          .ql-container.ql-snow {
            border: none !important;
            font-family: inherit;
            font-size: 14px;
          }

          .ql-editor {
            min-height: 150px;
            max-height: 400px;
            overflow-y: auto;
            padding: 12px 16px !important;
            line-height: 1.6;
          }

          .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: normal !important;
            left: 16px !important;
          }

          /* Toolbar button styling */
          .ql-snow .ql-stroke {
            stroke: #374151;
          }

          .ql-snow .ql-fill {
            fill: #374151;
          }

          .ql-snow .ql-picker {
            color: #374151;
          }

          .ql-snow.ql-toolbar button:hover,
          .ql-snow .ql-toolbar button:hover,
          .ql-snow.ql-toolbar button.ql-active,
          .ql-snow .ql-toolbar button.ql-active,
          .ql-snow.ql-toolbar .ql-picker-label:hover,
          .ql-snow .ql-toolbar .ql-picker-label:hover,
          .ql-snow.ql-toolbar .ql-picker-label.ql-active,
          .ql-snow .ql-toolbar .ql-picker-label.ql-active {
            color: #0173ff !important;
          }

          .ql-snow.ql-toolbar button:hover .ql-stroke,
          .ql-snow .ql-toolbar button:hover .ql-stroke,
          .ql-snow.ql-toolbar button.ql-active .ql-stroke,
          .ql-snow .ql-toolbar button.ql-active .ql-stroke {
            stroke: #0173ff !important;
          }

          .ql-snow.ql-toolbar button:hover .ql-fill,
          .ql-snow .ql-toolbar button:hover .ql-fill,
          .ql-snow.ql-toolbar button.ql-active .ql-fill,
          .ql-snow .ql-toolbar button.ql-active .ql-fill {
            fill: #0173ff !important;
          }

          /* Dropdown menus */
          .ql-snow .ql-picker-options {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 4px;
          }

          .ql-snow .ql-picker-item:hover {
            color: #0173ff;
          }

          /* Code block styling */
          .ql-editor pre.ql-syntax {
            background: #1f2937;
            color: #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            font-family: "Fira Code", monospace;
            font-size: 13px;
            overflow-x: auto;
          }

          /* Blockquote styling */
          .ql-editor blockquote {
            border-left: 4px solid #0173ff;
            padding-left: 16px;
            margin: 8px 0;
            color: #4b5563;
            font-style: italic;
          }

          /* Link styling in editor */
          .ql-editor a {
            color: #0173ff;
            text-decoration: underline;
          }

          /* Image styling */
          .ql-editor img {
            max-width: 100%;
            border-radius: 6px;
          }

          /* Video styling */
          .ql-editor .ql-video {
            width: 100%;
            max-width: 560px;
            height: 315px;
            border-radius: 6px;
          }

          /* Error state */
          ${hasError &&
          `
            .ql-toolbar.ql-snow {
              background: #fef2f2 !important;
            }
          `}
        `
      )}
    >
      <div ref={editorRef} />
    </div>
  );
};
