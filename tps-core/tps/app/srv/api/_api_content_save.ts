/**
 * Custom Content Save API
 * Route: POST /backend/api/content-save
 *
 * This API properly updates:
 * 1. Parent content status
 * 2. Child content values (fields)
 * 3. Clears all caches
 */

import { g } from "utils/global";
import { loadRolePermissions, hasPermission } from "../utils/permissions";

interface SaveRequest {
  id: string; // Content ID to update
  status: string; // "draft" | "published"
  entry: Record<string, any>; // Field values
  lang?: string;
}

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;

  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: {
        user: {
          select: { id: true, username: true, role: { select: { id: true, name: true } } },
        },
      },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/content-save",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check session authentication
    const cookies = req?.headers?.get("cookie") || "";
    const sidMatch = cookies.match(/sid=([^;]+)/);
    const sessionId = sidMatch?.[1] || "";

    const user = await getSessionUser(sessionId);
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body: SaveRequest = await req.json();
      const { id, status, entry, lang = "id" } = body;

      if (!id || !g.db) {
        return new Response(JSON.stringify({ status: "error", message: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get parent content with structure
      const content = await g.db.content.findFirst({
        where: { id },
        select: {
          id: true,
          status: true,
          id_structure: true,
          structure: { select: { id: true, path: true, title: true } },
        },
      });

      if (!content || !content.structure) {
        return new Response(JSON.stringify({ status: "error", message: "Content not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check can_edit permission
      const permMap = await loadRolePermissions(user.role.id);
      if (!hasPermission(user.role.name, content.id_structure, "can_edit", permMap)) {
        return new Response(JSON.stringify({ status: "error", message: "Forbidden - no edit permission" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const structurePath = content.structure.path || "";
      const rootPath = structurePath.split(".")[0];

      // 1. Update parent content status
      await g.db.content.update({
        where: { id },
        data: {
          status: status,
          updated_at: new Date(),
        },
      });

      // 2. Get all child structures (including invisible ones like slug, year, month, day)
      const childStructures = await g.db.structure.findMany({
        where: {
          path: { startsWith: `${structurePath}.` },
        },
        select: { id: true, path: true, type: true },
      });

      // 3. Get existing child content
      const existingChildren = await g.db.content.findMany({
        where: { id_parent: id },
        select: {
          id: true,
          id_structure: true,
          text: true,
          id_file: true,
          structure: { select: { path: true } },
        },
      });

      const existingByStructure: Record<string, any> = {};
      for (const child of existingChildren) {
        if (child.id_structure) {
          existingByStructure[child.id_structure] = child;
        }
      }

      // 4. Update or create child content for each field
      const updates: Promise<any>[] = [];

      for (const struct of childStructures) {
        const fieldName = struct.path?.split(".").pop() || "";
        if (!fieldName || !(fieldName in entry)) continue;

        const newValue = entry[fieldName];
        const existing = existingByStructure[struct.id];

        if (existing) {
          // Update existing child
          if (struct.type === "file") {
            // Handle file field
            let fileId = null;
            if (newValue && typeof newValue === "string") {
              const file = await g.db.file.findFirst({
                where: { path: newValue },
                select: { uuid: true },
              });
              if (file) {
                fileId = file.uuid;
              } else {
                // Create file record
                const newFile = await g.db.file.create({
                  data: { path: newValue, method: "upload" },
                  select: { uuid: true },
                });
                fileId = newFile.uuid;
              }
            }
            if (existing.id_file !== fileId) {
              updates.push(
                g.db.content.update({
                  where: { id: existing.id },
                  data: { id_file: fileId, updated_at: new Date() },
                })
              );
            }
          } else {
            // Update text field
            const textValue = newValue?.toString() || "";
            if (existing.text !== textValue) {
              updates.push(
                g.db.content.update({
                  where: { id: existing.id },
                  data: { text: textValue, updated_at: new Date() },
                })
              );
            }
          }
        } else if (newValue) {
          // Create new child content
          const createData: any = {
            id_parent: id,
            id_structure: struct.id,
            lang: lang,
            status: status,
            created_at: new Date(),
            updated_at: new Date(),
          };

          if (struct.type === "file") {
            if (typeof newValue === "string") {
              const file = await g.db.file.findFirst({
                where: { path: newValue },
                select: { uuid: true },
              });
              if (file) {
                createData.id_file = file.uuid;
              } else {
                const newFile = await g.db.file.create({
                  data: { path: newValue, method: "upload" },
                  select: { uuid: true },
                });
                createData.id_file = newFile.uuid;
              }
            }
          } else {
            createData.text = newValue?.toString() || "";
          }

          updates.push(g.db.content.create({ data: createData }));
        }
      }

      // Auto-generate slug, year, month, day for berita structures
      const beritaPaths = ["press_release", "latest_news"];
      if (beritaPaths.includes(rootPath)) {
        const structByField: Record<string, any> = {};
        for (const struct of childStructures) {
          const fieldName = struct.path?.split(".").pop() || "";
          if (fieldName) structByField[fieldName] = struct;
        }

        const autoFields: Record<string, string> = {};

        // Generate slug from title
        const titleValue = entry.title || existingByStructure[structByField.title?.id]?.text || "";
        if (titleValue && structByField.slug) {
          const slug = titleValue
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[àáâãäå]/g, "a")
            .replace(/[èéêë]/g, "e")
            .replace(/[ìíîï]/g, "i")
            .replace(/[òóôõö]/g, "o")
            .replace(/[ùúûü]/g, "u")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
          if (slug) autoFields.slug = slug;
        }

        // Extract year, month, day from publish_date
        const publishDateValue = entry.publish_date || existingByStructure[structByField.publish_date?.id]?.text || "";
        if (publishDateValue) {
          const date = new Date(publishDateValue);
          if (!isNaN(date.getTime())) {
            autoFields.year = date.getFullYear().toString();
            autoFields.month = (date.getMonth() + 1).toString();
            autoFields.day = date.getDate().toString();
          }
        }

        // Save auto-generated fields
        for (const [fieldName, value] of Object.entries(autoFields)) {
          const struct = structByField[fieldName];
          if (!struct) continue;
          const existing = existingByStructure[struct.id];
          if (existing) {
            if (existing.text !== value) {
              updates.push(
                g.db.content.update({
                  where: { id: existing.id },
                  data: { text: value, updated_at: new Date() },
                })
              );
            }
          } else {
            updates.push(
              g.db.content.create({
                data: {
                  id_parent: id,
                  id_structure: struct.id,
                  lang: lang,
                  status: status,
                  text: value,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              })
            );
          }
        }
      }

      // Auto-sync throughput to both languages + recalculate annual throughput
      if (rootPath === "throughput") {
        const otherLang = lang === "en" ? "en" : (lang === "id" ? "id" : null);
        // Determine values saved
        const structByField: Record<string, any> = {};
        for (const struct of childStructures) {
          const fn = struct.path?.split(".").pop() || "";
          if (fn) structByField[fn] = struct;
        }
        const savedYear = entry.year || existingByStructure[structByField.year?.id]?.text || "";
        const savedMonth = entry.month || existingByStructure[structByField.month?.id]?.text || "";
        const savedDomestics = entry.domestics || existingByStructure[structByField.domestics?.id]?.text || "";
        const savedInternational = entry.international || existingByStructure[structByField.international?.id]?.text || "";

        // Sync to other language
        const langs = ["id", "en"];
        for (const targetLang of langs) {
          if (targetLang === lang) continue; // skip current language

          // Find existing parent content with same year+month in other language
          const otherParents = await g.db.content.findMany({
            where: {
              id_structure: content.id_structure,
              lang: targetLang,
              id_parent: null,
            },
            select: {
              id: true,
              other_content: {
                select: { text: true, structure: { select: { path: true } } },
              },
            },
          });

          let matchingParentId: string | null = null;
          for (const p of otherParents) {
            const pYear = p.other_content.find((c: any) => c.structure?.path?.endsWith(".year"))?.text;
            const pMonth = p.other_content.find((c: any) => c.structure?.path?.endsWith(".month"))?.text;
            if (pYear === savedYear && pMonth === savedMonth) {
              matchingParentId = p.id;
              break;
            }
          }

          if (matchingParentId) {
            // Update existing other-language entry
            const otherChildren = await g.db.content.findMany({
              where: { id_parent: matchingParentId },
              select: { id: true, id_structure: true, text: true },
            });
            const otherByStruct: Record<string, any> = {};
            for (const c of otherChildren) {
              if (c.id_structure) otherByStruct[c.id_structure] = c;
            }

            for (const [fn, val] of [["domestics", savedDomestics], ["international", savedInternational], ["year", savedYear], ["month", savedMonth]] as const) {
              const struct = structByField[fn];
              if (!struct || !val) continue;
              const existing = otherByStruct[struct.id];
              if (existing) {
                if (existing.text !== val) {
                  updates.push(g.db.content.update({
                    where: { id: existing.id },
                    data: { text: val, updated_at: new Date() },
                  }));
                }
              } else {
                updates.push(g.db.content.create({
                  data: { id_parent: matchingParentId, id_structure: struct.id, lang: targetLang, status: status, text: val, created_at: new Date(), updated_at: new Date() },
                }));
              }
            }
            // Also sync parent status
            updates.push(g.db.content.update({
              where: { id: matchingParentId },
              data: { status: status, updated_at: new Date() },
            }));
          } else {
            // Create new parent + children in other language
            const newParent = await g.db.content.create({
              data: {
                id_structure: content.id_structure,
                lang: targetLang,
                status: status,
                created_at: new Date(),
                updated_at: new Date(),
              },
            });
            for (const [fn, val] of [["domestics", savedDomestics], ["international", savedInternational], ["year", savedYear], ["month", savedMonth]] as const) {
              const struct = structByField[fn];
              if (!struct || !val) continue;
              updates.push(g.db.content.create({
                data: { id_parent: newParent.id, id_structure: struct.id, lang: targetLang, status: status, text: val, created_at: new Date(), updated_at: new Date() },
              }));
            }
          }
        }

        // Auto-recalculate annual throughput for this year
        if (savedYear) {
          await Promise.all(updates); // Flush pending updates first
          updates.length = 0;

          // Get annual_throughput structure
          const annualStruct = await g.db.structure.findFirst({
            where: { path: "annual_throughput" },
            select: { id: true },
          });
          const annualChildStructs = await g.db.structure.findMany({
            where: { path: { startsWith: "annual_throughput." } },
            select: { id: true, path: true },
          });
          const annualFieldMap: Record<string, string> = {};
          for (const s of annualChildStructs) {
            const fn = s.path?.split(".").pop() || "";
            if (fn) annualFieldMap[fn] = s.id;
          }

          if (annualStruct && annualFieldMap.year && annualFieldMap.domestics && annualFieldMap.international) {
            // Sum all throughput entries for this year (use id lang as primary)
            const yearParents = await g.db.content.findMany({
              where: {
                id_structure: content.id_structure,
                id_parent: null,
                OR: [{ lang: "id" }, { lang: "inherited" }],
                status: "published",
              },
              select: {
                id: true,
                other_content: {
                  select: { text: true, structure: { select: { path: true } } },
                },
              },
            });

            let totalDomestics = 0;
            let totalInternational = 0;
            for (const p of yearParents) {
              const pYear = p.other_content.find((c: any) => c.structure?.path?.endsWith(".year"))?.text;
              if (pYear !== savedYear) continue;
              const dom = p.other_content.find((c: any) => c.structure?.path?.endsWith(".domestics"))?.text || "0";
              const intl = p.other_content.find((c: any) => c.structure?.path?.endsWith(".international"))?.text || "0";
              totalDomestics += parseInt(dom.replace(/[^\d]/g, "")) || 0;
              totalInternational += parseInt(intl.replace(/[^\d]/g, "")) || 0;
            }

            // Update or create annual_throughput entries for both languages
            for (const aLang of ["id", "en"]) {
              // Find existing annual entry for this year+lang
              const annualParents = await g.db.content.findMany({
                where: {
                  id_structure: annualStruct.id,
                  lang: aLang,
                  id_parent: null,
                  status: "published",
                },
                select: {
                  id: true,
                  other_content: {
                    select: { id: true, text: true, id_structure: true, structure: { select: { path: true } } },
                  },
                },
              });

              let annualParentId: string | null = null;
              let annualChildren: any[] = [];
              for (const ap of annualParents) {
                const apYear = ap.other_content.find((c: any) => c.structure?.path?.endsWith(".year"))?.text;
                if (apYear === savedYear) {
                  annualParentId = ap.id;
                  annualChildren = ap.other_content;
                  break;
                }
              }

              const fieldsToUpdate: Record<string, string> = {
                year: savedYear,
                domestics: totalDomestics.toString(),
                international: totalInternational.toString(),
              };

              if (annualParentId) {
                // Update existing annual entry
                for (const [fn, val] of Object.entries(fieldsToUpdate)) {
                  const structId = annualFieldMap[fn];
                  if (!structId) continue;
                  const existing = annualChildren.find((c: any) => c.id_structure === structId);
                  if (existing) {
                    if (existing.text !== val) {
                      updates.push(g.db.content.update({
                        where: { id: existing.id },
                        data: { text: val, updated_at: new Date() },
                      }));
                    }
                  } else {
                    updates.push(g.db.content.create({
                      data: { id_parent: annualParentId, id_structure: structId, lang: aLang, status: "published", text: val, created_at: new Date(), updated_at: new Date() },
                    }));
                  }
                }
              } else {
                // Create new annual entry
                const newAnnual = await g.db.content.create({
                  data: {
                    id_structure: annualStruct.id,
                    lang: aLang,
                    status: "published",
                    created_at: new Date(),
                    updated_at: new Date(),
                  },
                });
                for (const [fn, val] of Object.entries(fieldsToUpdate)) {
                  const structId = annualFieldMap[fn];
                  if (!structId) continue;
                  updates.push(g.db.content.create({
                    data: { id_parent: newAnnual.id, id_structure: structId, lang: aLang, status: "published", text: val, created_at: new Date(), updated_at: new Date() },
                  }));
                }
              }
            }
          }
        }
      }

      // Execute all updates
      await Promise.all(updates);

      // 5. Auto clear all caches (server-side)
      try {
        // Clear specific path cache
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/${rootPath}`);
        // Clear all cache to ensure consistency
        await fetch(`http://localhost:${g.port || 3300}/clear-cache/`);
      } catch (cacheError) {
        console.warn("Cache clear warning:", cacheError);
      }

      return new Response(
        JSON.stringify({
          status: "ok",
          id: content.id,
          structure: { name: content.structure.title, path: rootPath },
          message: "Content saved successfully",
          cacheCleared: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Save error:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
