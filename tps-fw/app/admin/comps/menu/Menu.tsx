import { FC, useEffect } from "react";
import { IMenu, IMenuItem } from "../typing";
import { MenuItem } from "./MenuItem";
import { useLocal } from "@/utils/use-local";

export const Menu: FC<{ list: IMenuItem[] }> = ({ list }) => {
  const local = useLocal({
    menu_selected: null as string | null | Array<string>,
    menus: [] as IMenuItem[],
  });

  useEffect(() => {
    local.menus = list.map((item, i) => {
      const { label, icon, url, items } = item;

      if (items) {
        const urlItem = items.map((data, i) => {
          return data.url;
        });

        return { ...item, url: urlItem };
      }
      return item;
    });

    local.render();
  }, [list]);

  const onClick = (e: string | Array<string>) => {
    local.menu_selected = e;
    local.render();
  };

  const renderMenuItem = (items: IMenuItem[]) => {
    return (
      <>
        {items.map((item, i) => {
          let is_active = false;
          const { label, url, icon, items } = item;

          return (
            <div key={i} className={cx(`c-pl-6`)}>
              <MenuItem
                label={label}
                url={url}
                icon={icon}
                className=""
                items={items}
                is_active={is_active}
                onClick={onClick}
                renderMenuItem={
                  items && items.length > 0 ? renderMenuItem : () => null
                }
              />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className={cx(`c-flex c-flex-col c-space-y-2 c-overflow-y-hidden`)}>
      {local.menus.map((menu, i) => {
        let is_active = false;
        if (local.menu_selected) {
          is_active = local.menu_selected === menu.url;
        } else {
          // is_active = i === 0;
        }
        const { label, url, icon, items } = menu;
        return (
          <div key={i}>
            <MenuItem
              label={label}
              url={url}
              icon={icon}
              className=""
              items={items}
              is_active={is_active}
              onClick={onClick}
              renderMenuItem={
                items && items.length > 0 ? renderMenuItem : () => null
              }
            />
          </div>
        );
      })}
    </div>
  );
};
