import { RadixRouter, createRouter } from "radix3";
import { MODE } from "./mode";
const g = global as any;

const _config = {
  router: null as unknown as RadixRouter<any>,
  async init() {
    if (!this.router) {
      // this.router = createRouter();
      // const findRoutes = await db.router.findMany();
      // findRoutes.map((item, i) => {
      //   this.router.insert(item.url_pattern, {
      //     seo: item.seo,
      //     meta: item.meta,
      //   });
      // });
    }
  },
};
if (MODE === "dev" || !g.cmshub_config) {
  g.cmshub_config = _config;
}
export const config = g.cmshub_config as typeof _config;
