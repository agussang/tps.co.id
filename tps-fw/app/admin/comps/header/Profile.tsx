import { FC, useEffect, useRef } from "react";
import { ISession } from "../typing";
import icon from "../../../lucide";
import { useLocal } from "@/utils/use-local";
import { Menu } from "../menu/Menu";

export const ProfileHeader: FC<{ session: ISession }> = ({ session }) => {
  const local = useLocal({
    showProfileMenu: false as boolean,
  });
  const _ref = useRef<HTMLDivElement>(null);

  const menu = [
    { label: "Profile", icon: icon.profile, url: "/profile" },
    { label: "Log Out", icon: icon.logout, url: "/logout" },
  ];

  const onShowMenu = () => {
    local.showProfileMenu = !local.showProfileMenu;
    local.render();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (_ref.current && !_ref.current.contains(event.target as Node)) {
        local.showProfileMenu = false;
        local.render();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div className={cx(`c-relative`)}>
      <div className={cx(`c-cursor-pointer`)} onClick={onShowMenu} ref={_ref}>
        {session.image}
      </div>
      <div
        className={cx(
          `c-min-w-[180px] c-mt-1 c-pt-2 c-z-10 c-shadow-lg c-focus:outline-none c-rounded-md c-gap-2 c-absolute c-right-0 c-bg-white c-flex c-flex-col c-space-y-2 c-transition-all c-duration-300 c-ease-in-out ${
            local.showProfileMenu
              ? `c-opacity-100 c-delay-100`
              : `c-opacity-0 c-delay-0`
          }`
        )}
      >
        <Menu list={menu} />
      </div>
    </div>
  );
};
