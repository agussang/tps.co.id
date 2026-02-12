import { FC } from "react";
import { Btn } from "../../ui/btn";
import { AutoHeightTextarea } from "@/comps/custom/AutoHeightTextarea";

export const CellUrl: FC<{ value: string }> = ({ value }) => {
  return (
    <Btn
      popover={
        <AutoHeightTextarea
          autoFocus
          className="c-outline-none c-p-2 c-min-w-[300px]"
          value={value}
          onFocus={(e) => {
            e.currentTarget.select();
          }}
        />
      }
    >
      URL
    </Btn>
  );
};
