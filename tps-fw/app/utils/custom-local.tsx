import { useLocal } from "@/utils/use-local";
import { FC } from "react";

export const CustomLocal: FC<{
  PassProp: any;
  children: any;
  value: any;
  effect: (local: any) => Promise<void>;
  name: string;
}> = ({ children, PassProp, value, effect, name }) => {
  const local = useLocal(value, async () => {
    effect(local);
  });

  const res = {} as any;
  res[name] = local;

  return <PassProp {...res}>{children}</PassProp>;
};
