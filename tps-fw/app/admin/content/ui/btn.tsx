import { Popover } from "@/comps/custom/Popover";
import { useLocal } from "@/utils/use-local";
import { FC, ReactElement, ReactNode } from "react";

export const Btn: FC<{
  children: ReactNode;
  popover?: ReactElement;
  className?: string;
  outerClassName?: string;
  onClick?: () => void;
  variant?: "active" | "normal";
}> = ({ children, popover, className, outerClassName, onClick, variant }) => {
  const local = useLocal({ popover: { open: false } });
  const child = (
    <div
      className={cx(
        "c-font-xs c-border c-flex-1 c-text-center c-px-1 c-leading-5 c-cursor-pointer hover:c-border-blue-600 hover:c-bg-blue-600 hover:c-text-white",
        className,
        local.popover.open || variant === "active"
          ? "c-border-blue-600 c-bg-blue-600 c-text-white"
          : "c-bg-white "
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (popover) {
    return (
      <Popover
        content={popover}
        open={local.popover.open}
        onOpenChange={(e) => {
          local.popover.open = e;
          local.render();
        }}
      >
        <div className={cx("c-flex c-items-center c-h-full")}>{child}</div>
      </Popover>
    );
  }
  return (
    <div className={cx("c-flex c-items-center c-h-full", outerClassName)}>
      {child}
    </div>
  );
};
