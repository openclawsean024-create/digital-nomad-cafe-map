import type { Cafe, City, Review } from '@/domain/types';

export const cities: City[] = [
  { id: 'taipei', name: '台北', country: '台灣', countryCode: 'TW', lat: 25.0478, lng: 121.5319, pilot: true },
  { id: 'taichung', name: '台中', country: '台灣', countryCode: 'TW', lat: 24.1477, lng: 120.6736, pilot: true },
  { id: 'tainan', name: '台南', country: '台灣', countryCode: 'TW', lat: 22.9997, lng: 120.227, pilot: true },
  { id: 'kaohsiung', name: '高雄', country: '台灣', countryCode: 'TW', lat: 22.6273, lng: 120.3014, pilot: true },
  { id: 'taitung', name: '台東', country: '台灣', countryCode: 'TW', lat: 22.7554, lng: 121.150, pilot: true },
  { id: 'hualien', name: '花蓮', country: '台灣', countryCode: 'TW', lat: 23.9911, lng: 121.6112, pilot: true },
  { id: 'chiang-mai', name: '清邁', country: '泰國', countryCode: 'TH', lat: 18.7883, lng: 98.9853, pilot: false },
  { id: 'tokyo', name: '東京', country: '日本', countryCode: 'JP', lat: 35.6762, lng: 139.6503, pilot: false },
  { id: 'lisbon', name: '里斯本', country: '葡萄牙', countryCode: 'PT', lat: 38.7223, lng: -9.1393, pilot: false },
  { id: 'canggu', name: '倉古', country: '印尼', countryCode: 'ID', lat: -8.6478, lng: 115.1385, pilot: false },
];

const taiwanNeighborhoods: Record<string, string[]> = {
  taipei: ['中山', '大安', '信義', '松山', '萬華', '士林', '內湖', '南港'],
  taichung: ['西區', '北區', '南屯', '西屯', '中區', '北屯', '東區', '豐原'],
  tainan: ['中西', '東區', '北區', '南區', '安平', '永康', '善化', '新市'],
  kaohsiung: ['鹽埕', '鼓山', '前金', '苓雅', '左營', '三民', '新興', '鳳山'],
  taitung: ['鐵花', '海濱', '新生', '中華', '更生', '知本', '卑南', '富岡'],
  hualien: ['舊城', '美崙', '站前', '中山', '吉安', '壽豐', '七星潭', '東華'],
};

const nameSuffixes = ['書室', '工作間', '慢焙所', '日光室', '巷口店', '共桌', '山海間', '長桌計畫'];

function initialReview(cafeId: string, cityName: string, index: number): Review[] {
  if (index > 1) return [];
  return [{
    id: `${cafeId}-review-1`, cafeId, author: index === 0 ? 'Pilot Mina' : 'Remote Ken', rating: index === 0 ? 5 : 4,
    comment: `${cityName}社群 pilot 記錄：網路穩定，平日下午適合專注工作。`,
    visitedAt: '2026-07-18', createdAt: '2026-07-18T08:00:00.000Z',
  }];
}

function buildTaiwanSeed(): Cafe[] {
  return cities.filter((city) => city.countryCode === 'TW').flatMap((city, cityIndex) =>
    nameSuffixes.map((suffix, index) => {
      const id = `${city.id}-${index + 1}`;
      return {
        id,
        name: `${city.name}${taiwanNeighborhoods[city.id][index]}${suffix}`,
        address: `${city.name}${taiwanNeighborhoods[city.id][index]} pilot 區域 ${index + 1} 號（社群待複驗）`,
        cityId: city.id, cityName: city.name, country: city.country, countryCode: city.countryCode,
        lat: city.lat + (index - 3.5) * 0.007, lng: city.lng + ((index * 3) % 7 - 3) * 0.008,
        wifiMbps: 38 + ((cityIndex * 19 + index * 13) % 118), quietScore: 2.8 + ((cityIndex + index) % 20) / 10,
        outletRate: 35 + ((cityIndex * 11 + index * 9) % 66), priceMedian: 100 + ((cityIndex * 17 + index * 23) % 150),
        friendliness: 3 + ((cityIndex + index * 2) % 19) / 10, verifierCount: 2 + ((cityIndex + index) % 8),
        status: 'active' as const, hours: index % 2 === 0 ? '08:30–18:00' : '10:00–21:00',
        tags: index % 3 === 0 ? ['不限時', '插座多'] : index % 3 === 1 ? ['自然光', '可通話'] : ['安靜區', '單品咖啡'],
        reviews: initialReview(id, city.name, index), createdAt: '2026-07-01T00:00:00.000Z',
        lastVerifiedAt: `2026-07-${String(11 + ((cityIndex + index) % 8)).padStart(2, '0')}T08:00:00.000Z`,
      };
    }),
  );
}

const globalSeeds: Cafe[] = cities.filter((city) => city.countryCode !== 'TW').flatMap((city, cityIndex) =>
  [0, 1].map((index) => {
    const id = `${city.id}-${index + 1}`;
    return {
      id, name: `${city.name} Community Desk ${String(index + 1).padStart(2, '0')}`,
      address: `${city.name} nomad district • community seed pending re-verification`,
      cityId: city.id, cityName: city.name, country: city.country, countryCode: city.countryCode,
      lat: city.lat + index * 0.012, lng: city.lng - index * 0.01, wifiMbps: 74 + cityIndex * 17 + index * 11,
      quietScore: 3.7 + index * 0.5, outletRate: 68 + index * 18, priceMedian: 150 + cityIndex * 20,
      friendliness: 4.1 + index * 0.3, verifierCount: 2 + cityIndex + index, status: 'active' as const,
      hours: '09:00–19:00', tags: ['global seed', index === 0 ? 'deep work' : 'calls okay'],
      reviews: initialReview(id, city.name, index), createdAt: '2026-07-01T00:00:00.000Z', lastVerifiedAt: '2026-07-17T08:00:00.000Z',
    };
  }),
);

export const seedCafes: Cafe[] = [...buildTaiwanSeed(), ...globalSeeds];
