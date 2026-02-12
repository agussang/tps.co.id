import {
  dirAsync,
  exists,
  existsAsync,
  read,
  removeAsync,
  writeAsync,
} from "fs-jetpack";
import { dir } from "./dir";
import { g } from "./global";
import { gunzipAsync } from "./gzip";
import { createRouter } from "radix3";
import { prodIndex } from "./prod-index";
import { startBrCompress } from "./br-load";

const decoder = new TextDecoder();
export const deploy = {
  async init() {
    await dirAsync(dir(`app/web/deploy`));

    if (!(await this.has_gz())) {
      await this.run();
    }

    await this.load(this.config.deploy.ts);
  },
  async load(ts: string) {
    console.log(`Loading site: ${this.config.site_id} ${ts}`);

    try {
      g.deploy.content = JSON.parse(
        decoder.decode(
          await gunzipAsync(
            new Uint8Array(
              await Bun.file(dir(`app/web/deploy/${ts}.gz`)).arrayBuffer()
            )
          )
        )
      );

      if (g.deploy.content) {
        g.cache = {
          br: {},
          gz: {},
          br_progress: {
            pending: {},
            running: false,
            timeout: null,
          },
        };
        startBrCompress();

        if (exists(dir("public"))) {
          await removeAsync(dir("public"));
          if (g.deploy.content.public) {
            await dirAsync(dir("public"));
            for (const [k, v] of Object.entries(g.deploy.content.public)) {
              await writeAsync(dir(`public/${k}`), v);
            }
          }
        }
        for (const page of g.deploy.content.layouts) {
          if (page.is_default_layout) {
            g.deploy.layout = page.content_tree;
            break;
          }
        }
        if (!g.deploy.layout && g.deploy.content.layouts.length > 0) {
          g.deploy.layout = g.deploy.content.layouts[0].content_tree;
        }

        g.deploy.router = createRouter();
        g.deploy.pages = {};
        for (const page of g.deploy.content.pages) {
          g.deploy.pages[page.id] = page;
          g.deploy.router.insert(page.url, page);
        }

        g.deploy.comps = {};
        for (const comp of g.deploy.content.comps) {
          g.deploy.comps[comp.id] = comp.content_tree;
        }

        if (g.deploy.content.code.server) {
          setTimeout(async () => {
            if (g.deploy.content) {
              delete require.cache[dir(`app/web/server/index.js`)];
              await removeAsync(dir(`app/web/server`));
              await dirAsync(dir(`app/web/server`));
              for (const [k, v] of Object.entries(
                g.deploy.content.code.server
              )) {
                await writeAsync(dir(`app/web/server/${k}`), v);
              }

              // Patch index.js to add full cache clearing and auto-clear on save
              if (await existsAsync(dir(`app/web/server/index.js`))) {
                let indexContent = await Bun.file(dir(`app/web/server/index.js`)).text();

                // Patch 1: Clear-cache endpoint to also clear in-memory cache
                indexContent = indexContent.replace(
                  `if (url2.pathname.startsWith("/clear-cache")) {
      const name2 = url2.pathname.substring("/clear-cache/".length);
      pathCache.clear(name2);
      return new Response("OK");
    }`,
                  `if (url2.pathname.startsWith("/clear-cache")) {
      const name2 = url2.pathname.substring("/clear-cache/".length);
      pathCache.clear(name2);
      // Also clear in-memory content cache
      if (name2) {
        for (const key of Object.keys(cache.content)) {
          if (key.includes(name2)) {
            delete cache.content[key];
          }
        }
      } else {
        cache.content = {};
        cache.structure = {};
        cache.query_deep = {};
      }
      return new Response("OK - all cache cleared");
    }`
                );

                // Patch 2: pathSave to auto-clear all cache after save
                indexContent = indexContent.replace(
                  `await pathCache.clear(
      struct_by_id[id_structure].path.split(".").shift() || ""
    );
  }
  return { status: "ok", id, structure: { name: result.structure_name } };
};`,
                  `await pathCache.clear(
      struct_by_id[id_structure].path.split(".").shift() || ""
    );
    // Auto-clear in-memory cache after save
    cache.content = {};
    cache.structure = {};
    cache.query_deep = {};
  }
  return { status: "ok", id, structure: { name: result.structure_name }, cacheCleared: true };
};`
                );

                await writeAsync(dir(`app/web/server/index.js`), indexContent);
              }

              if (await existsAsync(dir(`app/web/server/index.js`))) {
                const res = require(dir(`app/web/server/index.js`));
                if (res && typeof res.server === "object") {
                  g.deploy.server = res.server;
                }
              }

              if (g.server) {
                await g.deploy.server?.init?.({ port: g.server.port });
              } else {
                const inv = setInterval(async () => {
                  if (g.server) {
                    clearInterval(inv);
                    await g.deploy.server?.init?.({ port: g.server.port });
                  }
                }, 1000);
              }
            }
          }, 300);
        }
      }
    } catch (e) {
      console.log("Failed to load site", this.config.site_id);
    }
  },
  async run() {
    // Disabled: External download from prasi.avolut.com
    // Using local deployment files only (standalone mode)
    console.log(
      `Standalone mode: Using local deployment. External download disabled.`
    );
    return;
  },
  get config() {
    if (!g.deploy) {
      g.deploy = {
        comps: {},
        layout: null,
        pages: {},
        router: createRouter(),
        config: { deploy: { ts: "" }, site_id: "" },
        init: false,
        raw: null,
        content: null,
        server: null,
      };
    }

    if (!g.deploy.init) {
      g.deploy.init = true;
      g.deploy.raw = read(dir(`app/web/config.json`), "json");

      if (g.deploy.raw) {
        for (const [k, v] of Object.entries(g.deploy.raw)) {
          (g.deploy.config as any)[k] = v;
        }
      }
    }

    return g.deploy.config;
  },
  saveConfig() {
    return Bun.write(
      Bun.file(dir(`app/web/config.json`)),
      JSON.stringify(this.config, null, 2)
    );
  },
  has_gz() {
    if (this.config.deploy.ts) {
      return Bun.file(
        dir(`app/web/deploy/${this.config.deploy.ts}.gz`)
      ).exists();
    }

    return false;
  },
};
