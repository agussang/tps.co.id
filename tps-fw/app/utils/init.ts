import { getPathname } from "../../lib/utils/pathname";

const w = window as any;
if (typeof w.isEditor === "undefined") w.isEditor = false;

const url = new URL(location.href);
let redirect = false;
if (url.hostname === "tps.co.id") {
  url.hostname = "www.tps.co.id";
  redirect = true;
}

if (url.hostname.includes("tps.co.id")) {
  if (url.protocol === "http:") {
    url.protocol = "https://";
    redirect = true;
  }
}

if (redirect) {
  location.href = url.toString();
}

if (!w.isEditor && !w.cmshub_nav_override) {
  w.cmshub_nav_override = true;

  if (!w.content_cache) {
    w.content_cache = {};
  }

  const nav = w.navigate;

  const formatUrl = (_href: string) => {
    let base = "";
    let pathname = getPathname();
    if (location.pathname.startsWith("/prod") && !_href.startsWith("/prod")) {
      const patharr = location.pathname.split("/");
      pathname = "/" + patharr.slice(3).join("/");
      base = `/prod/${patharr[2]}`;
    }

    const parts = pathname.split("/").filter((e: string) => e);
    if (langs.find((e) => e.url === parts[0])) {
      const lang = parts.shift();

      if (!_href.startsWith(`/${lang}`)) {
        const _parts = _href.split("/").filter((e) => e);
        if (langs.find((e) => e.url === _parts[0])) {
          return `${base}${_href}`;
        } else {
          return `${base}/${lang}${_href}`;
        }
      } else {
        return `${base}${_href}`;
      }
    }
    return `${base}${_href}`;
  };

  w.prasiContext.siteUrl = (path: string) => {
    if (path.startsWith("/_")) {
      return path;
    }
    return formatUrl(path);
  };
  const cmshub = {
    rendered: false,
  };

  const loadCMSContext = async (href: string, note: string) => {
    let base = "";
    if (location.pathname.startsWith("/prod")) {
      const patharr = location.pathname.split("/");
      base = `/prod/${patharr[2]}`;
    }

    let cache_key = href;
    if (href.startsWith(base)) {
      cache_key = href.substring(base.length);
    }

    if (!w.content_cache[cache_key]) {
      const res = await fetch(href);
      const text = await res.text();

      if (text.includes('<script id="content_script">')) {
        const content =
          text
            .split(`<script id="content_script">`)
            .pop()
            ?.split("/****/</script>")
            .shift() || "";

        const fn = new Function("window", content);

        const res: any = {};
        fn(res);
        if (res.___content) {
          (window as any).___content = res.___content;
          (window as any).content_cache[cache_key] = res.___content;
        }

        const page_id = text.split("page_id: ").pop()?.split(",").shift();
        if (page_id?.startsWith('"')) {
          eval(`window._prasi.page_id = ${page_id}`);
        } else {
          const path = getPathname() + href;
          const parts = path.split("/").filter((e) => e);
          const lang = parts.shift();
          if (langs.length > 0 && langs.find((e) => e.url === lang)) {
            nav(base + "/" + parts.join("/"));
            return false;
          }
        }
        return true;
      } else {
        // location.reload();
      }
    } else {
      w.___content = w.content_cache[cache_key];
      return true;
    }
  };

  w.navigateOverride = (href: string) => {
    // Force full page reload for karir page (uses custom rendering)
    if (href === "/karir" || href === "/career" || href.endsWith("/karir") || href.endsWith("/career")) {
      location.href = href;
      return null;
    }

    if (!getPathname().startsWith("/backend/tpsadmin")) {
      cmshub.rendered = true;

      loadCMSContext(baseurl(href), "nav").then(() => {
        history.pushState({ prevUrl: window.location.href }, "", baseurl(href));
        w.pathname = baseurl(href);

        if (w.prasiContext && w.prasiContext.render) {
          w.prasiContext.render();
        }

        if (location.search.includes("page")) {
          document.getElementsByClassName("main-content")[0]?.scrollTo(0, 0);
        }

        cmshub.rendered = false;
      });

      return null;
    }

    return baseurl(href);
  };

  w.prasiContext.popState = async () => {
    if (!cmshub.rendered) {
      if (!getPathname().startsWith("/backend/tpsadmin")) {
        await loadCMSContext(location.href, "popstate");
      }
      w.prasiContext.render();
    }
  };

  const langs: { url: string }[] = (window as any).___header
    ? (window as any).___header.langs.filter((e: any) => e)
    : [];

  // w.navigate = async (_href: string) => {
  //   let navigated = false;
  //   if (_href.startsWith("/")) {
  //     if (_href.startsWith("/backend/tpsadmin")) {
  //       nav(_href);
  //       return;
  //     }
  //     const href = formatUrl(_href);
  //     try {
  //       setTimeout(() => {
  //         if (!navigated) {
  //           navigated = true;
  //           nav(_href);
  //         }
  //       }, 1000);
  //       await loadCMSContext(href);

  //       document
  //         .getElementsByClassName("main-content")[0]
  //         ?.scrollTo(0, 0);

  //       if (!navigated) {
  //         navigated = true;
  //         nav(href);
  //       }
  //       return;
  //     } catch (e) {
  //       console.error(e);
  //       // location.href = href;
  //     }
  //   }

  //   if (!navigated) {
  //     navigated = true;
  //     nav(_href);
  //   }
  // };

  if (w.___content) {
    let pathname = getPathname();
    if (!w.content_cache[pathname]) {
      w.content_cache[pathname] = w.___content;
    }

    if (!w._prasi.page_id) {
      const parts = pathname.split("/").filter((e) => e);
      const lang = parts.shift();
      if (langs.find((e) => e.url === lang)) {
        const url = `/${lang}/${parts.join("/")}`;
        nav(url);
      }
    }
  }
}
