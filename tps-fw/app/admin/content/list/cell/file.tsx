import { FC } from "react";
import { Btn } from "../../ui/btn";
import { useLocal } from "@/utils/use-local";

export const CellFile: FC<{ value: { path: string } }> = ({ value }) => {
  return (
    <Btn
      popover={<FilePreview url={!!value ? value.path : ""} />}
      className={!value ? "c-opacity-50" : ""}
    >
      File
    </Btn>
  );
};

const FilePreview: FC<{ url: string }> = ({ url }) => {
  const local = useLocal({ no_image: false });

  const ext = typeof url === "string" ? url.split(".").pop() || "" : "";
  return (
    <a
      className="c-min-w-[200px] c-min-h-[200px] c-flex c-items-center c-justify-center c-cursor-pointer"
      href={siteurl(`/_file/${url}`)}
      target="_blank"
    >
      {!url && (
        <div className="uppercase font-bold text-lg text-slate-300 c-flex">
          <span className="">NO FILE </span>
        </div>
      )}
      {url && (
        <>
          {isImage(ext) && !local.no_image ? (
            <img
              draggable={false}
              className="c-w-full c-h-full c-pointer-events-none c-p-1 c-m-2 c-bg-slate-500"
              src={siteurl(`/_img/${url}?w=500`)}
              onError={() => {
                local.no_image = true;
                local.render();
              }}
            />
          ) : (
            <div className="uppercase font-bold text-lg text-slate-300 c-flex">
              <span className="c-mr-1"> {ext} MISSING</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: `<svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>`,
                }}
              ></span>
            </div>
          )}
        </>
      )}
    </a>
  );
};

export const isImage = (ext: string) => {
  if (["gif", "jpeg", "jpg", "png", "svg", "webp"].includes(ext)) return true;
};
