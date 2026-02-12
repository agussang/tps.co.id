// Dashboard queries for statistics and recent activity

export const dashboardQuery = {
  // Get content statistics
  stats: async () => {
    const [totalContent, draftContent, publishedContent, totalStructures, totalUsers] = await Promise.all([
      db.content.count({
        where: { id_parent: null }
      }),
      db.content.count({
        where: { id_parent: null, status: "draft" }
      }),
      db.content.count({
        where: { id_parent: null, status: "published" }
      }),
      db.structure.count({
        where: { parent: null, status: "published" }
      }),
      db.user.count({
        where: { active: true }
      })
    ]);

    return {
      totalContent,
      draftContent,
      publishedContent,
      totalStructures,
      totalUsers
    };
  },

  // Get recently updated content
  recentContent: async (limit = 10) => {
    const recent = await db.content.findMany({
      where: {
        id_parent: null,
        updated_at: { not: null }
      },
      orderBy: { updated_at: "desc" },
      take: limit,
      select: {
        id: true,
        updated_at: true,
        status: true,
        structure: {
          select: {
            id: true,
            title: true,
            path: true
          }
        }
      }
    });

    // Get first text field for each content as title
    const result = [];
    for (const item of recent) {
      if (!item.structure) continue;

      const firstChild = await db.content.findFirst({
        where: {
          id_parent: item.id,
          text: { not: null }
        },
        select: {
          text: true,
          structure: {
            select: { path: true }
          }
        }
      });

      result.push({
        id: item.id,
        structureId: item.structure.id,
        structureTitle: item.structure.title,
        title: firstChild?.text?.substring(0, 50) || "(No title)",
        updatedAt: item.updated_at,
        status: item.status
      });
    }

    return result;
  },

  // Get recent activity logs
  recentLogs: async (limit = 10) => {
    const logs = await db.logs.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        activity: true,
        user: true,
        created_at: true
      }
    });

    return logs.map(log => {
      let parsed = { action: "", url: "", data: "" };
      try {
        parsed = JSON.parse(log.activity);
      } catch {
        parsed.action = log.activity;
      }
      return {
        id: log.id,
        action: parsed.action,
        url: parsed.url,
        user: log.user,
        createdAt: log.created_at
      };
    });
  },

  // Get quick links (structures with content count)
  quickLinks: async (id_role: number) => {
    const folders = await db.structure_folder.findMany({
      where: {
        role_menu: {
          some: { id_role }
        }
      },
      select: { id: true }
    });

    const structures = await db.structure.findMany({
      where: {
        parent: null,
        status: "published",
        id_folder: { in: folders.map(f => f.id) }
      },
      select: {
        id: true,
        title: true,
        icon: true,
        _count: {
          select: {
            content: {
              where: { id_parent: null }
            }
          }
        }
      },
      orderBy: { sort_idx: "asc" },
      take: 8
    });

    return structures.map(s => ({
      id: s.id,
      title: s.title,
      icon: s.icon,
      count: s._count.content
    }));
  }
};
