import { query } from "app/admin/query/content"

export const loadListBreads = async (id_content: string) => {
    const res = query.parents(params.id, ['id_structure']);
    console.log(res);
}