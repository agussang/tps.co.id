import { FC, ReactElement } from "react";
import { IMenuItem } from "../typing";
import { icon as defaultIcon } from "@/comps/icon";

export const MenuItem: FC<{
  icon?: ReactElement;
  label: string;
  is_active?: boolean;
  url: string | Array<string>;
  items?: IMenuItem[];
  className: string;
  onClick: (e: string | Array<string>) => void;
  renderMenuItem?: (items: IMenuItem[]) => any
}> = ({ icon, label, is_active = false, url, items, className, onClick, renderMenuItem }) => {
  

  return (
    <div
      className={cx(`c-flex c-flex-col ${is_active ? `c-bg-[#F9F9F9]` : ``}`)}
    >
      <div
        className={cx(
          ...className,
          `c-z-20 c-flex c-pl-4 c-pr-1 c-py-2 c-items-center c-transition-all c-cursor-pointer c-justify-between c-w-full hover:c-underline ${
            is_active ? `c-border-l-[7px] c-border-l-[#044792] c-bg-[#f8fafe]` : `c-text-gray-400`
          }`
        )}
        onClick={() => {
          if (typeof onClick === "function") onClick(url);
        }}
      >
        <div className={cx(`c-flex c-space-x-2`)}>
          <div>{icon}</div>
          <div className={cx(``)}>{label}</div>
        </div>
        {items && <div>{is_active ? defaultIcon.down : defaultIcon.right}</div>}
      </div>
      {items && (
        <div className={cx(`c-z-10 c-transition-all c-duration-300 c-ease-in-out ${is_active ? `c-opacity-100 c-delay-100` : `c-h-0 c-delay-0 opacity-0`}`)}>
          {renderMenuItem && renderMenuItem(items)}
        </div>
      )}
    </div>
  );
};
