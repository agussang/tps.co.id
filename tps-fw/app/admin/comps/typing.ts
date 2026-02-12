import { ReactElement } from "react";

const roles = ["admin", "moderator"] as Array<string>;

type IRole = (typeof roles)[number];
type IItem = {
  label: string;
  icon?: ReactElement;
  url: string;
};
type IMenuItem = {
  label: string;
  icon?: ReactElement;
  url: string | Array<string>;
  position?: string;
  items?: IItem[];
};

type IMenu = Record<IRole, IMenuItem[]>;

type ISession = {
  id: string;
  name: string;
  roles: string;
  image: ReactElement | string
}

type IBottomNav = {
  label: string;
  activeIcon?: ReactElement;
  inActiveIcon?: ReactElement;
  url: string;
}

export { IMenu, IMenuItem, IItem, ISession, IBottomNav };
