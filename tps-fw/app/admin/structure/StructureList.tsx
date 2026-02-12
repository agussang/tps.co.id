import { useLocal } from "@/utils/use-local";
import { FC, useEffect } from "react";
import { structure } from "../query/structure";
import { structure as db_structure } from "../../../typings/prisma";
import { getPathname } from "@/utils/pathname";

export const list_local = {
  cur: null as null | db_structure,
  headers: [] as db_structure[],
  loading: true,
  cache: {} as Record<string, db_structure[]>,
  data: [] as any[],
};

export const StructureList: FC<{ local: typeof list_local }> = ({ local }) => {
  const config = useLocal({
    data: [] as db_structure[],
    timeout: null as any,
  });

  useEffect(() => {
    (async () => {
      config.data = await db.structure.findMany({
        orderBy: {
          path: "asc",
        },
      });

      config.render();
    })();
  }, []);

  const onAdd = async () => {
    navigate('/backend/tpsadmin/structur/3d776bbe-44d6-49cb-b60d-cf2ed5422f2d/add')
  }

  const onEdit = async (id: string | null) => {
    if (id) {
      return navigate(`/backend/tpsadmin/structur/3d776bbe-44d6-49cb-b60d-cf2ed5422f2d/edit/${id}`)
    }
  }
  const onDelete = async (path: string | null, id: string | null) => {
    if (confirm(`Yakin ingin menghapus ${path}`)) {
      if (id)
        await db.structure.delete({
          where: {
            id
          }
        })
        
      return navigate(`/backend/tpsadmin/structur/3d776bbe-44d6-49cb-b60d-cf2ed5422f2d`)
    }
  }

  return (
    <div className="c-mx-8">
      <div onClick={onAdd}>Add</div>
      <table className="c-border-separate c-border-spacing-2 c-border c-border-slate-400">
        <thead>
          <tr className="">
            <th className="c-border c-border-slate-300">No</th>
            {/* <th>ID</th> */}
            <th className="c-border c-border-slate-300">Title</th>
            <th className="c-border c-border-slate-300">Path</th>
            <th className="c-border c-border-slate-300">Parent</th>
            <th className="c-border c-border-slate-300">Index</th>
            <th className="c-border c-border-slate-300">Multiple</th>
            <th className="c-border c-border-slate-300">Type</th>
            <th className="c-border c-border-slate-300">Dept</th>
            <th className="c-border c-border-slate-300">Status</th>
            <th className="c-border c-border-slate-300">Required</th>
            <th className="c-border c-border-slate-300">Visible</th>
            <th className="c-border c-border-slate-300">Translate</th>
            <th className="c-border c-border-slate-300">Action</th>
          </tr>
        </thead>
        <tbody>
          {config.data.map((structure, i) => {
            return (
              <tr key={i} className="c-border">
                <td className="c-border c-border-slate-300">{`${i + 1}.`}</td>
                {/* <td>{structure.id}</td> */}
                <td className="c-border c-border-slate-300">{structure.title}</td>
                <td className="c-border c-border-slate-300">{structure.path}</td>
                <td className="c-border c-border-slate-300">{structure.parent}</td>
                <td className="c-border c-border-slate-300">{structure.indexs ? 'y' : 'n'}</td>
                <td className="c-border c-border-slate-300">{structure.multiple ? 'y' : 'n'}</td>
                <td className="c-border c-border-slate-300">{structure.type}</td>
                <td className="c-border c-border-slate-300">{structure.depth}</td>
                <td className="c-border c-border-slate-300">{structure.status}</td>
                <td className="c-border c-border-slate-300">{structure.required ? 'y' : 'n'}</td>
                <td className="c-border c-border-slate-300">{structure.visible ? 'y' : 'n'}</td>
                <td className="c-border c-border-slate-300">{structure.translate ? 'y' : 'n'}</td>
                <td className="c-border c-border-slate-300 c-flex c-space-x-2">
                  <div onClick={() => onEdit(structure.id)}>Edit</div>
                  <div onClick={() => onDelete(structure.path, structure.id)}>Delete</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
