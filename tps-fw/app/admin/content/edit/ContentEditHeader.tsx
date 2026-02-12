import { FC, useEffect } from "react";
import { content, structure } from "../../../../typings/prisma";
import { ContentBreads } from "../ui/breads";
import { useLocal } from "@/utils/use-local";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { edit_local } from "./utils/edit-local";
import { audit } from "app/admin/actions/audit";
import { hash } from "bun";

export const ContentEditHeader: FC<{
  children: any;
  PassProp: any;
  lc: typeof edit_local & { render: () => void };
}> = ({ children, PassProp, lc }) => {
  const local = useLocal({
    hash: { parent: true as any },
    item: null as null | content,
    structs: null as null | structure[],
    timeout: null as any,
    status: "" as "published" | "draft",
  });

  useEffect(() => {
    if (lc.structures) {
      local.structs = lc.structures.sort(
        (a, b) => (a.path || "").length - (b.path || "").length
      );
      if (local.structs?.length > 0) {
        local.hash.parent =
          (local.structs?.[0]?.path?.split(".").length || 0) > 1 ? true : false;
      }
      local.render();

      if (local.structs[0]?.title) {
        audit.log({
          action: `Page View: ${params.id === "new" ? "New" : "Edit"} ${local.structs[0]?.title}`,
        });
      }
    }
  }, [lc.structures]);

  useEffect(() => {
    db.content.findFirst({ where: { id: params.id } }).then((res) => {
      if (res) {
        local.item = res;
        local.render();
      }
    });
  }, [lc]);

  return (
    <div className="c-w-full c-flex-1 c-flex c-justify-between">
      <div className="c-flex c-items-center">
        <ContentBreads />
      </div>
      <PassProp
        hash={local.hash}
        status={local.item?.status as any}
        item={{}}
        item_render={() => {
          local.render();
        }}
        local={lc}
        update_status={async (status: string) => {
          if (!local.item) return;

          toast.loading(
            <>
              <Loader2 className="c-h-4 c-w-4 c-animate-spin" />
              {status === "published" ? "Publishing..." : "Revert to draft"}
            </>
          );
          await db.content.update({
            where: { id: local.item.id },
            data: { status: status },
          });
          local.item.status = status;

          let base = "";
          if (location.pathname.startsWith("/prod")) {
            base = location.pathname.split("/").slice(0, 3).join("/");
          }
          await fetch(`${base}/_cache/clear/${local.structs?.[0].path}`);
          local.render();
          if (status === "published") {
            toast.success(
              <div className="c-flex c-text-green-700 c-items-center">
                <Check className="c-h-4 c-w-4 c-mr-1 " />
                Published
              </div>,
              {
                className: css`
                  background: #e4ffed;
                  border: 2px solid green;
                `,
              }
            );
          } else {
            toast.info("Reverted to draft");
          }

          clearTimeout(local.timeout);
          local.timeout = setTimeout(toast.dismiss, 3000);
        }}
      >
        {children}
      </PassProp>
    </div>
  );
};
