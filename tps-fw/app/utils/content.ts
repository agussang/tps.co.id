import get from "lodash.get";

const w = window as unknown as {
  ___content: any;
  ___header: any;
  ___footer: any;
  content_cache: any;
};
export const content = function (path: string) {
  if (isEditor) {
    return `[${path}]`;
  }

  let href = location.href;
  if (location.href.startsWith("/prod")) {
    const patharr = location.href.split("/");
    href = location.href.substring(`/prod/${patharr[2]}`.length);
  }

  if (w.content_cache[location.href])
    return get(w.content_cache[location.href], path);
  return get(w.___content, path);
};

export const header = function (path: string) {
  if (isEditor) {
    return `[${path}]`;
  }

  return get(w.___header, path);
};

export const footer = function (path: string) {
  if (isEditor) {
    return `[${path}]`;
  }

  return get(w.___footer, path);
};
