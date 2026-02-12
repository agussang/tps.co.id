import { getPathname } from "@/utils/pathname";
import { FC, ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { DesktopLayout } from "./layout/DesktopLayout";
import { get_user } from "lib/exports";
import { audit } from "./actions/audit";

const w = window as any;

export const detectMobileDesktop = function () {
  if (window.matchMedia("screen and (max-width: 768px)").matches) {
    w.isMobile = true;
    w.isDesktop = false;
    return "mobile";
  } else {
    w.isMobile = false;
    w.isDesktop = true;
    return "desktop";
  }
};

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const [_, set] = useState({});

  useEffect(() => {
    audit.init();
  }, [location.href]);

  useLayoutEffect(() => {
    if (!isEditor) {
      window.addEventListener("resize", detectMobileDesktop);
      return () => {
        window.removeEventListener("resize", detectMobileDesktop);
      };
    } else {
      const el = document.querySelector(".main-editor-content");

      if (el) {
        const rx = new ResizeObserver(detectMobileDesktop);
        rx.observe(el);
        return () => {
          rx.disconnect();
        };
      }
    }
  }, [isMobile, isDesktop]);

  detectMobileDesktop();

  const no_layout = ["/backend/tpsadmin/login", "/backend/tpsadmin"];

  if (no_layout.includes(getPathname())) return children;

  preload([
    "/backend/tpsadmin/content/list/_",
    "/backend/tpsadmin/content/edit/_",
  ]);

  return <DesktopLayout children={children} />;
};
