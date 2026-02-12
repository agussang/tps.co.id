export const isValidUrl = async (url: string) => {
  try {
    if (new URL(url)) {
      return true;
    }
  } catch (error) {
    return false;
  }
};

export const isValidEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};

export const prefixLang = (_href: string) => {
  const langs: { url: string }[] = (window as any).___header
    ? (window as any).___header.langs.filter((e: any) => e)
    : [];

  let pathname = location.pathname;
  let base = "";
  if (
    location.pathname.startsWith("/prod") &&
    _href &&
    !_href.startsWith("/prod")
  ) {
    const patharr = location.pathname.split("/");
    pathname = "/" + patharr.slice(3).join("/");
    base = `/prod/${patharr[2]}`;
  }

  const parts = pathname.split("/").filter((e: string) => e);
  if (langs.find((e) => e.url === parts[0])) {
    const lang = parts.shift();
    if (!_href.startsWith(`/${lang}`)) {
      return `/${lang}${_href}`;
    } else {
      return;
    }
  }
  return `${base}${_href}`;
};

export const truncateString = (
  str: string,
  length: number,
  separator: string
) => {
  // https://stackoverflow.com/q/1199352
  // https://github.com/Maggi64/moderndash/issues/155
  // https://lodash.com/docs/4.17.15#truncate

  if (str.length <= length) {
    return str;
  }

  let maxLength = length - separator.length;
  if (maxLength < 0) {
    maxLength = 0;
  }
  const subString = str.slice(
    0,
    // FYI .slice() is OK if maxLength > text.length
    maxLength
  );

  return subString + separator;
};
