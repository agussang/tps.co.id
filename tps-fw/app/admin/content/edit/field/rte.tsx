import { Popover } from "@/comps/custom/Popover";
import { FMLocal } from "@/comps/form/typings";
import { useLocal } from "@/utils/use-local";
import { FC, useCallback } from "react";
import ContentEditable from "react-contenteditable";
import { structure } from "../../../../../typings/prisma";
import { rteOnKeyDown } from "../../ui/rte";

export const FieldRTE: FC<{
  fm: FMLocal;
  st: structure;
  name: string;
  mode?: "popup" | "inline";
}> = ({ fm, name, mode }) => {
  const value = fm.data[name] || "";
  const local = useLocal({
    el: null as null | HTMLDivElement,
    open: false,
    mode: value.length > 150 ? "popup" : ("inline" as "popup" | "inline"),
    onChange: (e: any) => {},
  });
  if (mode) local.mode = mode;
  const field = fm.fields?.[name];

  const input = useCallback(
    (className: string) => (
      <ContentEditable
        spellCheck={false}
        onKeyDown={rteOnKeyDown}
        ref={(e: any) => {
          if (e && !local.el) {
            local.el = e?.getEl();
            if (local.el) local.el.focus();
          }
        }}
        className={cx(
          className,
          "c-outline-none c-max-h-[300px] c-overflow-auto c-cursor-text c-break-words",
          local.mode === "inline" ? "c-px-3 c-py-2" : "c-p-3",
          css`
            white-space: break-spaces;
            word-break: break-all;
          `
        )}
        html={value}
        onChange={(e) => {
          fm.data[name] = e.target.value;
          local.render();
        }}
        onFocus={() => {
          field.focused = true;
          fm.render();
        }}
        onBlur={() => {
          field.focused = false;
          fm.render();
        }}
        onPaste={(e) => {
          e.preventDefault();
          if (local.el) {
            const value = e.clipboardData.getData("text/plain");
            local.el.innerHTML = value;
            fm.data[name] = value;
            fm.render();
          }
        }}
      />
    ),
    [fm.data[name], local, value, field]
  );

  if (local.mode === "inline") return input("c-w-full");

  return (
    <Popover
      open={local.open}
      onOpenChange={(open) => {
        local.open = open;
        local.render();

        setTimeout(() => {
          if (local.el) {
            local.el.focus();
          }
        }, 100);
      }}
      content={input("c-w-[700px]")}
    >
      <div className="c-flex c-items-stretch c-flex-1 hover:c-bg-blue-50 -c-my-2 c-px-3 c-py-2 c-rounded-lg c-cursor-pointer c-relative c-overflow-hidden">
        <span className="c-opacity-0">_</span>
        <div
          className="c-absolute c-inset-0 c-mx-3 c-py-2 c-overflow-hidden c-transition-all c-mt-0 hover:c-mt-[-40px] c-duration-1000"
          dangerouslySetInnerHTML={{ __html: value }}
          onFocus={() => {
            field.focused = true;
            fm.render();
          }}
          onBlur={() => {
            field.focused = false;
            fm.render();
          }}
        ></div>
      </div>
    </Popover>
  );
};
