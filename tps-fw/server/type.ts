import {} from "../typings/global";
import { Prisma } from "../typings/prisma";

export type PrasiArg = Parameters<PrasiServer["http"]>[0];

export interface IMeta {
  name: string;
  content: string;
  property: string;
}

export interface ICategory {
  label: string;
  value: string | number | boolean;
}

export interface ICategoryFasilitas {
  label: string;
  value: string | number | boolean;
  icon: string | null;
}

export interface IBerita {
  title: string;
  slug: string;
  image: string;
  publish_date: string;
  content: string;
  year: string;
  month: string;
  day: string;
  keyword: string;
  views: number;
}

export interface IDocument {
  title: string;
  media: string;
  content: string;
  publish_date: string;
  download_count: number;
  slug: string;
  year: string;
  month: string;
  day: string;
  keyword: string;
  category: string;
}

export interface IKontakKami {
  title: string;
  name: string;
  address: string;
  order: string;
  contact: Array<{
    label: string;
    value: string;
    extensions: string;
    type: string;
  }>;
}

export interface ILayanan {
  title: string;
  description: string;
  flow_caption: null | string;
  file: null | string;
  note: string;
}

export interface IMenu {
  label: string;
  url: string;
  icon: string;
}

export interface IMaklumat {
  title: string;
}

export interface IKebijakan {
  title: string;
  category: string;
  description: string;
  banner: null | string;
  footer_description: string;
}

export interface IFasilitas {
  title: string;
  slug: string;
  icon: string;
  publish_date: string;
  banner: string;
}

export interface IDireksi {
  nama: string;
  jabatan: string;
  foto_closeup: string;
  foto_full: string;
  description: string;
}

export interface IKomisaris {
  nama: string;
  jabatan: string;
  foto_closeup: string;
  foto_full: string;
  description: string;
}

export interface ITentangKami {
  title: string;
  quote: string;
  summary: string;
  content: string;
  banner: string;
  video_cover: string;
  video_url: null | string;
  tagline: string;
  heading: string;
  sub_heading: string;
}

export interface IVisi {
  title: string;
  banner: string;
}

export interface IMisi {
  title: string;
}

export interface IPerjalananKami {
  year: string;
  description: string;
}

export interface INomorPenting {
  title: string;
  order: string;
  contact: Array<{
    label: string;
    value: string;
    extensions: string;
    type: string;
  }>;
}

export interface ICSR {
  title: string;
  tagline: string;
  banner: string;
  content: string;
}

export interface IProgramCSR {
  title: string;
  banner: string;
  content: string;
}

export interface IParamsQuery {
  field: string;
  value: string;
  where: any;
}

export interface IParamsQueryChild { 
  path: string;
  where: Prisma.contentWhereInput
}