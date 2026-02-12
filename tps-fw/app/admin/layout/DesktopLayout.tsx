import { Tree } from "@/comps/list/Tree";
import { Skeleton } from "@/comps/ui/skeleton";
import { useLocal } from "@/utils/use-local";
import { Briefcase, Users, LayoutDashboard } from "lucide-react";
import { FC, ReactNode, useEffect } from "react";
import { structure } from "../query/structure";
import { Dashboard } from "../dashboard/Dashboard";

export const w = window as unknown as {
  user: {
    id: number;
    username: string;
    role: {
      id: number;
      name: string;
      id_parent: number | null;
      can_publish: boolean;
    };
  };
};

export const DesktopLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const local = useLocal(
    {
      edit: false,
      loading: false,
      reload: false,
      tree: null as null | Awaited<ReturnType<typeof structure.tree>>,
      active_id: "",
    },
    async () => {
      if (w.user && w.user.role) {
        local.tree = await structure.tree(w.user.role.id);
        local.render();
      }
    }
  );

  useEffect(() => {
    (async () => {
      if (local.reload) {
        local.reload = false;
        local.tree = await structure.tree(w.user.role.id);
        local.render();
      }
    })();
  }, [local.reload]);

  if (!localStorage.sid) {
    navigate("/backend/tpsadmin");
    return null;
  } else {
    if (!w.user) {
      db.user_session
        .findFirst({
          where: {
            id: localStorage.sid,
          },
          select: {
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
          },
        })
        .then(async (res) => {
          if (!res) {
            navigate("/backend/tpsadmin");
          } else {
            w.user = res.user;
            local.tree = await structure.tree(w.user.role.id);
            local.render();
          }
        });

      return (
        <div className="c-flex c-flex-col c-space-y-1 c-m-4">
          <Skeleton className={cx("c-w-[200px] c-h-[12px]")} />
          <Skeleton className={cx("c-w-[150px] c-h-[12px]")} />
          <Skeleton className={cx("c-w-[130px] c-h-[12px]")} />
        </div>
      );
    }
  }

  return (
    <div
      className={cx(
        "c-flex c-w-full c-flex-1 c-justify-between c-overflow-hidden"
      )}
    >
      <div
        className={cx(
          `c-z-10 relative c-h-full flex flex-col items-stretch c-transition-all c-duration-300 c-ease-in-out ${
            true
              ? `c-opacity-100 c-delay-100 c-min-w-[300px] c-w-1/5 `
              : `c-w-0 c-opacity-0 c-delay-0`
          }`
        )}
      >
        <div
          className={cx(
            "c-flex c-items-center c-px-3 c-border-b",
            css`
              height: 50px;
              img {
                height: 30px;
              }
            `
          )}
        >
          <img alt="logo" src={siteurl("/_img/tps-logo.png")} />
        </div>
        {!local.edit && (
          <div
            onClick={() => {
              local.edit = true;
              local.render();
            }}
            className={cx(
              "c-absolute c-top-[10px] c-right-[10px] c-z-10 hover:c-bg-blue-100 c-p-1 c-cursor-pointer "
            )}
            dangerouslySetInnerHTML={{
              __html: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
            }}
          />
        )}
        {/* Dashboard Link */}
        <div
          onClick={() => {
            // Toggle dashboard view using localStorage
            localStorage.setItem("admin_view", "dashboard");
            local.render();
          }}
          className={cx(
            "c-flex c-items-center c-px-4 c-py-3 c-border-b c-space-x-2",
            "hover:c-bg-blue-50 c-cursor-pointer c-transition-colors",
            localStorage.getItem("admin_view") === "dashboard"
              ? "c-bg-blue-100 c-border-l-4 c-border-l-blue-600"
              : ""
          )}
        >
          <LayoutDashboard className="c-w-5 c-h-5 c-text-blue-600" />
          <span className="c-font-medium c-text-gray-700">Dashboard</span>
        </div>

        {local.edit && (
          <div className="c-flex c-p-1 c-border-b c-justify-between">
            <div
              onClick={async () => {
                const name = prompt("Folder Name:");
                if (name) {
                  await db.structure_folder.create({
                    data: { name, sort_idx: 0 },
                  });

                  local.reload = true;
                  local.render();
                }
              }}
              className="border text-xs hover:bg-blue-100 px-2 py-1 rounded-sm cursor-pointer"
            >
              Add Folder
            </div>
            <div className="text-sm c-flex c-items-center">
              Drag Menu to Order
            </div>
            <div
              onClick={async () => {
                local.edit = false;
                local.render();
              }}
              className="border text-xs hover:bg-blue-100 px-2 py-1 rounded-sm cursor-pointer"
            >
              Done Editing
            </div>
          </div>
        )}
        {local.tree && (
          <Tree
            className="flex-1"
            rowHeight={32}
            tree={local.tree}
            drag={local.edit}
            onChange={async (changed) => {
              db._batch.update(
                changed.map((e) => ({
                  table:
                    e.type === "structure" ? "structure" : "structure_folder",
                  data: {
                    sort_idx: e.sort_idx,
                    ...(e.type === "structure"
                      ? {
                          id_folder: e.id_parent,
                        }
                      : {
                          id_parent: e.id_parent,
                        }),
                  },
                  where: {
                    id: e.id,
                  },
                }))
              );
            }}
            renderRow={({ row, style, dragHandle }) => {
              const is_active = params.id === row.id;
              if (is_active) {
                if (params.id !== local.active_id) {
                  local.active_id = row.id;
                  local.render();
                }
              }

              const label = (
                <span className="c-ml-2 c-flex items-center c-space-x-1">
                  <span
                    onClick={async () => {
                      if (local.edit) {
                        const svg = prompt("SVG Icon:", row.icon);

                        if (svg) {
                          await db.structure.update({
                            where: { id: row.id },
                            data: {
                              icon: svg,
                            },
                          });

                          local.reload = true;
                          local.render();
                        }
                      }
                    }}
                    className={cx(
                      css`
                        width: 25px;
                        height: 25px;
                        svg {
                          width: 18px;
                          height: 18px;
                        }
                      `,
                      "c-flex c-items-center c-justify-center",
                      local.edit && "c-border c-bg-white c-cursor-pointer"
                    )}
                    dangerouslySetInnerHTML={{
                      __html:
                        row.icon ||
                        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
                    }}
                  ></span>
                  <span>{row.text}</span>
                </span>
              );
              return (
                <a
                  style={style}
                  onPointerDown={(e) => {
                    if (!local.edit) {
                      e.preventDefault();
                    }
                  }}
                  href={
                    local.edit || row.type === "folder"
                      ? undefined
                      : `/backend/tpsadmin/content/list/${row.id}`
                  }
                  className={cx(
                    "c-flex c-h-full c-items-stretch",
                    local.edit && "cursor-default",
                    css`
                      &:hover {
                        background: #ececeb;
                      }
                    `,
                    local.active_id === row.id
                      ? "c-bg-blue-100 c-border-l-4 c-border-l-blue-600"
                      : "c-pl-4 "
                  )}
                  ref={dragHandle}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (row.type === "structure") {
                      // Clear dashboard view when navigating to content
                      localStorage.removeItem("admin_view");
                      if (!local.edit) {
                        navigate(`/backend/tpsadmin/content/list/${row.id}`);
                      } else {
                        navigate(`/backend/tpsadmin/struct/edit/${row.id}`);
                      }
                    }
                  }}
                >
                  {row.type === "folder" && (
                    <span className="c-ml-2 c-flex-1 c-flex items-center c-text-sm c-font-bold c-justify-between">
                      <span>{row.text}</span>
                      {local.edit && (
                        <span className="c-mr-2 c-flex c-space-x-1">
                          <span
                            className="c-border c-p-1 c-bg-white c-cursor-pointer c-flex"
                            dangerouslySetInnerHTML={{
                              __html: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>`,
                            }}
                            onClick={async () => {
                              const to = prompt("Rename To:", row.text);
                              if (to) {
                                await db.structure_folder.update({
                                  where: { id: row.id },
                                  data: {
                                    name: to,
                                  },
                                });

                                local.reload = true;
                                local.render();
                              }
                            }}
                          ></span>
                          {row.children?.length === 0 && (
                            <span
                              className="c-border c-p-1 c-bg-white c-cursor-pointer c-flex"
                              dangerouslySetInnerHTML={{
                                __html: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
                              }}
                              onClick={async () => {
                                if (confirm("Delete empty folder?")) {
                                  await db.structure_folder.delete({
                                    where: { id: row.id },
                                  });

                                  local.reload = true;
                                  local.render();
                                }
                              }}
                            ></span>
                          )}
                        </span>
                      )}
                    </span>
                  )}

                  {row.type === "structure" && (
                    <>
                      {local.edit ? (
                        <div
                          className={cx(
                            "c-flex-1 c-flex c-items-center",
                            css`
                              cursor: pointer !important;
                              &:hover {
                                background-color: #caeaff;
                              }
                            `
                          )}
                        >
                          {label}
                        </div>
                      ) : (
                        label
                      )}
                    </>
                  )}
                </a>
              );
            }}
          />
        )}

        {w.user && (
          <div className="c-flex c-flex-col">
            {w.user.role.name === "superadmin" && (
              <div
                onClick={() => {
                  localStorage.removeItem("admin_view");
                  navigate("/backend/tpsadmin/user");
                }}
                className="c-border-t c-flex c-items-center c-pl-2 c-pt-1 c-space-x-1 c-text-sm hover:c-underline c-cursor-pointer hover:c-text-blue-500"
              >
                <Users width={14} />
                <div>Manage User</div>
              </div>
            )}

            {w.user.role.name === "superadmin" && (
              <div
                onClick={() => {
                  localStorage.removeItem("admin_view");
                  navigate("/backend/tpsadmin/role");
                }}
                className="c-flex c-items-center c-pl-2 c-space-x-1 c-pb-1 c-text-sm hover:c-underline c-cursor-pointer hover:c-text-blue-500"
              >
                <Briefcase width={14} />
                <div>Manage Role</div>
              </div>
            )}

            <div className="c-flex c-p-2 c-border-t c-justify-between c-items-center">
              <div className="c-flex c-flex-col">
                <div className="c-font-bold">{w.user.username}</div>
                <div className="c-flex c-text-xs">
                  <div className="c-text-xs">{w.user.role.name}</div>
                </div>
              </div>
              <div
                className="c-px-4 c-py-1 c-rounded-lg c-bg-red-50 c-text-sm c-cursor-pointer"
                onClick={() => {
                  if (confirm("Confirm logout ?")) {
                    localStorage.removeItem("sid");
                    navigate("/backend/tpsadmin");
                    window.location.reload();
                  }
                }}
              >
                Logout
              </div>
            </div>
          </div>
        )}
      </div>
      <div className={cx(`border-l c-z-20 c-w-full`)}>
        {localStorage.getItem("admin_view") === "dashboard" ? <Dashboard /> : children}
      </div>
    </div>
  );
};
