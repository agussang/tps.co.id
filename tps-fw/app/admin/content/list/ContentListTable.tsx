import { useLocal } from "@/utils/use-local";

import { FC, ReactElement, useEffect } from "react";
import { list_local } from "./ContentList";

import { structure as db_structure } from "../../../../typings/prisma";
import { structure } from "../../query/structure";

import "react-data-grid/lib/styles.css";

import { longDate, shortDate } from "@/utils/date";
import { adminLang } from "app/admin/lang";
import { Loader2 } from "lucide-react";
import { Column, SortColumn } from "react-data-grid";
import { getPathname } from "../../../..";
import { Btn } from "../ui/btn";
import { TableInternal } from "./CTInternal";
import { CellContent } from "./cell/content";
import { CellFile } from "./cell/file";
import { CellMultiple } from "./cell/multiple";
import { CellUrl } from "./cell/url";

export const listTable = {
  tab: "published" as "draft" | "published",
};

export const ContentListTable: FC<{
  local: typeof list_local;
}> = ({ local }) => {
  const config = useLocal({
    id: "",
    columns: [] as Column<Record<string, any>>[],
    table: null as null | ReactElement,
    data: [] as any[],
    content: [],
    timeout: null as any,
    sort: [] as SortColumn[],
    lang: "",
    search: "",
    loading: false,
    renderTable: () => {},
  });

  useEffect(() => {
    if (
      local.cur &&
      local.headers.length > 0 &&
      (config.id !== local.cur?.id || config.lang !== adminLang.current)
    ) {
      config.loading = true;
      config.id = local.cur.id;
      config.lang = adminLang.current;
      config.columns = [];
      config.render();

      const structs: db_structure[] = [];

      let base = "";
      if (location.pathname.startsWith("/prod")) {
        const patharr = location.pathname.split("/");
        base = `/prod/${patharr[2]}`;
      }

      config.columns.push({
        key: "row_idx",
        name: "#",
        frozen: true,
        resizable: true,
        sortable: true,
        maxWidth: 60,
        renderCell({ row, rowIdx }) {
          return (
            <>
              <a
                href={`${base}/backend/tpsadmin/content/edit/${row.id}`}
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <Btn
                  variant="active"
                  outerClassName="num-edit c-hidden"
                  onClick={() => {
                    let prefix = "";
                    if (location.pathname.startsWith("/prod/")) {
                      const path = location.pathname.split("/");
                      prefix = `/${path[1]}/${path[2]}`;
                    }
                    navigate(`/backend/tpsadmin/content/edit/${row.id}`);
                    // location.href = `${prefix}/backend/tpsadmin/content/edit/${row.id}`;
                  }}
                >
                  Edit
                </Btn>
              </a>
              <div className="num-idx c-text-black c-flex">{rowIdx + 1}</div>
            </>
          );
        },
      });
      local.headers = local.headers.sort((a, b) => {
        return a.sort_idx - b.sort_idx;
      });

      let part_len = 0;
      for (const e of local.headers) {
        if (e.path && e.id) {
          const parts = e.path.split(".");
          if (part_len === 0) part_len = parts.length;
          if (parts.length === part_len) {
            structs.push(e);

            if (!e.visible && !e.multiple) continue;

            config.columns.push({
              key: e.path,
              minWidth: 60,
              resizable: true,
              sortable: true,
              name: e.title || "",
              renderCell({ row, rowIdx }) {
                const value = row[e.path || ""];
                if (e.type === "textarea") return <CellContent value={value} />;
                if (e.type === "file") {
                  return <CellFile value={value} />;
                }
                if (e.path?.includes("url")) {
                  return <CellUrl value={value} />;
                }

                if (e.type === "date") return shortDate(value);
                if (e.type === "datetime") return longDate(value);

                if (e.multiple) {
                  return (
                    <CellMultiple st={e} row={row} lang={adminLang.current} />
                  );
                }
                return <>{value || "-"}</>;
              },
            });
          }
        }
      }

      config.sort = [];
      const render = () => {
        let data = [...config.data];
        if (config.search) {
          const search = config.search.toLowerCase();
          let founds: any[] = [];
          for (const row of data) {
            let found = false;
            for (const [k, v] of Object.entries(row)) {
              if (!found) {
                if (typeof v === "string" && v.toLowerCase().includes(search)) {
                  found = true;
                } else if (
                  typeof v === "number" &&
                  v.toString().includes(search)
                ) {
                  found = true;
                }
              }
            }
            if (found) {
              founds.push(row);
            }
          }
          data = founds;
        }

        config.table = (
          <TableInternal
            render={render}
            structures={structs}
            columns={config.columns}
            data={data}
          />
        );
        config.render();
      };
      config.renderTable = render;

      config.table = (
        <TableInternal
          structures={structs}
          columns={config.columns}
          render={render}
        />
      );

      clearTimeout(config.timeout);
      config.timeout = setTimeout(async () => {
        if (local.cur) {
          config.render();

          const where: any = {};
          for (const h of location.hash.split("#")) {
            if (h) {
              const [key, value] = h.split("=");
              if (key === "parent") {
                where["id_parent"] = value;
              }
            }
          }

          if (!where.id_parent) {
            if (listTable.tab === "draft") {
              where.status = { not: "published" };
            } else {
              where.status = "published";
            }
            where.lang = adminLang.current;
          } else {
            if (adminLang.current !== adminLang.default) {
              where.lang = adminLang.current;
            }
          }

          if (config.search) {
            config.id = "";
          }

          config.data = await structure.content(local.cur, structs, where);

          config.table = (
            <TableInternal
              render={render}
              structures={structs}
              columns={config.columns}
              data={config.data}
            />
          );
          config.loading = false;
          config.render();
        }
      }, 300);
    }
  }, [
    local.cur,
    local.headers,
    listTable.tab,
    adminLang.current,
    config.search,
  ]);

  useEffect(() => {
    config.search = "";
    config.render();
  }, [getPathname()]);

  const im_lang = `/backend/tpsadmin/import/lang/#dir=${adminLang.current} → ${adminLang.default}#st=${params.id}`;

  return (
    <div
      className={cx(
        "c-flex c-flex-col c-flex-1 c-w-full c-h-full",
        css`
          div[aria-selected="true"] {
            outline: none;
          }
          .rdg-header-sort-name {
            display: flex;
            align-items: center;
          }
        `
      )}
    >
      {!location.hash && (
        <div className="c-flex c-justify-between c-items-stretch">
          <div className={cx("c-pt-1 c-px-3 c-border-b c-flex c-flex-1")}>
            {["draft", "published"].map((key, idx) => {
              const is_active = listTable.tab === key;
              return (
                <div
                  key={key}
                  className={cx(
                    "c-px-1 c-text-xs c-cursor-pointer c-border-t c-border-r c-capitalize c-py-1",
                    idx === 0 && "c-border-l",
                    key === "published" && "c-text-green-800"
                  )}
                  onClick={() => {
                    listTable.tab = key as any;
                    config.id = "";
                    config.render();
                  }}
                >
                  {key === "published" && (
                    <div
                      className={cx(
                        "c-transition-all c-py-[2px]",
                        is_active
                          ? "c-bg-green-800 c-px-2  c-text-white"
                          : "c-px-2 ",
                        css`
                          border-radius: 4px;
                        `
                      )}
                    >
                      {key}
                    </div>
                  )}
                  {key === "draft" && (
                    <div
                      className={cx(
                        "c-transition-all  c-py-[2px]",
                        is_active
                          ? "c-bg-blue-800 c-px-2 c-py-1 c-text-white"
                          : "c-px-2 ",
                        css`
                          border-radius: 4px;
                        `
                      )}
                    >
                      {key}
                    </div>
                  )}
                </div>
              );
            })}

            {config.loading && (
              <div className="c-flex c-items-center c-pl-1">
                <Loader2
                  className={cx(
                    "c-h-[15px] c-w-[15px] c-text-primary/60 c-animate-spin"
                  )}
                />
              </div>
            )}
            <input
              type="search"
              placeholder="Search"
              spellCheck={false}
              value={config.search}
              className="c-mx-1 c-text-sm c-outline-none c-flex-1 c-border c-border-b-0 px-2"
              onChange={(e) => {
                config.search = e.currentTarget.value;
                config.renderTable();
              }}
            />
          </div>

          {/* {adminLang.current !== adminLang.default && (
            <a
              className={cx(
                "c-border c-px-2 c-py-1 c-text-xs c-mr-2 c-cursor-pointer hover:c-bg-blue-100",
                css`
                  border-radius: 3px;
                  > span {
                    border-radius: 3px;
                  }
                `
              )}
              onClick={(e) => {
                e.preventDefault();
                navigate(im_lang);
              }}
              href={im_lang}
            >
              Import from{" "}
              <span className="c-bg-blue-800 c-text-white c-px-1 c-opacity-70">
                {adminLang.default.toUpperCase()}
              </span>
            </a>
          )} */}
        </div>
      )}
      <div className="c-flex c-flex-1">{!local.loading && config.table}</div>
    </div>
  );
};
