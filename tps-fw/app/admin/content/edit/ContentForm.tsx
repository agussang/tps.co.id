import { adminLang } from "app/admin/lang";
import { BaseField } from "lib/comps/form/base/BaseField";
import { BaseForm } from "lib/comps/form/base/BaseForm";
import { FieldLoading } from "lib/comps/ui/field-loading";
import { useLocal } from "lib/utils/use-local";
import {
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  Image,
  Settings,
  List,
} from "lucide-react";
import { FC, useEffect } from "react";
import { toast } from "sonner";
import { validate } from "uuid";
import { getPathname } from "../../../..";
import { CellMultiple } from "../list/cell/multiple";
import { FieldFile } from "./field/file";
import { FieldOptions } from "./field/options";
import { FieldRTE } from "./field/rte";
import { QuillEditor } from "./field/QuillEditor";
import { EDLocal } from "./utils/edit-local";
import { sortStructure } from "./utils/sort-structure";
import { FieldTypeInput } from "lib/comps/form/field/type/TypeInput";
import { FormSection } from "./components/FormSection";
import { FormField, FormFieldGrid } from "./components/FormField";
import type { structure } from "../../../../typings/prisma";

// Toggle for new editor - set to false to use old FieldRTE
const USE_QUILL_EDITOR = true;

// Categorize fields by type for grouped layout
const categorizeFields = (structures: structure[]) => {
  const sorted = sortStructure(structures.filter((e) => e.visible));

  const basic: structure[] = [];
  const content: structure[] = [];
  const media: structure[] = [];
  const multiple: structure[] = [];

  for (const st of sorted) {
    if (st.multiple) {
      multiple.push(st);
    } else if (st.type === "file") {
      media.push(st);
    } else if (st.type === "textarea") {
      content.push(st);
    } else {
      basic.push(st);
    }
  }

  return { basic, content, media, multiple };
};

