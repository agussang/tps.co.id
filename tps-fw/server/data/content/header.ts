import { PrasiArg } from "server/type";
import { headerMenu } from "../headermenu";
import { headerShortCut } from "../headershortcut";

let existing = { config: null as any };

export const contentHeader = async (lang: string, arg?: PrasiArg) => {
  if (!existing.config) {
    existing.config = await db.config.findFirst({
      select: {
        lang: true,
        logo: true,
        file: {
          select: {
            path: true,
          },
        },
      },
    });
  }
  const config = existing.config;

  const langs = ((config?.lang || []) as any[]).map((e, idx) => {
    return { ...e, default: idx === 0 };
  });
  const ui_lang: any = {};
  for (const l of langs) {
    if (!ui_lang[l.label]) ui_lang[l.label] = l;
  }

  return {
    logo: config?.file.path,
    menu: await headerMenu(lang, "menu"),
    shortcut: await headerShortCut(lang, "shortcut_menu"),
    langs: langs,
    lang: Object.values(ui_lang),
  };
};
