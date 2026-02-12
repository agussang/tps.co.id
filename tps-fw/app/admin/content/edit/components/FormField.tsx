import { FC, ReactNode } from "react";
import { AlertCircle, HelpCircle } from "lucide-react";
import type { FMLocal } from "lib/comps/form/typings";

export const FormField: FC<{
  label: string;
  name: string;
  fm: FMLocal;
  required?: boolean;
  helpText?: string;
  children: ReactNode;
  className?: string;
}> = ({ label, name, fm, required, helpText, children, className }) => {
  const errors = fm.error?.get?.(name) || [];
  const hasError = errors.length > 0;
  const field = fm.fields?.[name];
  const isFocused = field?.focused;

  return (
    <div className={cx("c-space-y-1.5", className)}>
      {/* Label Row */}
      <div className="c-flex c-items-center c-justify-between">
        <label
          className={cx(
            "c-flex c-items-center c-text-sm c-font-medium",
            hasError ? "c-text-red-600" : "c-text-gray-700"
          )}
        >
          {label}
          {required && <span className="c-text-red-500 c-ml-0.5">*</span>}
        </label>

        {/* Help Text */}
        {helpText && (
          <span className="c-flex c-items-center c-text-xs c-text-gray-400">
            <HelpCircle className="c-w-3 c-h-3 c-mr-1" />
            {helpText}
          </span>
        )}
      </div>

      {/* Field Content with animation */}
      <div
        className={cx(
          "c-relative",
          hasError &&
            css`
              animation: shake 0.3s ease-in-out;

              @keyframes shake {
                0%,
                100% {
                  transform: translateX(0);
                }
                25% {
                  transform: translateX(-4px);
                }
                75% {
                  transform: translateX(4px);
                }
              }
            `
        )}
      >
        {children}
      </div>

      {/* Error Messages */}
      {hasError && (
        <div className="c-flex c-items-start c-space-x-1.5 c-text-sm c-text-red-600">
          <AlertCircle className="c-w-4 c-h-4 c-mt-0.5 c-flex-shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
    </div>
  );
};

// Grid wrapper for multi-column layouts
export const FormFieldGrid: FC<{
  children: ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}> = ({ children, cols = 2, className }) => {
  const gridCols = {
    1: "c-grid-cols-1",
    2: "c-grid-cols-1 md:c-grid-cols-2",
    3: "c-grid-cols-1 md:c-grid-cols-2 lg:c-grid-cols-3",
  };

  return (
    <div className={cx("c-grid c-gap-4", gridCols[cols], className)}>
      {children}
    </div>
  );
};
