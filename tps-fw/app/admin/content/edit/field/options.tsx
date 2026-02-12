import { FMLocal, FieldLocal, FieldProp } from "lib/comps/form/typings";
import { Typeahead } from "lib/comps/ui/typeahead";
import { FC, useEffect } from "react";
import { structure } from "../../../../../typings/prisma";
import { adminLang } from "app/admin/lang";
import { useLocal } from "lib/utils/use-local";
import { FieldLoading } from "lib/exports";

export const FieldOptions: FC<{
  field: FieldLocal;
  fm: FMLocal;
  arg: FieldProp;
  st: structure;
}> = ({ field, fm, st }) => {
  const local = useLocal({ options: [] as any, loading: true });
  const value = fm.data[field.name];

  useEffect(() => {
    (async () => {
      const res: { text: string }[] = await db.$queryRaw`
        SELECT DISTINCT text 
          FROM content WHERE
           id_structure=uuid(${st.id}) AND 
           (lang = ${adminLang.current} OR lang = 'inherited')`;

      local.options = (res || [])
        .filter((e) => e.text)
        .map((e) => ({
          value: e.text,
          label: e.text,
        }));
      local.loading = false;
      local.render();
    })();
  }, [field.name]);

  if (local.loading) return <FieldLoading />;

  return (
    <>
      <Typeahead
        value={[value]}
        onChange={(v) => {
          fm.data[field.name] = v[0];
          local.render();
        }}
        allowNew
        mode="single"
        options={() => {
          return local.options;
        }}
      ></Typeahead>
    </>
  );
};
