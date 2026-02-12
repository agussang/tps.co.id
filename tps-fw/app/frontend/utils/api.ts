// API utilities untuk public pages

const API_BASE = '/backend/api';

/**
 * Fetch content dari database berdasarkan path
 */
export async function fetchContent(path: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/_dbs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'content',
        action: 'findFirst',
        params: [{
          where: { path },
          select: { id: true, data: true, path: true }
        }]
      })
    });
    const data = await res.json();
    return data?.data ? JSON.parse(data.data) : null;
  } catch (e) {
    console.error('fetchContent error:', e);
    return null;
  }
}

/**
 * Fetch multiple content items
 */
export async function fetchContentList(paths: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  await Promise.all(
    paths.map(async (path) => {
      results[path] = await fetchContent(path);
    })
  );
  return results;
}

/**
 * Fetch news/berita
 */
export async function fetchNews(limit = 10): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/_dbs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'content',
        action: 'findMany',
        params: [{
          where: {
            path: { startsWith: 'press_release/' },
            // status: 'published'
          },
          take: limit,
          orderBy: { id: 'desc' }
        }]
      })
    });
    return await res.json();
  } catch (e) {
    console.error('fetchNews error:', e);
    return [];
  }
}

/**
 * Generate image URL
 */
export function imageUrl(path: string, width?: number): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = `/_img/${path}`;
  return width ? `${base}?w=${width}` : base;
}

/**
 * Generate file URL
 */
export function fileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `/_file/${path}`;
}

/**
 * Site URL helper
 */
export function siteUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
}
