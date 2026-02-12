/**
 * Tabs Component
 * Tab content with multiple panels
 * IMPORTANT: Uses ONLY inline styles (no Tailwind) to avoid Prasi CSS conflicts
 */

import { escapeHtml } from '../html';

export interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

export interface TabsProps {
  title?: string;
  subtitle?: string;
  tabs: TabItem[];
  background?: 'white' | 'gray';
  style?: 'underline' | 'pills' | 'boxed';
  defaultTab?: number;
}

export function Tabs({
  title,
  subtitle,
  tabs,
  background = 'white',
  style = 'underline',
  defaultTab = 0,
}: TabsProps): string {
  if (!tabs || tabs.length === 0) return '';

  const bgColors: Record<string, string> = { white: '#ffffff', gray: '#f9fafb' };
  const tabId = `tabs-${Math.random().toString(36).substr(2, 9)}`;

  const getButtonStyle = (isActive: boolean) => {
    const base = 'padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s;';
    switch (style) {
      case 'pills':
        return isActive
          ? `${base} color: #fff; background: #0475BC; border-radius: 9999px;`
          : `${base} color: #4b5563; background: transparent; border-radius: 9999px;`;
      case 'boxed':
        return isActive
          ? `${base} color: #0475BC; background: #fff; border: 1px solid #e5e7eb; border-bottom-color: #fff; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: -1px;`
          : `${base} color: #4b5563; background: transparent; border: 1px solid transparent; border-radius: 0.5rem 0.5rem 0 0;`;
      default: // underline
        return isActive
          ? `${base} color: #0475BC; background: transparent; border-bottom: 2px solid #0475BC;`
          : `${base} color: #4b5563; background: transparent; border-bottom: 2px solid transparent;`;
    }
  };

  const containerStyle = style === 'pills'
    ? 'display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.25rem; background: #f3f4f6; border-radius: 9999px; width: fit-content; margin-bottom: 1.5rem;'
    : 'display: flex; flex-wrap: wrap; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;';

  return `
    <section style="padding: 3rem 1rem; background: ${bgColors[background]};">
      <div style="max-width: 1100px; margin: 0 auto;">
        ${title || subtitle ? `
          <div style="text-align: center; margin-bottom: 2.5rem;">
            ${subtitle ? `
              <span style="display: inline-block; padding: 0.25rem 0.75rem; margin-bottom: 0.75rem; font-size: 0.875rem; font-weight: 500; color: #0475BC; background: rgba(4,117,188,0.1); border-radius: 9999px;">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 style="font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0;">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
          </div>
        ` : ''}

        <!-- Tab Buttons -->
        <div style="${containerStyle}">
          ${tabs.map((tab, index) => `
            <button
              type="button"
              id="${tabId}-btn-${index}"
              style="${getButtonStyle(index === defaultTab)}"
              data-tab-id="${tabId}"
              data-tab-index="${index}"
              onclick="window.__switchTab && window.__switchTab('${tabId}', ${index}, '${style}')"
            >
              ${escapeHtml(tab.label)}
            </button>
          `).join('')}
        </div>

        <!-- Tab Panels -->
        <div>
          ${tabs.map((tab, index) => `
            <div
              id="${tabId}-panel-${index}"
              style="display: ${index === defaultTab ? 'block' : 'none'};"
            >
              <div style="color: #374151; font-size: 1rem; line-height: 1.75;">
                ${tab.content}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <script>
        window.__switchTab = function(tabId, index, tabStyle) {
          // Update buttons
          var i = 0;
          while (true) {
            var btn = document.getElementById(tabId + '-btn-' + i);
            var panel = document.getElementById(tabId + '-panel-' + i);
            if (!btn || !panel) break;

            var isActive = (i === index);
            panel.style.display = isActive ? 'block' : 'none';

            // Reset button styles
            var base = 'padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s;';
            if (tabStyle === 'pills') {
              btn.style.cssText = isActive
                ? base + ' color: #fff; background: #0475BC; border-radius: 9999px;'
                : base + ' color: #4b5563; background: transparent; border-radius: 9999px;';
            } else if (tabStyle === 'boxed') {
              btn.style.cssText = isActive
                ? base + ' color: #0475BC; background: #fff; border: 1px solid #e5e7eb; border-bottom-color: #fff; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: -1px;'
                : base + ' color: #4b5563; background: transparent; border: 1px solid transparent; border-radius: 0.5rem 0.5rem 0 0;';
            } else {
              btn.style.cssText = isActive
                ? base + ' color: #0475BC; background: transparent; border-bottom: 2px solid #0475BC;'
                : base + ' color: #4b5563; background: transparent; border-bottom: 2px solid transparent;';
            }
            i++;
          }
        };
      </script>
    </section>
  `;
}
