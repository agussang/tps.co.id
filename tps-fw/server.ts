import { pathCache } from "app/admin/query/path-cache";
import { g } from "server/global";
import { importLangRoute } from "server/import";
import { log } from "server/log";
import { route } from "server/route/route";
import { runRoute } from "server/route/run";
import type {} from "./typings/global";
import { pathSave } from "app/admin/query/path-save";

g.siteurl = (pathname: string) => {
  // Standalone mode: Always use tps.co.id
  if (!g.cmshub) {
    return `https://www.tps.co.id${pathname}`;
  }
  const url = new URL("https://www.tps.co.id");
  url.pathname = pathname;
  return url.toString();
};

export const server: PrasiServer = {
  async init({ port }) {
    console.log("CMSHUB Started ~ ", new Date());
  },
  async http(arg) {
    const { req, handle, url } = arg; 

    if (url.pathname === "/favicon.ico") {
      return new Response("NOT FOUND", { status: 404 });
    } 

    if (url.pathname.startsWith("/clear-cache")) {
      const name = url.pathname.substring("/clear-cache/".length);
      pathCache.clear(name);
      return new Response("OK");
    }
 
    if (url.pathname === "/backend/tpsadmin/clear-audit-log") {
      const res = await db.$queryRawUnsafe(`truncate logs`);
      return new Response(JSON.stringify(res));
    }

    if (url.pathname === "/post-audit-log" && req.method === "POST") {
      const log = await req.json();
      const data = {
        activity: JSON.stringify(log.activity),
        user: log.username,
        created_at: new Date(),
      };
      await db.logs.create({
        data,
      });
      return new Response("OK");
    }

    if (url.pathname === "/backend/api/del") {
      return new Response(JSON.stringify(await pathSave(await req.json())), {
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/backend/api/save") {
      return new Response(JSON.stringify(await pathSave(await req.json())), {
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/backend/api/login") {
      const res = await fetch("https://api.tps.co.id/api/ess/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: await req.text(),
      });

      return res;
    }

    
    if(url.pathname === "/") {
      console.log('Server to get profile IG');
      const username = `pttps_official`;
      const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
        "X-IG-App-ID": "936619743392459", // Common IG App ID (used by the web client)
        Referer: `https://www.instagram.com/${username}/`,
      };
      const iG = await fetch(url, { headers });

      // if (!iG.ok) {
      //   throw new Error(`HTTP error! Status: ${iG.statusText}`);
      // }
      let igJSON = await iG.json();
      console.log('IGJSON : ', igJSON);
    }

    if (!g.cmshub) {
      const base = new URL(url.raw);
      g.cmshub = {
        baseurl: `${base.protocol}//${base.host}`,
        lang: [],
        route: { status: "init" },
        studio: null,
        studio_out: "",
      };
      await route.init(arg);
    }

    if (url.pathname.startsWith("/_import")) {
      return await importLangRoute(arg);
    }

    if (url.pathname.startsWith("/file")) {
      const nurl = new URL(`http://localhost:3000${url.pathname}`);
      nurl.pathname =
        "/_file" + nurl.pathname.substring("/file".length).replace(/\~/gi, " ");

      return await fetch(nurl);
    }

    if (
      ["/_dbs", "/_prasi", "/_deploy", "/_upload", "/_file"].find((app_url) =>
        url.pathname.startsWith(app_url)
      )
    ) {
      return await handle(req);
    }

    log.start();


    const router = await runRoute(arg);

    if (router) {
      return router;
    }

    return await handle(req);
  },
};
