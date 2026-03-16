declare module "app/srv/utils/permissions" {
    export interface Permission {
        can_view: boolean;
        can_add: boolean;
        can_edit: boolean;
        can_delete: boolean;
    }
    /**
     * Load all permissions for a role.
     * Returns Map<structureId, Permission>
     */
    export function loadRolePermissions(roleId: number): Promise<Map<string, Permission>>;
    /**
     * Get permission for a specific structure.
     * Superadmin always gets full access.
     */
    export function getPermission(roleName: string, structureId: string, permMap: Map<string, Permission>): Permission;
    /**
     * Check if user has specific permission on a structure.
     * Superadmin bypasses all checks.
     */
    export function hasPermission(roleName: string, structureId: string, action: keyof Permission, permMap: Map<string, Permission>): boolean;
}
declare module "app/srv/api/_tpsadmin_nested" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_page_section" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_user_delete" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_settings" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_role" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_role_permission" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_backend_session_check" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
        }): Promise<Response>;
    };
}
declare module "app/srv/utils/password-policy" {
    export interface PasswordPolicy {
        min_length: number;
        require_uppercase: boolean;
        require_lowercase: boolean;
        require_number: boolean;
        require_special: boolean;
        expiry_days: number;
        auto_deactivate_days: number;
    }
    export function getPasswordPolicy(): Promise<PasswordPolicy>;
    export function validatePassword(password: string, policy: PasswordPolicy): {
        valid: boolean;
        errors: string[];
    };
    export function isPasswordExpired(passwordChangedAt: Date | null, expiryDays: number): boolean;
    export function shouldAutoDeactivate(lastLogin: Date | null, autoDeactivateDays: number): boolean;
}
declare module "app/srv/api/_api_reset_password" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_backend_login" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "app/srv/components/AdminSidebar" {
    interface ContentStructure {
        id: string;
        title: string;
        path: string;
        count: number;
        sortIdx: number;
        folderId: string | null;
        folderName: string | null;
        folderSortIdx: number;
    }
    interface SidebarProps {
        activePage: "dashboard" | "content" | "pages" | "folders" | "users" | "roles" | "activity" | "settings" | "visitors" | "permissions";
        user: {
            username: string;
            role: {
                name: string;
            };
        };
        currentStructureId?: string;
        structures?: ContentStructure[];
        /** Structure IDs the user can view (undefined = show all, for superadmin) */
        viewableStructureIds?: Set<string>;
    }
    /**
     * Load all content structures grouped by folder
     * This should be called once and passed to AdminSidebar
     */
    export function loadSidebarStructures(): Promise<ContentStructure[]>;
    export function AdminSidebar({ activePage, user, currentStructureId, structures, viewableStructureIds, }: SidebarProps): string;
}
declare module "app/srv/api/_tpsadmin_roles" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_backend_logout" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_settings" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_users" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_folder_delete" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_edit" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_content_save" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_api_folder_order" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_folders" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_nested_item" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_export" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_karir" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_add" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_folder_save" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_role_permissions" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_role_delete" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_user" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_list" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_seed_test_page" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_forgot_password" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_pages" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/utils/jadwal-kapal" {
    /**
     * Fetch Jadwal Sandar Kapal dari WSDL
     */
    export function jadwalSandarKapal(): Promise<any[]>;
    /**
     * Fetch Jadwal Closing Kapal dari WSDL
     */
    export function jadwalClosingKapal(): Promise<any[]>;
}
declare module "app/srv/api/_frontend" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_reset_password" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/components/html" {
    /**
     * HTML Template Utilities untuk SSR
     */
    export function escapeHtml(str: string | null | undefined): string;
    export function img(path: string | null | undefined, width?: number): string;
    export function file(path: string | null | undefined): string;
    export function formatDate(dateStr: string | null | undefined): string;
    export function cn(...classes: (string | boolean | null | undefined)[]): string;
}
declare module "app/srv/components/sections/HeroSection" {
    export interface HeroSectionProps {
        title?: string;
        subtitle?: string;
        description?: string;
        image?: string;
        video?: string;
        ctaText?: string;
        ctaUrl?: string;
        ctaSecondaryText?: string;
        ctaSecondaryUrl?: string;
        overlay?: boolean;
        align?: 'left' | 'center' | 'right';
        height?: 'small' | 'medium' | 'large' | 'full';
    }
    export function HeroSection({ title, subtitle, description, image, video, ctaText, ctaUrl, ctaSecondaryText, ctaSecondaryUrl, overlay, align, height, }: HeroSectionProps): string;
}
declare module "app/srv/components/sections/ContentSection" {
    export interface ContentSectionProps {
        title?: string;
        subtitle?: string;
        content: string;
        align?: 'left' | 'center';
        background?: 'white' | 'gray' | 'blue';
        maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
    }
    export function ContentSection({ title, subtitle, content, align, background, maxWidth, }: ContentSectionProps): string;
}
declare module "app/srv/components/sections/ImageGallery" {
    export interface GalleryImage {
        image: string;
        caption?: string;
        alt?: string;
    }
    export interface ImageGalleryProps {
        title?: string;
        subtitle?: string;
        images: GalleryImage[];
        columns?: 2 | 3 | 4;
        gap?: 'small' | 'medium' | 'large';
        aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
        background?: 'white' | 'gray';
    }
    export function ImageGallery({ title, subtitle, images, columns, gap, aspectRatio, background, }: ImageGalleryProps): string;
}
declare module "app/srv/components/sections/CardGrid" {
    export interface CardItem {
        title: string;
        description?: string;
        icon?: string;
        image?: string;
        url?: string;
    }
    export interface CardGridProps {
        title?: string;
        subtitle?: string;
        cards: CardItem[];
        columns?: 2 | 3 | 4;
        style?: 'default' | 'bordered' | 'shadowed' | 'filled';
        background?: 'white' | 'gray' | 'blue';
        iconPosition?: 'top' | 'left';
    }
    export function CardGrid({ title, subtitle, cards, columns, style, background, iconPosition, }: CardGridProps): string;
}
declare module "app/srv/components/sections/FAQ" {
    export interface FAQItem {
        question: string;
        answer: string;
    }
    export interface FAQProps {
        title?: string;
        subtitle?: string;
        items: FAQItem[];
        background?: 'white' | 'gray';
        columns?: 1 | 2;
    }
    export function FAQ({ title, subtitle, items, background, columns, }: FAQProps): string;
}
declare module "app/srv/components/sections/CTA" {
    export interface CTAProps {
        title: string;
        description?: string;
        buttonText: string;
        buttonUrl: string;
        secondaryButtonText?: string;
        secondaryButtonUrl?: string;
        background?: 'blue' | 'dark' | 'gradient' | 'image';
        backgroundImage?: string;
        align?: 'left' | 'center';
    }
    export function CTA({ title, description, buttonText, buttonUrl, secondaryButtonText, secondaryButtonUrl, background, backgroundImage, align, }: CTAProps): string;
}
declare module "app/srv/components/sections/ContactForm" {
    export interface ContactFormField {
        name: string;
        label: string;
        type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
        placeholder?: string;
        required?: boolean;
        options?: {
            value: string;
            label: string;
        }[];
    }
    export interface ContactFormProps {
        title?: string;
        subtitle?: string;
        description?: string;
        fields?: ContactFormField[];
        submitText?: string;
        submitUrl?: string;
        successMessage?: string;
        background?: 'white' | 'gray';
        showContactInfo?: boolean;
        contactInfo?: {
            phone?: string;
            email?: string;
            address?: string;
        };
    }
    export function ContactForm({ title, subtitle, description, fields, submitText, submitUrl, successMessage, background, showContactInfo, contactInfo, }: ContactFormProps): string;
}
declare module "app/srv/components/sections/VideoEmbed" {
    export interface VideoEmbedProps {
        title?: string;
        subtitle?: string;
        description?: string;
        videoUrl: string;
        thumbnail?: string;
        background?: 'white' | 'gray' | 'dark';
        aspectRatio?: '16:9' | '4:3' | '21:9';
    }
    export function VideoEmbed({ title, subtitle, description, videoUrl, thumbnail, background, aspectRatio, }: VideoEmbedProps): string;
}
declare module "app/srv/components/sections/Tabs" {
    export interface TabItem {
        label: string;
        content: string;
        icon?: string;
    }
    export interface TabsProps {
        title?: string;
        subtitle?: string;
        tabs: TabItem[];
        background?: 'white' | 'gray';
        style?: 'underline' | 'pills' | 'boxed';
        defaultTab?: number;
    }
    export function Tabs({ title, subtitle, tabs, background, style, defaultTab, }: TabsProps): string;
}
declare module "app/srv/components/sections/index" {
    /**
     * Section Components Export
     * All dynamic page section components
     */
    export { HeroSection } from "app/srv/components/sections/HeroSection";
    export type { HeroSectionProps } from "app/srv/components/sections/HeroSection";
    export { ContentSection } from "app/srv/components/sections/ContentSection";
    export type { ContentSectionProps } from "app/srv/components/sections/ContentSection";
    export { ImageGallery } from "app/srv/components/sections/ImageGallery";
    export type { ImageGalleryProps, GalleryImage } from "app/srv/components/sections/ImageGallery";
    export { CardGrid } from "app/srv/components/sections/CardGrid";
    export type { CardGridProps, CardItem } from "app/srv/components/sections/CardGrid";
    export { FAQ } from "app/srv/components/sections/FAQ";
    export type { FAQProps, FAQItem } from "app/srv/components/sections/FAQ";
    export { CTA } from "app/srv/components/sections/CTA";
    export type { CTAProps } from "app/srv/components/sections/CTA";
    export { ContactForm } from "app/srv/components/sections/ContactForm";
    export type { ContactFormProps, ContactFormField } from "app/srv/components/sections/ContactForm";
    export { VideoEmbed } from "app/srv/components/sections/VideoEmbed";
    export type { VideoEmbedProps } from "app/srv/components/sections/VideoEmbed";
    export { Tabs } from "app/srv/components/sections/Tabs";
    export type { TabsProps, TabItem } from "app/srv/components/sections/Tabs";
    /**
     * Section type mapping for dynamic rendering
     */
    export const SECTION_TYPES: {
        readonly hero: "HeroSection";
        readonly content: "ContentSection";
        readonly gallery: "ImageGallery";
        readonly cards: "CardGrid";
        readonly faq: "FAQ";
        readonly cta: "CTA";
        readonly form: "ContactForm";
        readonly video: "VideoEmbed";
        readonly tabs: "Tabs";
    };
    export type SectionType = keyof typeof SECTION_TYPES;
}
declare module "app/srv/api/_tpsadmin_pages_edit" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_static" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "app/srv/api/_api_page_delete" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_visitors" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_dashboard" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_login" {
    /**
     * TPS Admin Login Page (SSR Standalone)
     * Route: /backend/tpsadmin
     */
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_structure_assign_folder" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "app/srv/utils/page-builder" {
    import { type SectionType } from "app/srv/components/sections/index";
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
    export function findPageByUrl(pathname: string): Promise<PageStructure | null>;
    /**
     * Load page content and sections
     */
    export function loadPageContent(structurePath: string, lang?: string): Promise<Record<string, any>>;
    /**
     * Load header data (menu, logo, shortcuts)
     */
    export function loadHeaderData(lang?: string): Promise<any>;
    /**
     * Load footer data
     */
    export function loadFooterData(lang?: string): Promise<any>;
    /**
     * Render a section based on its type
     */
    export function renderSection(type: SectionType, data: Record<string, any>): string;
    /**
     * Load section content directly by structure IDs
     * This is used for new-style dynamic pages where content is linked directly to structure
     */
    export function loadSectionContent(sectionId: string, lang?: string): Promise<Record<string, any>>;
    /**
     * Get all dynamic pages for admin
     */
    export function getAllDynamicPages(): Promise<PageStructure[]>;
}
declare module "app/srv/api/_dynamic_page" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
    /**
     * Standalone function to check if a URL is a dynamic page
     * Called from create.ts before the main handler
     */
    export function serveDynamicPage(url: URL, req: Request): Promise<Response | null>;
}
declare module "app/srv/api/_api_content_delete" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_activity" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_tpsadmin_forgot_password" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_role_menu" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "app/srv/api/_api_page_save" {
    export const _: {
        url: string;
        raw: boolean;
        api(this: {
            req: Request;
            _url: URL;
        }): Promise<Response>;
    };
}
declare module "pkgs/api/_auth" {
    export const localLogin: (req: Request) => Promise<Response | null>;
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "pkgs/api/_deploy" {
    export const _: {
        url: string;
        api(action: ({
            type: "check";
        } | {
            type: "db-update";
            url: string;
        } | {
            type: "db-pull";
        } | {
            type: "db-gen";
        } | {
            type: "db-ver";
        } | {
            type: "db-sync";
            url: string;
        } | {
            type: "restart";
        } | {
            type: "domain-add";
            domain: string;
        } | {
            type: "domain-del";
            domain: string;
        } | {
            type: "deploy-del";
            ts: string;
        } | {
            type: "deploy";
            dlurl: string;
        } | {
            type: "deploy-status";
        } | {
            type: "redeploy";
            ts: string;
        }) & {
            id_site: string;
        }): Promise<any>;
    };
    export const downloadFile: (url: string, filePath: string, progress?: (rec: number, total: number) => void) => Promise<boolean>;
}
declare module "pkgs/api/_upload" {
    export const _: {
        url: string;
        raw: boolean;
        api(body: any): Promise<Response>;
    };
}
declare module "pkgs/utils/dir" {
    export const dir: (path: string) => string;
}
declare module "app/db/db" {
    
}
declare module "pkgs/utils/prod-index" {
    export const prodIndex: (site_id: string, prasi: {
        page_id?: string;
        params?: any;
    }) => {
        head: string[];
        body: string[];
        render(): string;
    };
}
declare module "pkgs/utils/global" {
    import { Server, WebSocketHandler } from "bun";
    import { Logger } from "pino";
    import { RadixRouter } from "radix3";
    
