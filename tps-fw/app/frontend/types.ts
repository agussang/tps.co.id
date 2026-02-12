// Types untuk public pages

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_desktop: string;
  image_mobile?: string;
  video?: string;
  url?: string;
  label_button?: string;
  order?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  children?: MenuItem[];
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string;
  publish_date: string;
  keyword?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  order?: string;
}

export interface PageContent {
  [key: string]: any;
}

export interface SiteConfig {
  site_id: string;
  domain: string;
  logo: string;
  name: string;
}
