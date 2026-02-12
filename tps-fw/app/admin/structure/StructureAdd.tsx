import { useLocal } from "@/utils/use-local";
import { FC, FormEvent, useEffect } from "react";
import { structure as db_structure } from "../../../typings/prisma";

interface IStructureColumns {
  column_name: string, data_type: string
}

export const StructureAdd: FC<{}> = ({ }) => {
  const local = useLocal({
    data: null as Partial<db_structure> | null,
    columns: [] as IStructureColumns[],
    timeout: null as any,
    loading: false as boolean,
    yes_no_select: ['true', 'false'],
  });

  useEffect(() => {
    (async () => {
      const columns = await db.$queryRaw`SELECT
      column_name,
      data_type
  FROM
      information_schema.columns
  WHERE
      table_name = 'structure'` as IStructureColumns[]

      if (columns) {
        local.columns = columns.filter((col, i) => !['id', 'meta', 'created_at', 'updated_at', 'id_folder', 'sort_idx', 'url_pattern', 'prasi_page_id', 'options', 'icon'].includes(col.column_name))
      }


      local.render();
    })();
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault()

    if(local.data) {
      const insert = await db.structure.create({
        data: local.data as any
      })

      if(insert)
        return navigate(`/backend/tpsadmin/structur/3d776bbe-44d6-49cb-b60d-cf2ed5422f2d/edit/${insert.id}`)
    }
  }

  const onChange = async (col: string, val: any) => {

    let value = val
    if (['true', 'false'].includes(val)) {
      value = val === 'false' ? false : true
    }

    if (val === '' || val.length === 0) {
      value = null
    }

    local.data = { ...local.data, [col]: value }


    local.render()
  }

  return (
    <div className="c-flex-1">
      <div className="c-px-2">Form Add</div>
      <form className="c-flex c-w-full c-flex-wrap c-flex-col c-space-y-8" onSubmit={(e) => onSave(e)}>
        <div className="c-flex c-w-full c-flex-wrap c-flex-rows">
          {local.columns && local.columns.map((item: IStructureColumns, i: number) => {
            const key = item.column_name

            let type = 'string' as 'string' | 'number' | 'options'
            let options = local.yes_no_select

            if (['depth'].includes(key)) {
              type = 'number'
            }

            if (['indexs', 'multiple', 'type', 'required', 'visible', 'status', 'translate'].includes(key)) {
              type = 'options'
            }

            if (key === 'type') {
              options = ['text', 'textarea', 'options', 'file', 'date', 'number']
            } else if (key === 'status') {
              options = ['draft', 'published', 'deleted']
            }



            return <div key={i} className="c-flex c-flex-col c-w-1/3 c-px-2 c-mt-4">
              <label className="c-capitalize c-font-bold c-text-sm">{key}</label>
              {type === 'options' && <><select name={`${key}`} id={`${key}`} className="c-flex c-border c-w-full c-py-2 c-px-2" onChange={(e) => {
                onChange(key, e.currentTarget.value)
              }}>
                <option value={``} key={i}>{`Select`}</option>
                {options.map((select, i) => {
                  return <option value={select} key={i}>{select}</option>
                })}
              </select></>}
              {type !== 'options' && <>
                <input type={type} className="c-flex c-border c-w-full c-py-2 c-px-2" onChange={(e) => {
                  onChange(key, type === 'string' ? e.target.value : parseInt(e.target.value))
                }} />
              </>}

            </div>
          })}
        </div>

        <button type="submit" className="c-px-4 c-py-4 c-border c-mx-2 c-bg-red-500 c-text-white">Simpan</button>
      </form>
    </div>
  );
};
