/**
 * API untuk serve static files dari frontend baru
 *
 * Route: /_static/frontend.js, /_static/frontend.js.map
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Path ke dist folder di tps-fw
// import.meta.dir = /Users/agus/tps.co.id/tps-core/tps/app/srv/api
// target = /Users/agus/tps.co.id/tps-fw/dist
const DIST_PATH = join(import.meta.dir, "../../../../../tps-fw/dist");

export const _ = {
  url: "/_static/**",
  raw: true,
  async api() {
    // @ts-ignore - this is bound to current context by serve-api.ts
    const req = this.req as Request;
    const url = new URL(req.url);

    // /_static/frontend.js -> frontend.js
    let filename = url.pathname.replace("/_static/", "");

    const allowedFiles = ["frontend.js", "frontend.js.map", "frontend.css"];
    if (!filename || !allowedFiles.includes(filename)) {
      return new Response("Not Found", { status: 404 });
    }

    const filepath = join(DIST_PATH, filename);

    if (!existsSync(filepath)) {
      return new Response("File not found: " + filename, { status: 404 });
    }

    const content = readFileSync(filepath, "utf-8");

    let contentType = "application/javascript";
    if (filename.endsWith(".map")) {
      contentType = "application/json";
    } else if (filename.endsWith(".css")) {
      contentType = "text/css";
    }

    return new Response(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
};
