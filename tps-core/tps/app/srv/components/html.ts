/**
 * HTML Template Utilities untuk SSR
 */

// Escape HTML untuk mencegah XSS
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Image URL helper
export function img(path: string | null | undefined, width?: number): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `/_img${path}`;
  return width ? `/_img/${path}?w=${width}` : `/_img/${path}`;
}

// File URL helper
export function file(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `/_file${path}`;
  return `/_file/${path}`;
}

// Format date ke bahasa Indonesia
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// CSS classes helper
export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
