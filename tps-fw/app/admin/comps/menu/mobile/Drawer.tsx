import { FC, useEffect } from "react";
import { IMenu, IMenuItem, ISession } from "../../typing";
import { icon } from "@/comps/icon";
import { Menu } from "../Menu";
import { useLocal } from "@/utils/use-local";

export const DrawerMenu: FC<{
  session: ISession;
  onShowDrawer: () => void;
  menu: IMenu;
}> = ({ session, onShowDrawer, menu }) => {
  const local = useLocal({
    status: "init" as "init" | "loading" | "ready",
    showBottomMenu: false as boolean,
    mainMenu: [] as IMenuItem[],
    bottomMenu: [] as IMenuItem[],
  });

  useEffect(() => {
    local.mainMenu = menu[session.roles].filter(
      (item, i) => item.position !== "bottom"
    );
    local.bottomMenu = menu[session.roles].filter(
      (item, i) => item.position === "bottom"
    );
    local.render();
  }, []);

  const onShowButtomMenu = () => {
    local.showBottomMenu = !local.showBottomMenu;
    local.render();
  };

  return (
    <div
      className={cx(
        `z-10 w-full c-h-screen c-flex c-flex-col c-justify-between c-overflow-hidden`
      )}
    >
      <div
        className={cx(
          `c-px-4 c-py-3 c-flex c-justify-between c-items-center c-border-b`
        )}
      >
        <div className={cx(`c-flex c-items-center c-space-x-2`)}>
          <div>{session.image}</div>
          <div className={cx(`c-flex c-flex-col c-leading-4`)}>
            <div>{session.name}</div>
            <div className={cx(`c-capitalize c-text-xs`)}>{session.roles}</div>
          </div>
        </div>
        <div onClick={onShowDrawer} className={cx(`c-cursor-pointer`)}>
          {icon.close}
        </div>
      </div>
      <div className={cx(`c-px-0 c-py-0 c-h-full c-overflow-y-scroll`)}>
        <Menu list={local.mainMenu} />
      </div>
      <div className={cx(`c-flex c-flex-col`)}>
        <div
          className={cx(
            `c-px-4 c-py-4 c-border-t c-flex c-justify-between c-items-center`
          )}
          onClick={onShowButtomMenu}
        >
          <div className={cx(`c-flex c-space-x-2 c-items-center`)}>
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
