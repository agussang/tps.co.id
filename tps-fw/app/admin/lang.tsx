import { getPathname } from "lib/exports";

export const w = (typeof window === "undefined" ? {} : window) as unknown as {
  admin_lang: string;
  prasiContext: { render: () => void };
};

export const adminLang = {
  default: "id",
  get current() {
    return w.admin_lang || localStorage.admin_lang || "id";
  },
  set(lang: string) {
    w.admin_lang = lang;
    localStorage.admin_lang = lang;
  },
  Switcher() {
    const hash: any = {};
    for (const h of location.hash.split("#")) {
      if (h) {
        const [key, value] = h.split("=");
        hash[key] = value;
      }
    }

    if (
      !!hash.parent ||
      getPathname().startsWith("/backend/tpsadmin/content/edit")
    )
      return (
        <div
          className={cx(
            "c-bg-blue-50 00 c-p-1 c-flex c-items-stretch c-text-xs",
            css`
              border-radius: 3px;
              height: 29px;
            `
          )}
        >
          <div
            className={cx(
              "c-uppercase c-border c-border-blue-300 c-px-2 c-flex c-items-center",
              css`
                border-radius: 3px;
              `
            )}
          >
            {adminLang.current}
          </div>
        </div>
      );
    return (
      <div
        className={cx(
          "c-bg-blue-50 c-p-1 c-flex c-items-stretch c-text-xs",
          css`
            border-radius: 3px;
            height: 29px;
          `
        )}
      >
        {["id", "en"].map((e) => {
          return (
            <div
              className={cx(
                "c-uppercase c-px-2 c-cursor-pointer c-flex c-items-center",
                css`
                  border-radius: 3px;
                `,
                adminLang.current === e && "c-bg-blue-800 c-text-white"
              )}
              onClick={() => {
                w.admin_lang = e;
                localStorage.admin_lang = e;
                w.prasiContext.render();
              }}
              key={e}
            >
              {e}
            </div>
          );
        })}
      </div>
    );
  },
};
