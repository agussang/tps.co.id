
type IRes = {
        username: string,
        name: string,
        role: string,
        created_at: Date | string,
        active: string,
        last_login: Date | string,
        last_activity: string,
};

export const userexport = async () => {
    let results = [] as IRes[];
    const findUser = await db.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            active: true,
            last_login: true,
            crated_at: true,
            role: {
                select: {
                    name: true,
                }
            },
       }
    });

    if(findUser) {
        results = await Promise.all(findUser.map(async (user, i) => {
            const logs = await db.logs.findFirst({
                where: {
                    user: user.username
                },
                orderBy: {
                    id: 'desc'
                },
                take: 1
            });
            let activity = '-';

            if(logs) {
                if(logs.activity) {
                    activity = JSON.parse(logs.activity).action;
                }
            };
            return {
                username: user.username,
                name: user.name ? user.name : '-',
                role: user.role.name,
                created_at: user.crated_at ? new Date(user.crated_at).toLocaleDateString() : '-',
                active: user.active ? 'active' : 'not active',
                last_login: user.last_login ? new Date(user.last_login).toLocaleDateString() : '-',
                last_activity: activity,
            }
        }))
    }
    return results
}