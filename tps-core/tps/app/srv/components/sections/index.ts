/**
 * Section Components Export
 * All dynamic page section components
 */

export { HeroSection } from './HeroSection';
export type { HeroSectionProps } from './HeroSection';

export { ContentSection } from './ContentSection';
export type { ContentSectionProps } from './ContentSection';

export { ImageGallery } from './ImageGallery';
export type { ImageGalleryProps, GalleryImage } from './ImageGallery';

export { CardGrid } from './CardGrid';
export type { CardGridProps, CardItem } from './CardGrid';

export { FAQ } from './FAQ';
export type { FAQProps, FAQItem } from './FAQ';

export { CTA } from './CTA';
export type { CTAProps } from './CTA';

export { ContactForm } from './ContactForm';
export type { ContactFormProps, ContactFormField } from './ContactForm';

export { VideoEmbed } from './VideoEmbed';
export type { VideoEmbedProps } from './VideoEmbed';

export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

/**
 * Section type mapping for dynamic rendering
 */
export const SECTION_TYPES = {
  hero: 'HeroSection',
  content: 'ContentSection',
  gallery: 'ImageGallery',
  cards: 'CardGrid',
  faq: 'FAQ',
  cta: 'CTA',
  form: 'ContactForm',
  video: 'VideoEmbed',
  tabs: 'Tabs',
} as const;

export type SectionType = keyof typeof SECTION_TYPES;