export const ContentForm: FC<{ local: EDLocal }> = ({ local }) => {
  const internal = useLocal({
    data: {} as any,
    loading: true,
  });

  useEffect(() => {
    internal.loading = true;
    internal.render();
    local.on_load(local).then((data) => {
      internal.data = {};
      internal.render();

      if (data) {
        for (const [k, v] of Object.entries(data)) {
          internal.data[k] = v;
        }
      }

      internal.loading = false;
      internal.render();
    });
  }, [getPathname(), params.id, adminLang.current, location.hash]);

  if (internal.loading) return <FieldLoading />;

  return (
    <BaseForm
      name="admin-form"
      data={internal.data}
      onSubmit={async ({ fm }) => {
        if (!fm) return true;
        toast.loading(
          <>
            <Loader2 className="c-h-4 c-w-4 c-animate-spin" />
            Menyimpan...
          </>
        );

        local.structures.map((st, i) => {
          if (st.type === "number") {
            const paths = Object.keys(fm.data);

            paths.map((path, i) => {
              if (`${local.root?.path}.${path}` === st.path) {
                const value = fm.data[path];
                fm.data[path] = value.toString().replace(/^0+|[.,]/g, "");
              }
            });
          }
        });

        if (
          local.root?.path &&
          ["press_release", "unduh_dokumen", "latest_news"].includes(
            local.root.path
          )
        ) {
          const publish_date = new Date(fm.data["publish_date"]);
          fm.data["year"] = publish_date.getFullYear().toString();
          fm.data["month"] = publish_date.getMonth().toString();
          fm.data["day"] = publish_date.getDay().toString();

          if (["press_release", "latest_news"].includes(local.root.path)) {
            fm.data["slug"] =
              fm.data["slug"] === "" || typeof fm.data["slug"] === "undefined"
                ? `${fm.data["title"].replace(/–/g, "").replace(/\s\s+/g, " ").replaceAll(" ", "-").replaceAll("%", "").toLowerCase()}-${createRandomString(7)}`
                : fm.data["slug"];
          } else {
            fm.data["slug"] =
              fm.data["slug"] === "" || typeof fm.data["slug"] === "undefined"
                ? `${createRandomString(7)}`
                : fm.data["slug"];

            if (typeof fm.data["category"] === "string") {
              fm.data["category"] = fm.data["category"].toLowerCase();
            }
          }
        } else {
          if (typeof fm.data["slug"] !== "undefined") {
            fm.data["slug"] = fm.data["slug"]
              .replaceAll(" ", "-")
              .toLowerCase();
          }
        }

        if (typeof fm.data["media"] !== "undefined") {
          if (typeof fm.data["media"] === "object") {
            fm.data["media"] = fm.data["media"].path
              ? fm.data["media"].path
              : "";
          }
        }

        const success = await local.save(local, fm);

        setTimeout(() => {
          toast.dismiss();

          if (!success) {
            toast.error(
              <div className="c-flex c-text-red-600 c-items-center">
                <AlertTriangle className="c-h-4 c-w-4 c-mr-1" />
                Menyimpan gagal, mohon benahi{" "}
                {Object.keys(fm.error?.list || {}).length} error diatas.
              </div>,
              {
                dismissible: true,
                className: css`
                  background: #ffecec;
                  border: 2px solid red;
                `,
              }
            );
          } else {
            toast.success(
              <div className="c-flex c-text-green-700 c-items-center">
                <Check className="c-h-4 c-w-4 c-mr-1 " />
                Data Tersimpan
              </div>,
              {
                className: css`
                  background: #e4ffed;
                  border: 2px solid green;
                `,
              }
            );
          }
        });

        return success || true;
      }}
    >
      {({ fm }) => {
        if (local.submit !== fm.submit) {
          local.submit = fm.submit;
          setTimeout(() => {
            local.render();
          });
        }

        // Categorize fields for grouped layout
        const categories = categorizeFields(local.structures);

        // Render a single field
        const renderField = (st: structure) => {
          const name = st.path?.split(".").pop() || "";
          if (!name) return null;
          if (st.id === local.root?.id) return null;
          if (st.multiple && !validate(params.id)) return null;

          return (
            <FormField
              key={st.path}
              label={st.title || name}
              name={name}
              fm={fm}
              required={st.required}
            >
              <BaseField
                name={name}
                label={st.title || name}
                fm={fm}
                required={st.required ? "y" : "n"}
                required_msg={() => `${st.title} tidak boleh kosong`}
              >
                {({ field }) => {
                  // File upload
                  if (st.type === "file") {
                    return (
                      <FieldFile fm={fm} name={field.name} st={st} key={st.path} />
                    );
                  }

                  // Multiple/repeating fields
                  if (st.multiple) {
                    return (
                      <div className="c-ml-2">
                        <CellMultiple
                          st={st}
                          row={{ id: params.id }}
                          lang={adminLang.current}
                        />
                      </div>
                    );
                  }

                  // Rich text editor
                  if (st.type === "textarea") {
                    if (USE_QUILL_EDITOR) {
                      return (
                        <QuillEditor fm={fm} name={field.name} st={st} key={st.path} />
                      );
                    } else {
                      return (
                        <FieldRTE
                          fm={fm}
                          name={field.name}
                          st={st}
                          key={st.path}
                          mode="inline"
                        />
                      );
                    }
                  }

                  // Dropdown/select
                  if (st.type === "options") {
                    return (
                      <FieldOptions fm={fm} field={field} arg={{} as any} st={st} />
                    );
                  }

                  // Default: text, date, number inputs
                  let sub_type: any = "text";
                  if (st.type === "date") {
                    sub_type = "date";
                  } else if (st.type === "number") {
                    sub_type = "money";
                  }

                  return (
                    <FieldTypeInput
                      fm={fm}
                      field={field}
                      arg={{} as any}
                      prop={{
                        type: "input",
                        sub_type,
                      }}
                    />
                  );
                }}
              </BaseField>
            </FormField>
          );
        };

        return (
          <div className="c-space-y-6 c-py-4 c-px-2 md:c-px-6 c-max-w-5xl c-mx-auto">
            {/* Basic Information Section */}
            {categories.basic.length > 0 && (
              <FormSection
                title="Informasi Dasar"
                icon={<Settings className="c-w-4 c-h-4" />}
                defaultOpen={true}
              >
                <FormFieldGrid cols={2}>
                  {categories.basic.map((st) => renderField(st))}
                </FormFieldGrid>
              </FormSection>
            )}

            {/* Content Section (Rich Text) */}
            {categories.content.length > 0 && (
              <FormSection
                title="Konten"
                icon={<FileText className="c-w-4 c-h-4" />}
                defaultOpen={true}
              >
                {categories.content.map((st) => renderField(st))}
              </FormSection>
            )}

            {/* Media Section (Files) */}
            {categories.media.length > 0 && (
              <FormSection
                title="Media"
                icon={<Image className="c-w-4 c-h-4" />}
                defaultOpen={true}
              >
                <FormFieldGrid cols={2}>
                  {categories.media.map((st) => renderField(st))}
                </FormFieldGrid>
              </FormSection>
            )}

            {/* Multiple/Repeating Fields Section */}
            {categories.multiple.length > 0 && (
              <FormSection
                title="Data Terkait"
                icon={<List className="c-w-4 c-h-4" />}
                defaultOpen={true}
                collapsible={true}
              >
                {categories.multiple.map((st) => renderField(st))}
              </FormSection>
            )}
          </div>
        );
      }}
    </BaseForm>
  );
};

const createRandomString = (length: number) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.toLowerCase();
};
