import { getPathname } from "lib/exports";

export const audit = {
  session: { id: "" },
  user: { id: 0, username: "" },
  loading: false,
  async init() {
    // const path = location.href.split(location.host).pop() || "";
    // if (path.startsWith("/prod")) return;
    const sid = localStorage.getItem("sid") || "";
    if (audit.session.id !== sid) {
      audit.loading = true;
      audit.user.id = 0;
      audit.user.username = "";
      const session = await db.user_session.findFirst({
        where: {
          id: sid,
        },
        select: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
      if (session) {
        audit.session.id = sid;
        audit.user.id = session.user.id;
        audit.user.username = session.user.username;
      }
      audit.loading = false;
    }
  },
  async log(arg: { action: string; url?: string; data?: string }) {
    const path = location.href.split(location.host).pop() || "";

    if (audit.loading) {
      await new Promise<void>((done) => {
        const ival = setInterval(() => {
          if (!audit.loading) {
            clearInterval(ival);
            done();
          } 
        }, 100);
      });
    }

    await fetch(baseurl("/post-audit-log"), {
      method: "POST",
      body: JSON.stringify({
        activity: {
          url: path,
          ...arg,
        },
        username: audit.user.username,
      }),
    });
  },
};
