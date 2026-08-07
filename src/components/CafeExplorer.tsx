'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { cities, seedCafes } from '@/data/cafes';
import {
  addCityReminder,
  buildAdminStats,
  calculateWorkScore,
  canAccessCafe,
  createReview,
  filterAndSortCafes,
  formatRelativeDate,
  mergeCafeCollections,
  upsertCafeReview,
  validateCafeInput,
  validateReviewInput,
  validateVerificationInput,
} from '@/domain/cafes';
import type { Cafe, CafeFilters, CafeInput, ReviewInput, VerificationInput } from '@/domain/types';
import {
  loadCityReminders,
  loadContributedCafes,
  saveCityReminders,
  saveContributedCafes,
} from '@/lib/storage';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
type Modal = 'add' | 'admin' | 'verify' | null;
type MobileView = 'list' | 'map' | 'filters';

const defaultFilters: CafeFilters = { cityId: 'all', query: '', minWifi: 0, minQuiet: 0, minOutlets: 0, sortBy: 'workScore' };

function numberFromForm(form: FormData, key: string): number {
  return Number(form.get(key) ?? 0);
}

// 0 代表「無評分」, 顯示為破折號
function displayScore(value: number, suffix = ''): string {
  return value === 0 ? '—' : `${value}${suffix}`;
}

