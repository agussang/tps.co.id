import { apiContext } from "service-srv";
import { execQuery } from "utils/query";
const g = global as any;
export const _ = {
  url: "/_dbs/*",
  async api() {
    const { req, res } = apiContext(this);
    if (typeof g.db !== "undefined") {
      const body = req.params;

      // Map wildcard _ to table name for Prasi client compatibility
      if (body._ && !body.table) {
        body.table = body._;
      }
      if (!body.params) {
        body.params = [];
      }

      try {
        const result = await execQuery(body, g.db);
        return result;
      } catch (e: any) {
        console.log("_dbs error", body, e.message);
        res.sendStatus(500);
        res.send(e.message);
      }
    }
  },
};