    import { Database } from "bun:sqlite";
    type SingleRoute = {
        url: string;
        args: string[];
        raw: boolean;
        fn: (...arg: any[]) => Promise<any>;
        path: string;
    };
    export type SinglePage = {
        id: string;
        url: string;
        name: true;
        content_tree: any;
        is_default_layout: true;
    };
    type PrasiServer = {
        ws?: WebSocketHandler<{
            url: string;
        }>;
        http: (arg: {
            url: {
                raw: URL;
                pathname: string;
            };
            req: Request;
            
            mode: "dev" | "prod";
            handle: (req: Request) => Promise<Response>;
            index: {
                head: string[];
                body: string[];
                render: () => string;
            };
            prasi: {
                page_id?: string;
            };
        }) => Promise<Response>;
        init?: (arg: {
            port: number;
        }) => Promise<void>;
    };
    export const g: {
        
        dburl: string;
        datadir: string;
        mode: "dev" | "prod";
        server: Server;
        log: Logger;
        firebaseInit: boolean;
        firebase: admin.app.App;
        notif: {
            db: Database;
        };
        api: Record<string, SingleRoute>;
        api_gen: {
            "load.json": string;
            "load.js.dev": string;
            "load.js.prod": string;
        };
        web: {
            site_id: string;
            current: number;
            deploying: null | {
                status: string;
                received: number;
                total: number;
            };
            deploys: number[];
            router: RadixRouter<SingleRoute>;
        };
        router: RadixRouter<SingleRoute>;
        port: number;
        frm: {
            js: string;
            etag: string;
        };
        cache: {
            br: Record<string, Uint8Array>;
            br_progress: {
                pending: Record<string, any>;
                running: boolean;
                timeout: any;
            };
            gz: Record<string, Uint8Array>;
        };
        createServer: (arg: PrasiServer & {
            api: any;
            db: any;
        }) => (site_id: string) => Promise<PrasiServer & {
            api: any;
            db: any;
        }>;
        deploy: {
            init: boolean;
            raw: any;
            router?: RadixRouter<{
                url: string;
                id: string;
            }>;
            layout: null | any;
            comps: Record<string, any>;
            pages: Record<string, {
                id: string;
                url: string;
                name: true;
                content_tree: any;
            }>;
            content: null | {
                layouts: SinglePage[];
                pages: SinglePage[];
                site: any;
                comps: {
                    id: string;
                    content_tree: true;
                }[];
                public: Record<string, any>;
                code: {
                    server: Record<string, string>;
                    site: Record<string, string>;
                    core: Record<string, string>;
                };
            };
            config: {
                site_id: string;
                deploy: {
                    ts: string;
                };
            };
            server: PrasiServer | null;
        };
    };
}
declare module "pkgs/server/prep-api-ts" {
    import { g } from "pkgs/utils/global";
    export const prepareAPITypes: () => Promise<void>;
    export const getApiEntry: () => any;
    export const getContent: (type: keyof typeof g.api_gen, url?: string) => Promise<string>;
}
declare module "pkgs/api/_prasi" {
    export const _: {
        url: string;
        api(): Promise<any>;
    };
}
declare module "pkgs/api/_font" {
    export const _: {
        url: string;
        api(): Promise<Response>;
    };
}
declare module "pkgs/api/_file" {
    export const _: {
        url: string;
        api(): Promise<Response>;
    };
}
declare module "pkgs/api/_notif" {
    export const _: {
        url: string;
        api(action: string, data: {
            type: "register";
            token: string;
            id: string;
        } | {
            type: "send";
            id: string;
            body: string;
            title: string;
            data?: any;
        }): Promise<string[] | {
            result: string;
            error?: undefined;
            totalDevice?: undefined;
        } | {
            error: string;
            result?: undefined;
            totalDevice?: undefined;
        } | {
            result: string;
            totalDevice: any;
            error?: undefined;
        }>;
    };
}
declare module "pkgs/api/_img" {
    export const _: {
        url: string;
        api(): Promise<Response>;
    };
}
declare module "pkgs/api/_api_frm" {
    export const _: {
        url: string;
        api(): Promise<void>;
    };
}
declare module "pkgs/api/_proxy" {
    export const _: {
        url: string;
        raw: boolean;
        api(): Promise<Response>;
    };
}
declare module "pkgs/api/_dbs" {
    export const _: {
        url: string;
        api(): Promise<any>;
    };
}
declare module "app/srv/exports" {
    export const _tpsadmin_nested: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_nested")>;
    };
    export const _api_page_section: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_page_section")>;
    };
    export const _api_user_delete: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_user_delete")>;
    };
    export const _api_settings: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_settings")>;
    };
    export const _api_role: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_role")>;
    };
    export const _api_role_permission: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_role_permission")>;
    };
    export const _backend_session_check: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_backend_session_check")>;
    };
    export const _api_reset_password: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_reset_password")>;
    };
    export const _backend_login: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("app/srv/api/_backend_login")>;
    };
    export const _tpsadmin_roles: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_roles")>;
    };
    export const _backend_logout: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_backend_logout")>;
    };
    export const _tpsadmin_settings: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_settings")>;
    };
    export const _tpsadmin_users: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_users")>;
    };
    export const _api_folder_delete: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("app/srv/api/_api_folder_delete")>;
    };
    export const _tpsadmin_edit: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_edit")>;
    };
    export const _api_content_save: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_content_save")>;
    };
    export const _tpsadmin_api_folder_order: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_api_folder_order")>;
    };
    export const _tpsadmin_folders: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_folders")>;
    };
    export const _api_nested_item: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_nested_item")>;
    };
    export const _api_export: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_export")>;
    };
    export const _karir: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_karir")>;
    };
    export const _tpsadmin_add: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_add")>;
    };
    export const _api_folder_save: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("app/srv/api/_api_folder_save")>;
    };
    export const _tpsadmin_role_permissions: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_role_permissions")>;
    };
    export const _api_role_delete: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_role_delete")>;
    };
    export const _api_user: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_user")>;
    };
    export const _tpsadmin_list: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_list")>;
    };
    export const _api_seed_test_page: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_seed_test_page")>;
    };
    export const _api_forgot_password: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_forgot_password")>;
    };
    export const _tpsadmin_pages: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_pages")>;
    };
    export const _frontend: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("app/srv/api/_frontend")>;
    };
    export const _tpsadmin_reset_password: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_reset_password")>;
    };
    export const _tpsadmin_pages_edit: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_pages_edit")>;
    };
    export const _static: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("app/srv/api/_static")>;
    };
    export const _api_page_delete: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_page_delete")>;
    };
    export const _tpsadmin_visitors: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_visitors")>;
    };
    export const _tpsadmin_dashboard: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_dashboard")>;
    };
    export const _tpsadmin_login: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_login")>;
    };
    export const _api_structure_assign_folder: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("app/srv/api/_api_structure_assign_folder")>;
    };
    export const _dynamic_page: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_dynamic_page")>;
    };
    export const _api_content_delete: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_content_delete")>;
    };
    export const _tpsadmin_activity: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_activity")>;
    };
    export const _tpsadmin_forgot_password: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_tpsadmin_forgot_password")>;
    };
    export const _api_role_menu: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_role_menu")>;
    };
    export const _api_page_save: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("app/srv/api/_api_page_save")>;
    };
    export const _auth: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_auth")>;
    };
    export const _deploy: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("pkgs/api/_deploy")>;
    };
    export const _upload: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("pkgs/api/_upload")>;
    };
    export const _prasi: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_prasi")>;
    };
    export const _font: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_font")>;
    };
    export const _file: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_file")>;
    };
    export const _notif: {
        name: string;
        url: string;
        path: string;
        args: string[];
        handler: Promise<typeof import("pkgs/api/_notif")>;
    };
    export const _img: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_img")>;
    };
    export const _api_frm: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_api_frm")>;
    };
    export const _proxy: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_proxy")>;
    };
    export const _dbs: {
        name: string;
        url: string;
        path: string;
        args: any[];
        handler: Promise<typeof import("pkgs/api/_dbs")>;
    };
}
