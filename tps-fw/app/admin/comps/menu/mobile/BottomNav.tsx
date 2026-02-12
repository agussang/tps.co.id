import { FC } from "react";
import { IBottomNav } from "../../typing";
import { BottomNavItem } from "./BottomNavItem";
import { useLocal } from "@/utils/use-local";

export const BottomNav: FC<{ menu: IBottomNav[] }> = ({ menu }) => {
  const local = useLocal({
    menu_selected: null as string | null,
  });

  const onClick = (e: string) => {
    local.menu_selected = e;
    local.render();
  };

  return (
    <div className={cx(`c-flex c-flex-1 c-justify-between c-px-2`)}>
      {menu.map((item, i) => {
        const { label, activeIcon, inActiveIcon, url } = item;
        let is_active = false;
        if (local.menu_selected) {
          is_active = local.menu_selected === item.url;
        } else {
          is_active = i === 0;
        }

        return (
          <BottomNavItem is_active={is_active} label={label} activeIcon={activeIcon} inActiveIcon={inActiveIcon} url={url} onClick={onClick} />
        );
      })}
    </div>
  );
};
