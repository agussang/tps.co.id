import "app/css/build.css";
import { icons as icons_index } from "app/icons";
import "app/utils/init";
import { typer } from "app/utils/typer";
export const icons = icons_index;
export const _types = { icons: typer(icons) };
export * from "@/exports";
export { ContentForm } from "app/admin/content/edit/ContentForm";
export { detectMobileDesktop } from "app/admin/Layout";
export * from "app/admin/utils";
export * from "app/lib";
export * from "app/utils/content";
export * from "framer-motion";
export { getPathname } from "./lib/utils/pathname";

import { login } from "app/admin/actions/login";
import { ContentEdit } from "app/admin/content/edit/ContentEdit";
import { ContentEditHeader } from "app/admin/content/edit/ContentEditHeader";
import { FieldFile } from "app/admin/content/edit/field/file";
import { FieldRTE } from "app/admin/content/edit/field/rte";
import { QuillEditor } from "app/admin/content/edit/field/QuillEditor";
import { FormSection } from "app/admin/content/edit/components/FormSection";
import { FormField, FormFieldGrid } from "app/admin/content/edit/components/FormField";
import { ContentList } from "app/admin/content/list/ContentList";
import { ContentListTable } from "app/admin/content/list/ContentListTable";
import { ContentBreads } from "app/admin/content/ui/breads";
import { adminLang } from "app/admin/lang";
import { Layout } from "app/admin/Layout";
import { adminPreview } from "app/admin/preview";
import { StructureAdd } from "app/admin/structure/StructureAdd";
import { StructureEdit } from "app/admin/structure/StructureEdit";
import { StructureList } from "app/admin/structure/StructureList";
import { Dashboard } from "app/admin/dashboard/Dashboard";
import { PreviewBanner } from "app/frontend/PreviewBanner";
import { BeritaTerkiniSlider } from "app/frontend/slider/BeritaTerkini";
import { OurCustomerSlider } from "app/frontend/slider/OurCustomer";
import { userexport } from "app/admin/actions/userexport";

export const frontend = {
  BeritaTerkiniSlider,
  OurCustomerSlider,
  PreviewBanner,
};

export const admin = {
  Layout,
  Dashboard,
  ContentEdit,
  ContentEditHeader,
  ContentList,
  ContentListTable,
  ContentBreads,
  FieldFile,
  FieldRTE,
  QuillEditor,
  FormSection,
  FormField,
  FormFieldGrid,
  login,
  lang: adminLang,
  preview: adminPreview,
  StructureList,
  StructureAdd,
  StructureEdit,
  userexport
};
 