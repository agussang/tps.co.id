/**
 * Vessel Schedule Section Component - SSR
 */

import { escapeHtml } from './html';

interface VesselData {
  ves_name?: string;
  in_voyage?: string;
  out_voyage?: string;
  act_berth_ts?: string;
  est_dep_ts?: string;
  eta_ts?: string;
  etd_ts?: string;
  closing_ts?: string;
  int_dom?: string;
  feeder_direct?: string;
}

interface VesselScheduleProps {
  sandar: VesselData[];
  closing: VesselData[];
  labels?: {
    vessel_alongside_title?: string;
    vessel_schedule_title?: string;
  };
}

export function VesselSchedule({ sandar, closing, labels }: VesselScheduleProps): string {
  if (sandar.length === 0 && closing.length === 0) return '';

  return `
    <section class="py-20 bg-white">
      <div class="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Jadwal Sandar Kapal -->
          <div class="bg-gray-50 rounded-[20px] p-6 lg:p-8">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-800">
                ${escapeHtml(labels?.vessel_alongside_title) || 'Jadwal Sandar Kapal'}
              </h3>
              <a href="/jadwal-online" class="text-[#0475BC] hover:underline text-sm font-medium">
                Lihat Semua
              </a>
            </div>
            <div class="space-y-4 max-h-[400px] overflow-y-auto">
              ${sandar.length > 0 ? sandar.slice(0, 5).map((vessel) => `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4 class="font-semibold text-gray-800">${escapeHtml(vessel.ves_name?.trim())}</h4>
                      <p class="text-sm text-gray-500">${escapeHtml(vessel.in_voyage?.trim())}</p>
                    </div>
                    <span class="px-2 py-1 text-xs font-medium rounded ${vessel.int_dom === 'I' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                      ${vessel.int_dom === 'I' ? 'International' : 'Domestic'}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-gray-500">Sandar:</span>
                      <span class="ml-1 text-gray-700">${escapeHtml(vessel.act_berth_ts)}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Berangkat:</span>
                      <span class="ml-1 text-gray-700">${escapeHtml(vessel.est_dep_ts)}</span>
                    </div>
                  </div>
                </div>
              `).join('') : `
                <p class="text-gray-500 text-center py-8">Tidak ada data jadwal sandar</p>
              `}
            </div>
          </div>

          <!-- Jadwal Kapal -->
          <div class="bg-gray-50 rounded-[20px] p-6 lg:p-8">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-800">
                ${escapeHtml(labels?.vessel_schedule_title) || 'Jadwal Kapal'}
              </h3>
              <a href="/jadwal-online" class="text-[#0475BC] hover:underline text-sm font-medium">
                Lihat Semua
              </a>
            </div>
            <div class="space-y-4 max-h-[400px] overflow-y-auto">
              ${closing.length > 0 ? closing.slice(0, 5).map((vessel) => `
                <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h4 class="font-semibold text-gray-800">${escapeHtml(vessel.ves_name?.trim())}</h4>
                      <p class="text-sm text-gray-500">${escapeHtml(vessel.in_voyage?.trim())} / ${escapeHtml(vessel.out_voyage?.trim())}</p>
                    </div>
                    <span class="px-2 py-1 text-xs font-medium rounded ${vessel.int_dom === 'I' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                      ${vessel.int_dom === 'I' ? 'International' : 'Domestic'}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-gray-500">ETA:</span>
                      <span class="ml-1 text-gray-700">${escapeHtml(vessel.eta_ts)}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Closing:</span>
                      <span class="ml-1 text-gray-700">${escapeHtml(vessel.closing_ts)}</span>
                    </div>
                  </div>
                </div>
              `).join('') : `
                <p class="text-gray-500 text-center py-8">Tidak ada data jadwal kapal</p>
              `}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
