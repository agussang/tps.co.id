import { FC, ReactNode } from "react";
import { BottomNav } from "../comps/menu/mobile/BottomNav";
import { icon } from "@/comps/icon";
import { TopBarMobile } from "../comps/header/mobile/TopBar";
import { iconCmsHub } from "../comps/icon";
import { DrawerMenu } from "../comps/menu/mobile/Drawer";
import { useLocal } from "@/utils/use-local";
import menu from "./menu";

const bottomMenuList = [
  {
    label: "Dashboard",
    activeIcon: icon.dashboardSmall,
    inActiveIcon: icon.dashboardSmallTransparent,
    url: "/dashboard",
  },
  {
    label: "Berita Terkini",
    activeIcon: icon.newsSmall,
    inActiveIcon: icon.newsSmallTransparent,
    url: "/article/berita-terkini",
  },
  {
    label: "Press Release",
    activeIcon: icon.releaseSmall,
    inActiveIcon: icon.releaseSmallTransparent,
    url: "/article/press-release",
  },
  {
    label: "Profile",
    activeIcon: icon.userSmall,
    inActiveIcon: icon.userSmallTransparent,
    url: "/logout",
  },
];

const session = {
  id: "0662ef48-761d-4fa8-953a-cfb9beed5e66",
  name: "Iwan",
  roles: "moderator",
  image: iconCmsHub.profile,
};

export const MobileLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const local = useLocal({
    showDrawer: false as boolean,
  });

  const onShowDrawer = () => {
    local.showDrawer = !local.showDrawer;
    local.render();
  };

  return (
    <div className={cx(`c-flex c-flex-1 c-flex-col c-relative`)}>
      {/* Drawer */}
      <div
        className={cx(
          `c-absolute c-transition-all c-duration-300 c-ease-in-out c-bg-white ${
            local.showDrawer
              ? `c-opacity-100 c-delay-100 c-w-full c-z-10`
              : `c-w-0 c-opacity-0 c-delay-0`
          }`
        )}
      >
        <DrawerMenu session={session} onShowDrawer={onShowDrawer} menu={menu} />
      </div>
      {/* End Drawer */}
      <div className={cx(``)}>
        <TopBarMobile session={session} onShowDrawer={onShowDrawer} />
      </div>
      <div className={cx(`c-flex c-flex-1 c-w-full c-bg-gray-100`)}>
        {children}
      </div>
      <div className={cx(``)}>
        <BottomNav menu={bottomMenuList} />
      </div>
    </div>
  );
};
