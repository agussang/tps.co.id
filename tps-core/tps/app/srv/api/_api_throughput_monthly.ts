/**
 * Throughput Monthly Data API
 * Route: GET /backend/api/throughput-monthly?year=2024
 * Returns monthly throughput data for a specific year
 */

import { g } from "utils/global";

const getSessionUser = async (sessionId: string) => {
  if (!sessionId || !g.db) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) return null;
  try {
    const session = await g.db.user_session.findFirst({
      where: { id: sessionId },
      select: { user: { select: { id: true } } },
    });
    return session?.user || null;
  } catch (e) {
    return null;
  }
};

export const _ = {
  url: "/backend/api/throughput-monthly",
  raw: true,
  async api(this: { req: Request; _url: URL }) {
    const req = this.req as Request;
    const url = this._url || new URL(req?.url || "http://localhost");

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

    const year = url.searchParams.get("year");
    if (!year) {
      return new Response(JSON.stringify({ status: "error", message: "Year required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const throughputStruct = await g.db!.structure.findFirst({
      where: { path: "throughput" },
      select: { id: true },
    });

    if (!throughputStruct) {
      return new Response(JSON.stringify({ status: "ok", months: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const parents = await g.db!.content.findMany({
      where: {
        id_structure: throughputStruct.id,
        id_parent: null,
        status: "published",
        OR: [{ lang: "id" }, { lang: "inherited" }],
      },
      select: {
        id: true,
        other_content: {
          select: { text: true, structure: { select: { path: true } } },
        },
      },
    });

    const months: Array<{ month: string; domestics: number; international: number }> = [];

    for (const p of parents) {
      const pYear = p.other_content.find((c: any) => c.structure?.path?.endsWith(".year"))?.text || "";
      if (pYear !== year) continue;

      const month = p.other_content.find((c: any) => c.structure?.path?.endsWith(".month"))?.text || "0";
      const dom = p.other_content.find((c: any) => c.structure?.path?.endsWith(".domestics"))?.text || "0";
      const intl = p.other_content.find((c: any) => c.structure?.path?.endsWith(".international"))?.text || "0";

      months.push({
        month,
        domestics: parseInt(dom.replace(/[^\d]/g, "")) || 0,
        international: parseInt(intl.replace(/[^\d]/g, "")) || 0,
      });
    }

    months.sort((a, b) => parseInt(a.month) - parseInt(b.month));

    return new Response(JSON.stringify({ status: "ok", months }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
