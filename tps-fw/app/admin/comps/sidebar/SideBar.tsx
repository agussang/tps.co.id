import { Input } from "@/comps/ui/input";
import { iconCmsHub } from "../icon";
import { icon } from "@/comps/icon";
import { IMenu, IMenuItem, ISession } from "../typing";
import { useLocal } from "@/utils/use-local";
import { Menu } from "../menu/Menu";
import { useEffect } from "react";

export const SideBar = ({
  menu,
  session,
}: {
  menu: IMenu;
  session: ISession;
}) => {
  const local = useLocal({
    status: "init" as "init" | "loading" | "ready",
    showBottomMenu: false as boolean,
    mainMenu: [] as IMenuItem[],
    bottomMenu: [] as IMenuItem[],
  });

  useEffect(() => {
    if (menu[session.roles]) {
      local.mainMenu = menu[session.roles].filter(
        (item, i) => item.position !== "bottom"
      );
      local.bottomMenu = menu[session.roles].filter(
        (item, i) => item.position === "bottom"
      );
      local.render();
    }
  }, []);

  const onShowButtomMenu = () => {
    local.showBottomMenu = !local.showBottomMenu;
    local.render();
  };

  return (
    <div
      className={cx(
        `c-flex c-flex-1 c-flex-col c-h-full c-border-r c-relative`
      )}
    >
      <div className={cx(`c-border-b c-pb-6 `)}>
        <div className={cx(`c-flex c-px-4`)}>
          <div
            className={cx(
              `c-flex c-justify-center c-items-center c-pl-2 c-bg-[#f5f8fa] c-rounded-tl-lg c-rounded-bl-lg`
            )}
          >
            {iconCmsHub.search}
          </div>
          <div className={cx(`c-w-full`)}>
            <Input
              className={cx(
                `c-bg-[#f5f8fa] c-border-none c-outline-none c-rounded-tl-none c-rounded-bl-none`
              )}
              placeholder="Search"
            />
          </div>
        </div>
      </div>
      <div className="c-flex-1 c-relative c-overflow-y-auto">
        <div className={cx(`c-absolute c-inset-0`)}>
          <Menu list={local.mainMenu} />
        </div>
      </div>
      <div className={cx(`c-flex c-flex-col`)}>
        <div
          className={cx(
            `c-bg-gray-100 c-flex c-justify-between c-items-center c-px-4 c-py-2 c-cursor-pointer hover:c-bg-blue-50`
          )}
          onClick={onShowButtomMenu}
        >
          <div className={cx(`c-flex c-space-x-2 c-font-bold c-items-center`)}>
            <div>{session.image}</div>
            <div className={cx(`c-capitalize`)}>{session.roles}</div>
          </div>
          <div className={cx(`c-cursor-pointer`)}>
            {local.showBottomMenu ? icon.down : icon.right}
          </div>
        </div>
        <div
          className={cx(
            `c-bg-white c-transition-all c-duration-300 c-ease-in-out c-border-t`,
            local.showBottomMenu
              ? `c-opacity-100 c-delay-100`
              : `c-h-0 c-opacity-0 c-delay-0`
          )}
        >
          <Menu list={local.bottomMenu} />
        </div>
      </div>
    </div>
  );
};
