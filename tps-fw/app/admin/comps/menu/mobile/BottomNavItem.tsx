import { FC, ReactElement } from "react";

export const BottomNavItem: FC<{
  label: string;
  activeIcon?: ReactElement;
  inActiveIcon?: ReactElement;
  url: string;
  is_active: boolean;
  onClick: (e: string) => void;
}> = ({ label, activeIcon, inActiveIcon, url, is_active, onClick }) => {
  return (
    <div
      className={cx(
        `c-flex c-flex-col c-items-center c-justify-center c-py-1.5 c-cursor-pointer ${
          is_active ? `c-text-gray-800` : ``
        }`
      )}
      onClick={() => {
        if (typeof onClick === "function") onClick(url);
      }}
    >
      <div className={cx(``)}>{is_active ? activeIcon : inActiveIcon}</div>
      <div className={cx(`c-text-xs ${is_active ? `c-font-bold` : ``}`)}>
        {label}
      </div>
    </div>
  );
};
