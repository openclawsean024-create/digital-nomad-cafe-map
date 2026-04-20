'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'rechart';
import { Cafe } from '@/types/cafe';

interface WifiChartProps {
  cafes: Cafe[];
}

export default function WifiChart({ cafes }: WifiChartProps) {
  // Aggregate WiFi quality distribution
  const wifiData = [1, 2, 3, 4, 5].map(quality => ({
    quality: `${quality}★`,
    count: cafes.filter(c => c.wifiQuality === quality).length,
    fill: quality >= 4 ? '#22c55e' : quality === 3 ? '#eab308' : '#ef4444',
  }));

  if (cafes.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
        WiFi Quality Distribution
      </h3>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={wifiData} margin={{ top: 2, right: 2, bottom: 2, left: -20 }}>
            <XAxis
              dataKey="quality"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{
                fontSize: 11,
                background: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                borderRadius: 6,
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {wifiData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