export default function CafeExplorer() {
  const [cafes, setCafes] = useState<Cafe[]>(seedCafes);
  const [filters, setFilters] = useState<CafeFilters>(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    setCafes(mergeCafeCollections(seedCafes, loadContributedCafes()));
    setReminders(loadCityReminders());
  }, []);

  const filtered = useMemo(() => filterAndSortCafes(cafes, filters), [cafes, filters]);
  const selected = cafes.find((cafe) => cafe.id === selectedId) ?? null;
  const selectedCity = cities.find((city) => city.id === filters.cityId);
  const stats = buildAdminStats(cafes);

  const setFilter = <Key extends keyof CafeFilters>(key: Key, value: CafeFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const selectCafe = (cafe: Cafe) => {
    setSelectedId(cafe.id);
    if (window.innerWidth < 821) setMobileView('list');
  };

  const closeModal = () => { setModal(null); setErrors([]); setNotice(''); };

  const handleAddCafe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const city = cities.find((item) => item.id === String(form.get('cityId'))) ?? cities[0];
    const input: CafeInput = {
      name: String(form.get('name') ?? ''), address: String(form.get('address') ?? ''),
      cityId: city.id, cityName: city.name, country: city.country, countryCode: city.countryCode,
      lat: numberFromForm(form, 'lat'), lng: numberFromForm(form, 'lng'), wifiMbps: numberFromForm(form, 'wifiMbps'),
      quietScore: numberFromForm(form, 'quietScore'), outletRate: numberFromForm(form, 'outletRate'),
      priceMedian: numberFromForm(form, 'priceMedian'), friendliness: numberFromForm(form, 'friendliness'),
      hours: String(form.get('hours') ?? ''), tags: String(form.get('tags') ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    const nextErrors = validateCafeInput(input);
    if (nextErrors.length) { setErrors(nextErrors); return; }
    const newCafe: Cafe = {
      ...input, id: crypto.randomUUID(), verifierCount: 1, status: 'active', reviews: [],
      createdAt: new Date().toISOString(), lastVerifiedAt: new Date().toISOString(),
    };
    const contributed = [...loadContributedCafes(), newCafe];
    saveContributedCafes(contributed);
    setCafes(mergeCafeCollections(seedCafes, contributed));
    setFilters((current) => ({ ...current, cityId: newCafe.cityId }));
    setSelectedId(newCafe.id);
    closeModal();
  };

  const handleReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const input: ReviewInput = {
      author: String(form.get('author') ?? ''), rating: numberFromForm(form, 'rating'),
      comment: String(form.get('comment') ?? ''), visitedAt: String(form.get('visitedAt') ?? ''),
    };
    const nextErrors = validateReviewInput(input);
    if (nextErrors.length) { setErrors(nextErrors); return; }
    const review = createReview(selected.id, input);
    const updated = upsertCafeReview(cafes, review);
    setCafes(updated);
    // 評論是針對 seed cafe 的, 所以整個 updated 都要保存為 contributed
    // 用 Set 紀錄原來是 contributed 的 id
    const contributedIds = new Set(loadContributedCafes().map((cafe) => cafe.id));
    saveContributedCafes(updated.filter((cafe) => contributedIds.has(cafe.id) || cafe.id === selected.id));
    setNotice('感謝補上真實工作情境！評論已儲存在這台裝置。');
    setErrors([]);
    event.currentTarget.reset();
  };

  const handleVerification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const input: VerificationInput = {
      wifiMbps: numberFromForm(form, 'wifiMbps'), quietScore: numberFromForm(form, 'quietScore'),
      outletRate: numberFromForm(form, 'outletRate'), friendliness: numberFromForm(form, 'friendliness'),
      photoName: String(form.get('photoName') ?? ''),
    };
    const nextErrors = validateVerificationInput(input);
    if (nextErrors.length) { setErrors(nextErrors); return; }
    const oldCount = selected.verifierCount || 0;
    const newCount = oldCount + 1;
    const avg = (old: number, val: number) => oldCount === 0 ? val : (old * oldCount + val) / newCount;
    const updated = cafes.map((cafe) => cafe.id === selected.id ? {
      ...cafe,
      wifiMbps: Math.round(avg(cafe.wifiMbps, input.wifiMbps)),
      quietScore: Math.round(avg(cafe.quietScore, input.quietScore) * 10) / 10,
      outletRate: Math.round(avg(cafe.outletRate, input.outletRate)),
      friendliness: Math.round(avg(cafe.friendliness, input.friendliness) * 10) / 10,
      verifierCount: newCount, lastVerifiedAt: new Date().toISOString(),
    } : cafe);
    setCafes(updated);
    const contributedIds = new Set(loadContributedCafes().map((cafe) => cafe.id));
    saveContributedCafes(updated.filter((cafe) => contributedIds.has(cafe.id) || cafe.id === selected.id));
    setNotice('到店驗證已更新，獲得 1 個驗證點。照片僅記錄檔名，未上傳到伺服器。');
    setErrors([]);
  };

  const toggleReminder = (cityId: string) => {
    const next = reminders.includes(cityId) ? reminders.filter((id) => id !== cityId) : addCityReminder(reminders, cityId);
    setReminders(next);
    saveCityReminders(next);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">CW</div><div><strong>Cafework</strong><span>全台 994 間咖啡廳工作訊號地圖</span></div></div>
        <label className="global-search"><input aria-label="搜尋店名或地址" value={filters.query} onChange={(event) => setFilter('query', event.target.value)} placeholder="搜尋店名、地址、區域" /></label>
        <div className="top-actions">
          <button className="button ghost" onClick={() => setModal('admin')}>營運台</button>
          <button className="button primary" onClick={() => setModal('add')}>新增店家</button>
        </div>
      </header>

      <section className="stat-strip" aria-label="資料摘要">
        <div className="stat"><span className="stat-label">搜尋結果</span><span className="stat-value">{filtered.length} 間</span></div>
        <div className="stat"><span className="stat-label">資料庫總數</span><span className="stat-value">{stats.activeCafes} 間</span></div>
        <div className="stat"><span className="stat-label">覆蓋城市</span><span className="stat-value">{cities.length} 城</span></div>
        <div className="stat"><span className="stat-label">資料來源</span><span className="stat-value">OSM · 開放</span></div>
      </section>

      <main className="workspace" data-mobile-view={mobileView}>
        <aside className="filters">
          <p className="section-kicker">01 / 工作條件</p>
          <div className="filter-group">
            <label htmlFor="city">縣市</label>
            <select id="city" value={filters.cityId} onChange={(event) => setFilter('cityId', event.target.value)}>
              <option value="all">全台咖啡廳</option>
              {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><label htmlFor="wifi">最低 WiFi <output>{filters.minWifi} Mbps</output></label><input id="wifi" type="range" min="0" max="150" step="10" value={filters.minWifi} onChange={(event) => setFilter('minWifi', Number(event.target.value))} /><div className="filter-ticks"><span>不限</span><span>150+</span></div></div>
          <div className="filter-group"><label htmlFor="quiet">最低安靜度 <output>{filters.minQuiet.toFixed(1)} / 5</output></label><input id="quiet" type="range" min="0" max="5" step="0.5" value={filters.minQuiet} onChange={(event) => setFilter('minQuiet', Number(event.target.value))} /><div className="filter-ticks"><span>熱鬧</span><span>深度工作</span></div></div>
          <div className="filter-group"><label htmlFor="outlets">最低插座率 <output>{filters.minOutlets}%</output></label><input id="outlets" type="range" min="0" max="100" step="10" value={filters.minOutlets} onChange={(event) => setFilter('minOutlets', Number(event.target.value))} /><div className="filter-ticks"><span>不限</span><span>每桌都有</span></div></div>
          <div className="filter-group"><label htmlFor="sort">排序</label><select id="sort" value={filters.sortBy} onChange={(event) => setFilter('sortBy', event.target.value as CafeFilters['sortBy'])}><option value="workScore">適合工作分數</option><option value="wifi">WiFi 速度</option><option value="verified">驗證人數</option></select></div>
          <p className="section-kicker">02 / 追蹤城市</p>
          {(filters.cityId === 'all' ? cities.slice(0, 4) : cities.filter((city) => city.id === filters.cityId)).map((city) => <button key={city.id} className={`reminder-chip ${reminders.includes(city.id) ? 'active' : ''}`} onClick={() => toggleReminder(city.id)}>{reminders.includes(city.id) ? '✓ 已追蹤' : '+ 追蹤'} {city.name}</button>)}
          <div className="data-note">📊 開放版：所有咖啡廳資訊免費查詢。資料來源：OpenStreetMap 社群貢獻。5 維評分由使用者驗證累積，店家尚無評分時顯示「—」。</div>
        </aside>

        <section className="map-panel" aria-label="咖啡廳地圖">
          <MapView cafes={filtered} selectedId={selectedId} selectedCity={selectedCity} onSelect={selectCafe} />
          <div className="map-caption"><strong>{selectedCity ? `${selectedCity.name} 工作訊號` : '全台工作訊號'}</strong><span>Marker 數字為 5 維加權工作分數；無評分 = 50 中性分數</span></div>
          <div className="map-legend"><span className="legend-pill">WiFi 30%</span><span className="legend-pill">安靜 30%</span><span className="legend-pill">插座 20%</span></div>
        </section>

        <section className="results">
          <div className="results-head"><div><h1>能工作的地方</h1><p>{selectedCity ? `${selectedCity.name} / ` : '全台 / '}{filtered.length} 間咖啡廳</p></div><button className="button small" onClick={() => setFilters(defaultFilters)}>重設</button></div>
          <div className="result-list">
            {filtered.slice(0, 200).map((cafe) => {
              const ext = cafe as Cafe & { brand?: string | null; hasWifi?: boolean };
              return <button className={`cafe-card ${selectedId === cafe.id ? 'selected' : ''}`} key={cafe.id} onClick={() => selectCafe(cafe)}>
                <div className="card-top"><div className="card-title-row"><div><h2>{cafe.name}</h2><p className="card-address">{cafe.address}</p></div><span className="score">{calculateWorkScore(cafe) === 0 ? '—' : calculateWorkScore(cafe)}</span></div><div className="tag-row">{cafe.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div>
                <div className="metrics">
                  <div className="metric"><span>WiFi</span><strong>{displayScore(cafe.wifiMbps, ' Mbps')}</strong></div>
                  <div className="metric"><span>安靜</span><strong>{cafe.quietScore === 0 ? '—' : `${cafe.quietScore.toFixed(1)} / 5`}</strong></div>
                  <div className="metric"><span>插座</span><strong>{displayScore(cafe.outletRate, '%')}</strong></div>
                </div>
                <div className="card-foot"><span>{cafe.cityName} · {ext.brand || '獨立店'}</span><span>{ext.hasWifi ? '📶 WiFi' : '📡 訊號不明'}</span></div>
              </button>;
            })}
            {filtered.length === 0 && <div className="data-note">沒有符合全部條件的咖啡廳。降低一個篩選門檻，或新增你剛找到的店。</div>}
            {filtered.length > 200 && <div className="data-note">顯示前 200 間，總共 {filtered.length} 間符合條件。請用篩選縮小範圍，或用搜尋框找特定店。</div>}
          </div>
        </section>
      </main>

      <nav className="mobile-tabs" aria-label="手機視圖"><button className={mobileView === 'filters' ? 'active' : ''} onClick={() => setMobileView('filters')}>篩選</button><button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>地圖</button><button className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>清單</button></nav>

      {selected && modal === null && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
          <article className="modal" role="dialog" aria-modal="true" aria-labelledby="cafe-title">
            <div className="modal-head">
              <span className="section-kicker">咖啡廳詳情</span>
              <button className="icon-button" onClick={() => setSelectedId(null)} aria-label="關閉">×</button>
            </div>
            <div className="modal-body">
              <div className="detail-hero">
                <div>
                  <h2 id="cafe-title">{selected.name}</h2>
                  <p>📍 {selected.address}</p>
                  {((selected as Cafe & { phone?: string | null }).phone) && (
                    <p>📞 {(selected as Cafe & { phone?: string | null }).phone}</p>
                  )}
                  {((selected as Cafe & { website?: string | null }).website) && (
                    <p>🌐 <a href={(selected as Cafe & { website?: string | null }).website!} target="_blank" rel="noopener noreferrer">官方網站</a></p>
                  )}
                  <p style={{ marginTop: '0.5rem' }}>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ' ' + selected.address)}`} target="_blank" rel="noopener noreferrer">在 Google Maps 開啟 →</a>
                  </p>
                  <div className="tag-row">{selected.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                </div>
                <span className="score">{calculateWorkScore(selected) === 0 ? '—' : calculateWorkScore(selected)}</span>
              </div>
              <div className="detail-grid">
                <div className="detail-metric"><span>WIFI</span><strong>{displayScore(selected.wifiMbps, ' Mbps')}</strong></div>
                <div className="detail-metric"><span>QUIET</span><strong>{selected.quietScore === 0 ? '—' : selected.quietScore.toFixed(1)}</strong></div>
                <div className="detail-metric"><span>OUTLETS</span><strong>{displayScore(selected.outletRate, '%')}</strong></div>
                <div className="detail-metric"><span>PRICE</span><strong>{selected.priceMedian === 0 ? '—' : `NT$${selected.priceMedian}`}</strong></div>
                <div className="detail-metric"><span>FRIENDLY</span><strong>{selected.friendliness === 0 ? '—' : selected.friendliness.toFixed(1)}</strong></div>
                <div className="detail-metric"><span>OSM 標籤</span><strong>{selected.verifierCount} 驗證</strong></div>
              </div>
              <p className="data-note">🕐 營業時間：{selected.hours || '請見店家公告或現場確認'}</p>
              <div className="form-actions">
                <button className="button" onClick={() => setModal('verify')}>我在這裡 · 驗證評分</button>
              </div>
              <h3>到店評論 ({selected.reviews.length})</h3>
              {notice && <div className="notice">{notice}</div>}
              {selected.reviews.length === 0 ? <p className="data-note">尚無評論。成為第一位分享工作經驗的人 ↓</p> :
                selected.reviews.map((review) => <div className="review" key={review.id}><div className="review-head"><strong>{review.author} · {review.rating}/5</strong><span>{review.visitedAt}</span></div><p>{review.comment}</p></div>)}
              <form onSubmit={handleReview}>
                <div className="form-grid">
                  <div className="field"><label htmlFor="author">顯示名稱</label><input id="author" name="author" /></div>
                  <div className="field"><label htmlFor="rating">整體評分</label><select id="rating" name="rating" defaultValue="5"><option value="5">5 / 很適合</option><option value="4">4 / 推薦</option><option value="3">3 / 普通</option><option value="2">2 / 不方便</option><option value="1">1 / 不適合</option></select></div>
                  <div className="field"><label htmlFor="visitedAt">到訪日期</label><input id="visitedAt" name="visitedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
                  <div className="field full"><label htmlFor="comment">工作情境評論</label><textarea id="comment" name="comment" placeholder="例如：下午插座充足，Zoom 通話不會吵到別人…" /></div>
                </div>
                {errors.length > 0 && <p className="form-errors">{errors.join(' · ')}</p>}
                <div className="form-actions"><button className="button primary" type="submit">送出評論</button></div>
              </form>
            </div>
          </article>
        </div>
      )}

      {modal === 'add' && <ModalFrame title="新增店家（社群貢獻）" onClose={closeModal}><form onSubmit={handleAddCafe}><CafeFormFields />{errors.length > 0 && <p className="form-errors">{errors.join(' · ')}</p>}<div className="form-actions"><button className="button" type="button" onClick={closeModal}>取消</button><button className="button primary" type="submit">加入資料庫</button></div></form></ModalFrame>}
      {modal === 'verify' && selected && <ModalFrame title={`到店驗證 · ${selected.name}`} onClose={closeModal}><form onSubmit={handleVerification}><div className="form-grid"><Field name="wifiMbps" label="Speedtest WiFi (Mbps)" type="number" defaultValue={selected.wifiMbps || 50} /><Field name="quietScore" label="安靜度 (1–5)" type="number" defaultValue={selected.quietScore || 4} /><Field name="outletRate" label="插座率 (%)" type="number" defaultValue={selected.outletRate || 70} /><Field name="friendliness" label="久坐友善度 (1–5)" type="number" defaultValue={selected.friendliness || 4} /><div className="field full"><label htmlFor="photoName">座位照片證明</label><input id="photoName" name="photoName" type="file" accept="image/*" /></div></div>{errors.length > 0 && <p className="form-errors">{errors.join(' · ')}</p>}{notice && <div className="notice">{notice}</div>}<div className="form-actions"><button className="button primary" type="submit">提交驗證</button></div></form></ModalFrame>}
      {modal === 'admin' && <ModalFrame title="營運台 · 公開版" onClose={closeModal}><div className="admin-grid"><AdminCard label="ACTIVE CAFES" value={stats.activeCafes} /><AdminCard label="REVIEWS" value={stats.reviews} /><AdminCard label="VERIFICATIONS" value={stats.verifications} /><AdminCard label="CITIES" value={cities.length} /></div><p className="data-note">📊 這些是您本機的即時統計。資料來源：OpenStreetMap（{stats.activeCafes} 間咖啡廳、{cities.length} 個縣市）。所有功能免費開放，不需登入會員制。</p></ModalFrame>}
    </div>
  );
}

function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="關閉">×</button></div><div className="modal-body">{children}</div></section></div>;
}

function Field({ name, label, type = 'text', defaultValue }: { name: string; label: string; type?: string; defaultValue?: string | number }) {
  return <div className="field"><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} defaultValue={defaultValue} step="any" /></div>;
}

function CafeFormFields() {
  return <div className="form-grid"><Field name="name" label="店名" /><Field name="address" label="地址" /><div className="field"><label htmlFor="cityId">城市</label><select id="cityId" name="cityId" defaultValue="taipei">{cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}</select></div><Field name="hours" label="營業時間" defaultValue="09:00–18:00" /><Field name="lat" label="緯度" type="number" defaultValue="25.0478" /><Field name="lng" label="經度" type="number" defaultValue="121.5319" /><Field name="wifiMbps" label="WiFi Mbps" type="number" defaultValue="50" /><Field name="quietScore" label="安靜度 1–5" type="number" defaultValue="4" /><Field name="outletRate" label="插座率 0–100" type="number" defaultValue="70" /><Field name="priceMedian" label="價格中位數 NT$" type="number" defaultValue="150" /><Field name="friendliness" label="久坐友善度 1–5" type="number" defaultValue="4" /><Field name="tags" label="標籤（逗號分隔）" defaultValue="不限時, 插座多" /></div>;
}

function AdminCard({ label, value }: { label: string; value: string | number }) {
  return <div className="admin-card"><span>{label}</span><strong>{value}</strong></div>;
}
