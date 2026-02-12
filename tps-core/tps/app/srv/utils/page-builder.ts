/**
 * Page Builder Utilities
 * Helper functions for dynamic page rendering
 */

import { g } from "utils/global";
import {
  HeroSection,
  ContentSection,
  ImageGallery,
  CardGrid,
  FAQ,
  CTA,
  ContactForm,
  VideoEmbed,
  Tabs,
  SECTION_TYPES,
  type SectionType,
} from "../components/sections";

export interface PageStructure {
  id: string;
  path: string;
  title: string;
  url_pattern: string;
  status: string;
  meta?: any;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    og_image?: string;
  };
}

export interface PageSection {
  id: string;
  type: SectionType;
  path: string;
  title: string;
  order: number;
  data: Record<string, any>;
}

export interface PageContent {
  structure: PageStructure;
  sections: PageSection[];
}

/**
 * Find a page by URL pattern
 */
export async function findPageByUrl(pathname: string): Promise<PageStructure | null> {
  if (!g.db) return null;

  try {
    const page = await g.db.structure.findFirst({
      where: {
        url_pattern: pathname,
        status: "published",
      },
    });

    if (!page) return null;

    return {
      id: page.id,
      path: page.path,
      title: page.title,
      url_pattern: page.url_pattern,
      status: page.status,
      meta: page.meta,
      seo: page.meta?.seo || {},
    };
  } catch (e) {
    console.error("[page-builder] Error finding page:", e);
    return null;
  }
}

/**
 * Load page content and sections
 */
export async function loadPageContent(
  structurePath: string,
  lang: string = "id"
): Promise<Record<string, any>> {
  if (!g.db) return {};

  try {
    // Find all child structures under this path
    const structures = await g.db.structure.findMany({
      where: {
        OR: [
          { path: structurePath },
          { path: { startsWith: `${structurePath}.` } },
        ],
      },
      orderBy: { sort_idx: "asc" },
    });

    if (structures.length === 0) return {};

    // Build structure map
    const structureMap: Record<string, any> = {};
    let rootId = "";

    for (const s of structures) {
      if (s.path === structurePath) {
        rootId = s.id;
      }
      structureMap[s.id] = {
        id: s.id,
        path: s.path,
        name: s.path.replace(`${structurePath}.`, ""),
        type: s.type,
        multiple: s.multiple,
      };
    }

    // Find root content
    const rootContent = await g.db.content.findFirst({
      where: {
        id_structure: rootId,
        id_parent: null,
        OR: [{ lang }, { lang: "inherited" }],
        status: { in: ["published", "inherited"] },
      },
    });

    if (!rootContent) return {};

    // Load all child content
    const childContent = await g.db.content.findMany({
      where: {
        id_parent: rootContent.id,
        OR: [{ lang }, { lang: "inherited" }],
        status: { in: ["published", "inherited"] },
      },
      include: { file: true },
    });

    // Build content object
    const result: Record<string, any> = { id: rootContent.id };

    for (const content of childContent) {
      const structure = structureMap[content.id_structure];
      if (!structure) continue;

      const fieldName = structure.name;
      let value: any = content.text;

      // Handle file type
      if (structure.type === "file" && content.file) {
        value = content.file.path || content.file.name;
      }

      // Handle multiple (repeating) items
      if (structure.multiple) {
        if (!result[fieldName]) result[fieldName] = [];

        // Load nested content for this item
        const nestedContent = await g.db.content.findMany({
          where: {
            id_parent: content.id,
            OR: [{ lang }, { lang: "inherited" }],
            status: { in: ["published", "inherited"] },
          },
          include: { file: true },
        });

        const nestedItem: Record<string, any> = { id: content.id };
        for (const nested of nestedContent) {
          const nestedStructure = structureMap[nested.id_structure];
          if (!nestedStructure) continue;

          const nestedFieldName = nestedStructure.name.replace(`${fieldName}.`, "");
          nestedItem[nestedFieldName] =
            nestedStructure.type === "file" && nested.file
              ? nested.file.path || nested.file.name
              : nested.text;
        }
        result[fieldName].push(nestedItem);
      } else {
        result[fieldName] = value;
      }
    }

    return result;
  } catch (e) {
    console.error("[page-builder] Error loading content:", e);
    return {};
  }
}

/**
 * Load header data (menu, logo, shortcuts)
 */
