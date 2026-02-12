import { FC, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocal } from "@/utils/use-local";

export const FormSection: FC<{
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}> = ({
  title,
  icon,
  children,
  defaultOpen = true,
  collapsible = true,
  className,
}) => {
  const local = useLocal({ open: defaultOpen });

  return (
    <div
      className={cx(
        "c-bg-white c-border c-rounded-lg c-overflow-hidden c-shadow-sm",
        className
      )}
    >
      {/* Section Header */}
      <div
        className={cx(
          "c-flex c-items-center c-px-4 c-py-3 c-border-b c-bg-gray-50",
          collapsible &&
            "c-cursor-pointer hover:c-bg-gray-100 c-transition-colors c-select-none"
        )}
        onClick={() => {
          if (collapsible) {
            local.open = !local.open;
            local.render();
          }
        }}
      >
        {/* Icon */}
        {icon && <span className="c-mr-2 c-text-gray-500">{icon}</span>}

        {/* Title */}
        <h3 className="c-font-semibold c-text-gray-700 c-flex-1 c-text-sm">
          {title}
        </h3>

        {/* Collapse indicator */}
        {collapsible && (
          <span className="c-text-gray-400 c-transition-transform c-duration-200">
            {local.open ? (
              <ChevronDown className="c-w-4 c-h-4" />
            ) : (
              <ChevronRight className="c-w-4 c-h-4" />
            )}
          </span>
        )}
      </div>

      {/* Section Content */}
      <div
        className={cx(
          "c-transition-all c-duration-200 c-ease-in-out",
          local.open
            ? "c-max-h-[2000px] c-opacity-100"
            : "c-max-h-0 c-opacity-0 c-overflow-hidden"
        )}
      >
        <div className="c-p-4 c-space-y-4">{children}</div>
      </div>
    </div>
  );
};
