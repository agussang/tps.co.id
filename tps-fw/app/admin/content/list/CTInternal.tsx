import { Skeleton } from "@/comps/ui/skeleton";
import { useLocal } from "@/utils/use-local";

import { FC, useEffect } from "react";

import { structure as db_structure } from "../../../../typings/prisma";

import DataGrid, { ColumnOrColumnGroup, SortColumn } from "react-data-grid";

export const TableInternal: FC<{
  columns: (ColumnOrColumnGroup<any, unknown> & { key: string })[];
  data?: any[];
  structures: db_structure[];
  render: () => void;
}> = ({ columns, data, render, structures }) => {
  const local = useLocal({
    width: 0,
    height: 0,
    rob: new ResizeObserver(([e]) => {
      local.height = e.contentRect.height;
      local.width = e.contentRect.width;
      local.render();
    }),
    el: null as any,
    sort: [] as SortColumn[],
  });

  useEffect(() => {
    return () => {
      local.rob.disconnect();
    };
  }, []);
  const sort = local.sort;

  if (sort.length > 0 && !columns.find((e) => e.key === sort[0].columnKey)) {
    sort.length = 0;
  }

  const order_col = columns.find(
    (e) =>
      typeof e.name === "string" &&
      (e.name === "Order" ||
        e.name.toLowerCase().includes("date") ||
        e.name === "Year")
  );
  if (sort.length === 0 && order_col) {
    sort.push({
      columnKey: order_col.key,
      direction: order_col.name !== "Order" ? "DESC" : "ASC",
    });
  }

  if (sort.length > 0 && data) {
    const st = structures.find((e) => e.path === sort[0].columnKey);
    data.sort((a, b) => {
      const na = parseInt(a[sort[0].columnKey]);
      const nb = parseInt(b[sort[0].columnKey]);

      if (st) {
        if (st.type === "date") {
          const va = new Date(a[sort[0].columnKey]);
          const vb = new Date(b[sort[0].columnKey]);
          if (sort[0].direction === "ASC") {
            return va.getTime() - vb.getTime();
          } else {
            return vb.getTime() - va.getTime();
          }
        }
      }
      if (na && nb && (typeof na === "number" || typeof nb === "number")) {
        if (sort[0].direction === "ASC") {
          return na - nb;
        } else {
          return nb - na;
        }
      } else {
        const va = a[sort[0].columnKey];
        const vb = b[sort[0].columnKey];
        if (typeof va === "string" && typeof vb === "string") {
          if (sort[0].direction === "ASC") {
            return va.localeCompare(vb);
          } else {
            return vb.localeCompare(va);
          }
        }
      }
      return 0;
    });
  }

  return (
    <div
      className={cx(
        "c-w-full c-h-full",
        css`
          div[role="row"]:hover {
            background: #e2f1ff;
            .num-edit {
              display: flex;
            }
            .num-idx {
              display: none;
            }
          }
          div[role="columnheader"] span svg {
            margin: 12px 2px;
          }
        `
      )}
      ref={(el) => {
        if (!local.el && el) {
          local.el = el;
          local.rob.observe(el);
        }
      }}
    >
      <DataGrid
        columns={columns}
        selectedRows={null}
        sortColumns={sort}
        onSortColumnsChange={([col]) => {
          local.sort = [];
          if (col) {
            if (sort.length > 0) {
              const first = sort[0];

              if (first && first.columnKey === col.columnKey) {
                local.sort.push({
                  columnKey: col.columnKey,
                  direction: first.direction === "ASC" ? "DESC" : "ASC",
                });
                render();
                return;
              }
            }
            local.sort.push(col);
          } else if (order_col) {
            local.sort.push({ columnKey: order_col.key, direction: "ASC" });
          }
          render();
        }}
        className="fill-grid rdg-light"
        renderers={
          typeof data === "undefined"
            ? undefined
            : {
                noRowsFallback: (
                  <div className="c-flex-1 c-w-full absolute inset-0 c-flex c-flex-col c-items-center c-justify-center">
                    <img
                      src={siteurl("/_img/no-data.svg")}
                      className="c-max-w-[30%]"
                    />
                  </div>
                ),
              }
        }
        style={{
          height: typeof data === "undefined" ? 50 : local.height,
          width: local.width,
        }}
        rows={data || []}
      />
      {typeof data === "undefined" && (
        <div className="c-flex c-flex-col c-space-y-1 c-m-4">
          <Skeleton className={cx("c-w-[200px] c-h-[15px]")} />
          <Skeleton className={cx("c-w-[150px] c-h-[15px]")} />
        </div>
      )}
    </div>
  );
};