export async function loadHeaderData(lang: string = "id"): Promise<any> {
  if (!g.db) return { menu: [], shortcut: { menu: [] } };

  try {
    // Load menu
    const menuStructure = await g.db.structure.findFirst({
      where: { path: "menu" },
    });

    let menu: any[] = [];
    if (menuStructure) {
      const menuContent = await g.db.content.findMany({
        where: {
          id_structure: menuStructure.id,
          id_parent: null,
          OR: [{ lang }, { lang: "inherited" }],
          status: { in: ["published", "inherited"] },
        },
      });

      for (const m of menuContent) {
        const item = await loadPageContent(`menu`, lang);
        // Simplified menu loading
        const childContent = await g.db.content.findMany({
          where: { id_parent: m.id },
          include: { structure: true },
        });

        const menuItem: any = { id: m.id };
        for (const c of childContent) {
          if (c.structure) {
            const fieldName = c.structure.path.replace("menu.", "");
            menuItem[fieldName] = c.text;
          }
        }
        menu.push(menuItem);
      }
    }

    // Sort by order
    menu.sort((a, b) => (parseInt(a.order) || 99) - (parseInt(b.order) || 99));

    // Load shortcut menu
    let shortcutMenu: any[] = [];
    const shortcutStructure = await g.db.structure.findFirst({
      where: { path: "shortcut_menu" },
    });

    if (shortcutStructure) {
      const shortcutContent = await g.db.content.findMany({
        where: {
          id_structure: shortcutStructure.id,
          id_parent: null,
          OR: [{ lang }, { lang: "inherited" }],
          status: { in: ["published", "inherited"] },
        },
      });

      for (const s of shortcutContent) {
        const childContent = await g.db.content.findMany({
          where: { id_parent: s.id },
          include: { structure: true },
        });

        const item: any = { id: s.id };
        for (const c of childContent) {
          if (c.structure) {
            const fieldName = c.structure.path.replace("shortcut_menu.", "");
            item[fieldName] = c.text;
          }
        }
        shortcutMenu.push(item);
      }
    }

    // Load logo
    const labelStructure = await g.db.structure.findFirst({
      where: { path: "label" },
    });

    let logo = "";
    if (labelStructure) {
      const logoContent = await g.db.content.findFirst({
        where: {
          id_structure: labelStructure.id,
          OR: [{ lang }, { lang: "inherited" }],
        },
        include: { file: true },
      });

      if (logoContent) {
        const childContent = await g.db.content.findMany({
          where: { id_parent: logoContent.id },
          include: { structure: true, file: true },
        });

        for (const c of childContent) {
          if (c.structure?.path === "label.logo" && c.file) {
            logo = c.file.path || c.file.name;
          }
        }
      }
    }

    return {
      logo,
      menu,
      shortcut: { menu: shortcutMenu },
      lang,
    };
  } catch (e) {
    console.error("[page-builder] Error loading header:", e);
    return { menu: [], shortcut: { menu: [] }, lang };
  }
}

/**
 * Load footer data
 */
export async function loadFooterData(lang: string = "id"): Promise<any> {
  if (!g.db) return {};

  try {
    const footerStructure = await g.db.structure.findFirst({
      where: { path: "footer" },
    });

    if (!footerStructure) return {};

    const footerContent = await g.db.content.findFirst({
      where: {
        id_structure: footerStructure.id,
        id_parent: null,
        OR: [{ lang }, { lang: "inherited" }],
        status: { in: ["published", "inherited"] },
      },
    });

    if (!footerContent) return {};

    const childContent = await g.db.content.findMany({
      where: { id_parent: footerContent.id },
      include: { structure: true },
    });

    const footer: any = {};
    for (const c of childContent) {
      if (c.structure) {
        const fieldName = c.structure.path.replace("footer.", "");
        footer[fieldName] = c.text;
      }
    }

    // Load social media
    const sosmedStructure = await g.db.structure.findFirst({
      where: { path: "sosmed" },
    });

    let sosmed: any[] = [];
    if (sosmedStructure) {
      const sosmedContent = await g.db.content.findMany({
        where: {
          id_structure: sosmedStructure.id,
          id_parent: null,
          OR: [{ lang }, { lang: "inherited" }],
          status: { in: ["published", "inherited"] },
        },
      });

      for (const s of sosmedContent) {
        const childContent = await g.db.content.findMany({
          where: { id_parent: s.id },
          include: { structure: true, file: true },
        });

        const item: any = { id: s.id };
        for (const c of childContent) {
          if (c.structure) {
            const fieldName = c.structure.path.replace("sosmed.", "");
            item[fieldName] = c.structure.type === "file" && c.file
              ? c.file.path || c.file.name
              : c.text;
          }
        }
        sosmed.push(item);
      }
    }

    return {
      ...footer,
      sosmed,
    };
  } catch (e) {
    console.error("[page-builder] Error loading footer:", e);
    return {};
  }
}

/**
 * Render a section based on its type
 */
