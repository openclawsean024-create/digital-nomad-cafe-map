'use client';

export default function StarbucksLegend() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Map Legend</div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#00704A] flex items-center justify-center shrink-0">
            <span className="text-white text-[8px] font-bold">★</span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Starbucks Store</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 overflow-hidden">
            {/* Default Leaflet marker top part */}
            <div className="w-3 h-3 bg-blue-500 rounded-t-sm" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">Nomad Cafe</span>
        </div>
      </div>
    </div>
  );
}