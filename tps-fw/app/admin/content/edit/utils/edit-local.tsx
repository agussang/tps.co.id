import { Skeleton } from "@/comps/ui/skeleton";
import { createItem } from "@/gen/utils";
import { adminLang } from "app/admin/lang";
import { query } from "app/admin/query/content";
import type { FMLocal } from "lib/comps/form/typings";
import { formError } from "lib/comps/form/utils/error";
import get from "lodash.get";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validate } from "uuid";
import { structure as db_structure } from "../../../../../typings/prisma";
import { listTable } from "../../list/ContentListTable";
import { getParentOrStructure } from "./get-parent-struct";
import { audit } from "app/admin/actions/audit";

export type EDLocal = typeof edit_local & { render: () => void };

type SaveStatus =
  | {
      status: "ok";
      id: string;
      structure: { name: string };
    }
  | { status: "error"; errors: any }
  | { status: "any" };

export const edit_local = {
  loading: true,
  lang: adminLang.current,
  structures: [] as db_structure[],
  root: null as null | db_structure,
  field_cache: {},
  submit: () => {},
  reload: () => {},
  delete: async () => {
    const c = await db.content.findFirst({
      where: { id: params.id },
      select: {
        id_parent: true,
        structure: {
          select: { id: true, path: true },
        },
      },
    });
    
    const ids = await query.childs(params.id);
    await db.content.deleteMany({
      where: { id: { in: ids.map((e) => e.id) } },
    });
    await fetch(
      baseurl(`/clear-cache/${c?.structure?.path?.split(".").shift()}`)
    );
    navigate(
      `/backend/tpsadmin/content/list/${c?.structure?.id}${c?.id_parent ? `#parent=${c.id_parent}` : ""}`
    );
  },
  async on_load(local: any) {
    if (params.id === "new") {
      local.loading = false;
      local.render();
      return {};
    }

    local.loading = true;
    local.render();
    const { id_parent, id_structure } = await getParentOrStructure();
    const result = await query.content(id_parent, adminLang.current);

    listTable.tab = result._status;

    if (!result) {
      if (adminLang.current === adminLang.default) {
        const cur = await db.content.findFirst({
          where: { id: id_parent },
          select: {
            id: true,
            id_ori_lang: true,
          },
        });
        if (cur) {
          navigate(`/backend/tpsadmin/content/edit/${cur.id_ori_lang}`);
          return;
        }
      } else {
        toast.loading(
          <>
            <Loader2 className="c-h-4 c-w-4 c-animate-spin" />
            Loading...
          </>
        );
        const other_lang = await db.content.findFirst({
          where: { id_ori_lang: id_parent, id_structure },
          select: {
            id: true,
          },
        });

        if (other_lang) {
          navigate(`/backend/tpsadmin/content/edit/${other_lang.id}`);
        } else {
          toast.dismiss();

          toast.loading(
            <>
              <Loader2 className="c-h-4 c-w-4 c-animate-spin" />
              Translating...
            </>
          );
          let base = "";

          if (location.pathname.startsWith("/prod")) {
            const patharr = location.pathname.split("/");
            base = `/prod/${patharr[2]}`;
          }
          await fetch(
            `${base}/_import?id=${id_parent}&to=${adminLang.current}`
          );

          await new Promise<void>((done) => {
            setTimeout(async () => {
              const other_lang = await db.content.findFirst({
                where: { id_ori_lang: id_parent, id_structure },
                select: {
                  id: true,
                },
              });
              if (other_lang) {
                navigate(`/backend/tpsadmin/content/edit/${other_lang.id}`);
              }
              done();
            }, 1000);
          });
        }
        toast.dismiss();
      }
    }

    local.loading = false;
    local.render();

    return result;
  },
  save: async (local: any, fm: FMLocal) => {
    let result: SaveStatus = { status: "any" };

    const prm = {} as any;
    location.hash.split("#").map((e) => {
      const [key, value] = e.split("=");
      if (key) {
        prm[key] = value;
      }
    });

    if (params.id === "new") {
      const res = await fetch(baseurl("/backend/api/save"), {
        method: "post",
        body: JSON.stringify({
          entry: fm.data,
          mode: "new",
          id_parent: prm.parent,
          id_structure: prm.st,
          lang: adminLang.current,
          status: listTable.tab,
        }),
      });

      result = await res.json();
    } else {
      const res = await fetch(baseurl("/backend/api/save"), {
        method: "post",
        body: JSON.stringify({
          mode: "update",
          entry: fm.data,
          id: params.id,
          lang: adminLang.current,
          status: listTable.tab,
        }),
      });

      result = await res.json();
    }

    local.loading = false;
    local.render();

    fm.error = formError(fm);
    if (result.status === "ok") {
      if (params.id === "new") {
        audit.log({
          action: `Data Created: ${result.structure.name}`,
          url: `/backend/tpsadmin/content/edit/${result.id}`,
          data: fm.data,
        });
        navigate(`/backend/tpsadmin/content/edit/${result.id}`);
      } else {
        audit.log({
          action: `Data Updated: ${result.structure.name}`,
          data: fm.data,
        });
      }

      return true;
    } else if (result.status === "error") {
      for (const [k, v] of Object.entries(result.errors)) {
        fm.error.set(k, v as any);
      }

      fm.render();
      return false;
    }
  },
  Field: ({
    PassProp,
    s,
    cache,
    fm,
  }: {
    PassProp: any;
    s: db_structure;
    cache: any;
    fm: any;
  }) => {
    if ((s as any).is_root) return null;

    if (!s.path) return <>no-spath</>;

    if (!cache[s.path]) {
      const child = createItem({
        name: "item",
        component: {
          id: "32550d01-42a3-4b15-a04a-2c2d5c3c8e67",
          props: {
            label: "",
            name: "",
            type: "text",
            custom: "",
          },
        },
      });
      const props: any = get(child, "component.props");
      props.label.value = `"${s.title}"`;
      props.label.valueBuilt = `"${s.title}"`;
      const path = s.path.split(".").pop();
      props.name.value = `"${path}"`;
      props.name.valueBuilt = `"${path}"`;
      if (s.multiple) {
        props.type.value = `"custom"`;
        props.type.valueBuilt = `"custom"`;
        props.custom.valueBuilt = `"INI CUSTOM"`;
        return null;
      }
      if (s.type === "textarea") {
        props.type.value = `"custom"`;
        props.type.valueBuilt = `"custom"`;
        props.custom.valueBuilt = `React.createElement(admin.FieldRTE, { form: form, name: "${path}", st: st })`;
      }
      if (s.type === "file") {
        props.type.value = `"custom"`;
        props.type.valueBuilt = `"custom"`;
        props.custom.valueBuilt = `React.createElement(admin.FieldFile, { form: form, name: "${path}", st: st })`;
      }
      cache[s.path] = child;
    }

    return (
      <PassProp form={fm} st={s}>
        {cache[s.path]}
      </PassProp>
    );
  },
  spinner: (
    <div className="c-flex c-flex-col c-space-y-1 c-m-4">
      <Skeleton className={cx("c-w-[200px] c-h-[15px]")} />
      <Skeleton className={cx("c-w-[150px] c-h-[15px]")} />
      <Skeleton className={cx("c-w-[130px] c-h-[15px]")} />
    </div>
  ),
};