export function renderSection(type: SectionType, data: Record<string, any>): string {
  switch (type) {
    case "hero":
      return HeroSection({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        image: data.image,
        video: data.video,
        ctaText: data.cta_text,
        ctaUrl: data.cta_url,
        ctaSecondaryText: data.cta_secondary_text,
        ctaSecondaryUrl: data.cta_secondary_url,
        overlay: data.overlay !== false,
        align: data.align || "center",
        height: data.height || "medium",
      });

    case "content":
      return ContentSection({
        title: data.title,
        subtitle: data.subtitle,
        content: data.content || data.text || "",
        align: data.align || "left",
        background: data.background || "white",
        maxWidth: data.max_width || "medium",
      });

    case "gallery":
      return ImageGallery({
        title: data.title,
        subtitle: data.subtitle,
        images: (data.images || data.items || []).map((img: any) => ({
          image: img.image || img.src || img,
          caption: img.caption || "",
          alt: img.alt || img.caption || "",
        })),
        columns: data.columns || 3,
        gap: data.gap || "medium",
        aspectRatio: data.aspect_ratio || "video",
        background: data.background || "white",
      });

    case "cards":
      return CardGrid({
        title: data.title,
        subtitle: data.subtitle,
        cards: (data.cards || data.items || []).map((card: any) => ({
          title: card.title,
          description: card.description,
          icon: card.icon,
          image: card.image,
          url: card.url,
        })),
        columns: data.columns || 3,
        style: data.style || "shadowed",
        background: data.background || "white",
        iconPosition: data.icon_position || "top",
      });

    case "faq":
      return FAQ({
        title: data.title,
        subtitle: data.subtitle,
        items: (data.items || data.faqs || []).map((item: any) => ({
          question: item.question,
          answer: item.answer,
        })),
        background: data.background || "white",
        columns: data.columns || 1,
      });

    case "cta":
      return CTA({
        title: data.title,
        description: data.description,
        buttonText: data.button_text || data.cta_text || "Learn More",
        buttonUrl: data.button_url || data.cta_url || "#",
        secondaryButtonText: data.secondary_button_text,
        secondaryButtonUrl: data.secondary_button_url,
        background: data.background || "blue",
        backgroundImage: data.background_image,
        align: data.align || "center",
      });

    case "form":
      return ContactForm({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        fields: data.fields,
        submitText: data.submit_text,
        submitUrl: data.submit_url || "/api/contact",
        successMessage: data.success_message,
        background: data.background || "gray",
        showContactInfo: data.show_contact_info !== false,
        contactInfo: data.contact_info || {},
      });

    case "video":
      return VideoEmbed({
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        videoUrl: data.video_url || data.url || "",
        thumbnail: data.thumbnail,
        background: data.background || "white",
        aspectRatio: data.aspect_ratio || "16:9",
      });

    case "tabs":
      return Tabs({
        title: data.title,
        subtitle: data.subtitle,
        tabs: (data.tabs || data.items || []).map((tab: any) => ({
          label: tab.label || tab.title,
          content: tab.content,
          icon: tab.icon,
        })),
        background: data.background || "white",
        style: data.style || "underline",
        defaultTab: data.default_tab || 0,
      });

    default:
      return "";
  }
}

/**
 * Load section content directly by structure IDs
 * This is used for new-style dynamic pages where content is linked directly to structure
 */
export async function loadSectionContent(
  sectionId: string,
  lang: string = "id"
): Promise<Record<string, any>> {
  if (!g.db) return {};

  try {
    // Get all field structures under this section
    const fieldStructures = await g.db.structure.findMany({
      where: { parent: sectionId },
      orderBy: { sort_idx: "asc" },
    });

    const result: Record<string, any> = {};

    for (const field of fieldStructures) {
      // Get the field name from path (last segment)
      const fieldName = field.path.split(".").pop() || field.path;

      // Get content for this field
      const content = await g.db.content.findFirst({
        where: {
          id_structure: field.id,
          OR: [{ lang }, { lang: "inherited" }],
        },
        include: { file: true },
      });

      if (content) {
        if (field.type === "file" && content.file) {
          result[fieldName] = content.file.path || content.file.name;
        } else {
          result[fieldName] = content.text || "";
        }
      }
    }

    return result;
  } catch (e) {
    console.error("[page-builder] Error loading section content:", e);
    return {};
  }
}

/**
 * Get all dynamic pages for admin
 */
export async function getAllDynamicPages(): Promise<PageStructure[]> {
  if (!g.db) return [];

  try {
    const pages = await g.db.structure.findMany({
      where: {
        url_pattern: { not: "" },
        parent: null, // Only root structures
      },
      orderBy: { title: "asc" },
    });

    return pages.map((p) => ({
      id: p.id,
      path: p.path,
      title: p.title,
      url_pattern: p.url_pattern,
      status: p.status,
      meta: p.meta,
      seo: (p.meta as any)?.seo || {},
    }));
  } catch (e) {
    console.error("[page-builder] Error getting pages:", e);
    return [];
  }
}
