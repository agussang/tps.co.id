import { Skeleton } from "@/comps/ui/skeleton";
import { useLocal } from "@/utils/use-local";
import { FC } from "react";
import ContentEditable from "react-contenteditable";
import { Btn } from "../../ui/btn";
import { rteOnKeyDown } from "../../ui/rte";

export const CellContent: FC<{ value: any }> = ({ value }) => {
  return <Btn popover={<ContentInternal value={value} />}>Content</Btn>;
};

const ContentInternal: FC<{ value: any }> = ({ value }) => {
  const local = useLocal(
    {
      value: "",
      loading: true,
      saving: false,
      el: null as null | HTMLTextAreaElement,
      save_timeout: null as any,
    },
    async () => {
      if (value) {
        const res = await db.content.findFirst({ where: { id: value.id } });
        if (res) {
          local.value = res.text || "";
        }
      }
      local.loading = false;
      local.render();
    }
  );

  if (local.loading) {
    return (
      <div className="c-flex c-flex-col c-space-y-1 c-m-4">
        <Skeleton className={cx("c-w-[200px] c-h-[15px]")} />
        <Skeleton className={cx("c-w-[150px] c-h-[15px]")} />
        <Skeleton className={cx("c-w-[130px] c-h-[15px]")} />
      </div>
    );
  }
  return (
    <div className="c-flex c-flex-1 c-flex-col c-items-stretch c-w-[700px] c-h-[300px]">
      <div className="c-flex c-justify-between c-border-b c-mb-1 c-py-1 c-text-xs c-text-blue-400 c-px-2">
        <div className="">Quick Edit:</div>
        <div>{local.saving && "Saving..."}</div>
      </div>
      <div className="c-relative c-flex-1  c-overflow-auto">
        <ContentEditable
          autoFocus
          spellCheck={false}
          onKeyDown={rteOnKeyDown}
          ref={(e: any) => {
            if (!local.el && e) {
              local.el = e?.getEl();
              if (local.el) local.el.focus();
            }
          }}
          className="c-outline-none c-absolute c-inset-0 c-px-3"
          html={local.value}
          onChange={(e) => {
            local.value = e.target.value;
            local.render();
            clearTimeout(local.save_timeout);
            local.save_timeout = setTimeout(async () => {
              local.saving = true;
              local.render();
              await db.content.update({
                where: { id: value.id },
                data: { text: local.value },
              });
              local.saving = false;
              local.render();
            }, 1000);
          }}
        />
      </div>
    </div>
  );
};
