/**
 * Tabs Component
 * Tab content with multiple panels
 */

import { escapeHtml } from '../html';

export interface TabItem {
  label: string;
  content: string; // HTML content
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

  const bgClasses: Record<string, string> = {
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  const tabId = `tabs-${Math.random().toString(36).substr(2, 9)}`;

  const getTabButtonClass = (isActive: boolean) => {
    switch (style) {
      case 'pills':
        return isActive
          ? 'px-5 py-2.5 text-sm font-medium text-white bg-[#0475BC] rounded-full transition-colors'
          : 'px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0475BC] rounded-full transition-colors';
      case 'boxed':
        return isActive
          ? 'px-5 py-3 text-sm font-medium text-[#0475BC] bg-white border border-gray-200 border-b-white rounded-t-lg -mb-px transition-colors'
          : 'px-5 py-3 text-sm font-medium text-gray-600 hover:text-[#0475BC] rounded-t-lg transition-colors';
      case 'underline':
      default:
        return isActive
          ? 'px-4 py-3 text-sm font-medium text-[#0475BC] border-b-2 border-[#0475BC] transition-colors'
          : 'px-4 py-3 text-sm font-medium text-gray-600 hover:text-[#0475BC] border-b-2 border-transparent transition-colors';
    }
  };

  const getTabContainerClass = () => {
    switch (style) {
      case 'pills':
        return 'flex flex-wrap gap-2 p-1 bg-gray-100 rounded-full w-fit';
      case 'boxed':
        return 'flex flex-wrap border-b border-gray-200';
      case 'underline':
      default:
        return 'flex flex-wrap border-b border-gray-200';
    }
  };

  return `
    <section class="tabs-section py-12 lg:py-20 ${bgClasses[background]} section-animate">
      <div class="max-w-[1100px] mx-auto px-4">
        ${title || subtitle ? `
          <div class="text-center mb-10">
            ${subtitle ? `
              <span class="inline-block px-3 py-1 mb-3 text-sm font-medium text-[#0475BC] bg-[#0475BC]/10 rounded-full">
                ${escapeHtml(subtitle)}
              </span>
            ` : ''}
            ${title ? `
              <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                ${escapeHtml(title)}
              </h2>
            ` : ''}
          </div>
        ` : ''}

        <!-- Tab Buttons -->
        <div class="${getTabContainerClass()} mb-6">
          ${tabs.map((tab, index) => `
            <button
              type="button"
              class="tab-btn ${getTabButtonClass(index === defaultTab)}"
              data-tab-id="${tabId}"
              data-tab-index="${index}"
              onclick="switchTab('${tabId}', ${index})"
            >
              ${tab.icon ? `
                <span class="inline-flex items-center gap-2">
                  <img src="${escapeHtml(tab.icon)}" alt="" class="w-4 h-4" />
                  ${escapeHtml(tab.label)}
                </span>
              ` : escapeHtml(tab.label)}
            </button>
          `).join('')}
        </div>

        <!-- Tab Panels -->
        <div class="tab-panels">
          ${tabs.map((tab, index) => `
            <div
              id="${tabId}-panel-${index}"
              class="tab-panel ${index === defaultTab ? '' : 'hidden'}"
              role="tabpanel"
            >
              <div class="prose max-w-none">
                ${tab.content}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <script>
        window.switchTab = function(tabId, index) {
          // Update buttons
          const buttons = document.querySelectorAll('[data-tab-id="' + tabId + '"]');
          buttons.forEach(btn => {
            const btnIndex = parseInt(btn.dataset.tabIndex);
            const style = '${style}';

            // Remove all style classes first
            btn.classList.remove(
              'text-white', 'bg-[#0475BC]', 'text-[#0475BC]', 'border-[#0475BC]',
              'bg-white', 'border-b-white', '-mb-px', 'border-b-2'
            );

            if (btnIndex === index) {
              // Active state
              if (style === 'pills') {
                btn.classList.add('text-white', 'bg-[#0475BC]');
              } else if (style === 'boxed') {
                btn.classList.add('text-[#0475BC]', 'bg-white', 'border-b-white', '-mb-px');
              } else {
                btn.classList.add('text-[#0475BC]', 'border-b-2', 'border-[#0475BC]');
              }
            } else {
              // Inactive state
              btn.classList.add('text-gray-600');
              if (style === 'underline') {
                btn.classList.add('border-b-2', 'border-transparent');
              }
            }
          });

          // Update panels
          const panels = document.querySelectorAll('[id^="' + tabId + '-panel-"]');
          panels.forEach((panel, i) => {
            if (i === index) {
              panel.classList.remove('hidden');
            } else {
              panel.classList.add('hidden');
            }
          });
        };
      </script>
    </section>
  `;
}
