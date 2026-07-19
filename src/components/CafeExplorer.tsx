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
  loadUnlockUntil,
  saveCityReminders,
  saveContributedCafes,
  saveDemoUnlock,
} from '@/lib/storage';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
type Modal = 'add' | 'admin' | 'unlock' | 'verify' | null;
type MobileView = 'list' | 'map' | 'filters';

const defaultFilters: CafeFilters = { cityId: 'taipei', query: '', minWifi: 0, minQuiet: 0, minOutlets: 0, sortBy: 'workScore' };

function numberFromForm(form: FormData, key: string): number {
  return Number(form.get(key) ?? 0);
}

export default function CafeExplorer() {
  const [cafes, setCafes] = useState<Cafe[]>(seedCafes);
  const [filters, setFilters] = useState<CafeFilters>(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [unlockUntil, setUnlockUntil] = useState<string | null>(null);
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    setCafes(mergeCafeCollections(seedCafes, loadContributedCafes()));
    setUnlockUntil(loadUnlockUntil());
    setReminders(loadCityReminders());
  }, []);

  const filtered = useMemo(() => filterAndSortCafes(cafes, filters), [cafes, filters]);
  const selected = cafes.find((cafe) => cafe.id === selectedId) ?? null;
  const selectedCity = cities.find((city) => city.id === filters.cityId);
  const cityCafes = filtered.filter((cafe) => filters.cityId === 'all' || cafe.cityId === filters.cityId);
  const stats = buildAdminStats(cafes);
  const averageWifi = filtered.length ? Math.round(filtered.reduce((total, cafe) => total + cafe.wifiMbps, 0) / filtered.length) : 0;

  const setFilter = <Key extends keyof CafeFilters>(key: Key, value: CafeFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const selectCafe = (cafe: Cafe) => {
    const cityIndex = cityCafes.findIndex((item) => item.id === cafe.id);
    if (!canAccessCafe(cityIndex, unlockUntil)) {
      setSelectedId(cafe.id);
      setModal('unlock');
      return;
    }
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
    const contributedIds = new Set(loadContributedCafes().map((cafe) => cafe.id));
    saveContributedCafes(updated.filter((cafe) => contributedIds.has(cafe.id) || cafe.id === selected.id));
    setNotice('評論已儲存在這台裝置，感謝補上真實工作情境。');
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
    const updated = cafes.map((cafe) => cafe.id === selected.id ? {
      ...cafe, wifiMbps: Math.round((cafe.wifiMbps * cafe.verifierCount + input.wifiMbps) / (cafe.verifierCount + 1)),
      quietScore: Math.round(((cafe.quietScore * cafe.verifierCount + input.quietScore) / (cafe.verifierCount + 1)) * 10) / 10,
      outletRate: Math.round((cafe.outletRate * cafe.verifierCount + input.outletRate) / (cafe.verifierCount + 1)),
      friendliness: Math.round(((cafe.friendliness * cafe.verifierCount + input.friendliness) / (cafe.verifierCount + 1)) * 10) / 10,
      verifierCount: cafe.verifierCount + 1, lastVerifiedAt: new Date().toISOString(),
    } : cafe);
    setCafes(updated);
    const contributedIds = new Set(loadContributedCafes().map((cafe) => cafe.id));
    saveContributedCafes(updated.filter((cafe) => contributedIds.has(cafe.id) || cafe.id === selected.id));
    setNotice('到店驗證已更新，獲得 1 個驗證點。照片僅記錄檔名，未上傳到伺服器。');
    setErrors([]);
  };

  const handleUnlock = () => {
    const value = saveDemoUnlock();
    setUnlockUntil(value);
    setNotice(`Demo 解鎖有效至 ${new Date(value).toLocaleDateString('zh-TW')}。正式金流需設定 Stripe secrets。`);
  };

  const toggleReminder = (cityId: string) => {
    const next = reminders.includes(cityId) ? reminders.filter((id) => id !== cityId) : addCityReminder(reminders, cityId);
    setReminders(next);
    saveCityReminders(next);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">DB</div><div><strong>Deskbound</strong><span>nomad cafe signal map</span></div></div>
        <label className="global-search"><input aria-label="搜尋店名或地址" value={filters.query} onChange={(event) => setFilter('query', event.target.value)} placeholder="搜尋店名、地址、城市" /></label>
        <div className="top-actions">
          <button className="button ghost" onClick={() => setModal('admin')}>營運台</button>
          <button className="button primary" onClick={() => setModal('add')}>新增店家</button>
        </div>
      </header>

      <section className="stat-strip" aria-label="資料摘要">
        <div className="stat"><span className="stat-label">搜尋結果</span><span className="stat-value">{filtered.length} 間</span></div>
        <div className="stat"><span className="stat-label">平均 WiFi</span><span className="stat-value">{averageWifi} Mbps</span></div>
        <div className="stat"><span className="stat-label">城市資料庫</span><span className="stat-value">{cities.length} 城</span></div>
        <div className="stat"><span className="stat-label">資料狀態</span><span className="stat-value">COMMUNITY SEED</span></div>
      </section>

      <main className="workspace" data-mobile-view={mobileView}>
        <aside className="filters">
          <p className="section-kicker">01 / 工作條件</p>
          <div className="filter-group"><label htmlFor="city">城市</label><select id="city" value={filters.cityId} onChange={(event) => setFilter('cityId', event.target.value)}><option value="all">全球全部城市</option>{cities.map((city) => <option value={city.id} key={city.id}>{city.name} · {city.country}</option>)}</select></div>
          <div className="filter-group"><label htmlFor="wifi">最低 WiFi <output>{filters.minWifi} Mbps</output></label><input id="wifi" type="range" min="0" max="150" step="10" value={filters.minWifi} onChange={(event) => setFilter('minWifi', Number(event.target.value))} /><div className="filter-ticks"><span>不限</span><span>150+</span></div></div>
          <div className="filter-group"><label htmlFor="quiet">最低安靜度 <output>{filters.minQuiet.toFixed(1)} / 5</output></label><input id="quiet" type="range" min="0" max="5" step="0.5" value={filters.minQuiet} onChange={(event) => setFilter('minQuiet', Number(event.target.value))} /><div className="filter-ticks"><span>熱鬧</span><span>深度工作</span></div></div>
          <div className="filter-group"><label htmlFor="outlets">最低插座率 <output>{filters.minOutlets}%</output></label><input id="outlets" type="range" min="0" max="100" step="10" value={filters.minOutlets} onChange={(event) => setFilter('minOutlets', Number(event.target.value))} /><div className="filter-ticks"><span>不限</span><span>每桌都有</span></div></div>
          <div className="filter-group"><label htmlFor="sort">排序</label><select id="sort" value={filters.sortBy} onChange={(event) => setFilter('sortBy', event.target.value as CafeFilters['sortBy'])}><option value="workScore">適合工作分數</option><option value="wifi">WiFi 速度</option><option value="verified">驗證人數</option></select></div>
          <p className="section-kicker">02 / 每週提醒</p>
          {(filters.cityId === 'all' ? cities.filter((city) => city.pilot).slice(0, 3) : cities.filter((city) => city.id === filters.cityId)).map((city) => <button key={city.id} className={`reminder-chip ${reminders.includes(city.id) ? 'active' : ''}`} onClick={() => toggleReminder(city.id)}>{reminders.includes(city.id) ? '已追蹤' : '追蹤'} {city.name} 更新</button>)}
          <div className="data-note">資料透明度：48 間台灣 pilot 店與全球示範點為 community seed，用來驗證產品流程，不宣稱是即時商家資訊。使用者新增與評論會保存在本機。</div>
        </aside>

        <section className="map-panel" aria-label="咖啡廳地圖">
          <MapView cafes={filtered} selectedId={selectedId} selectedCity={selectedCity} onSelect={selectCafe} />
          <div className="map-caption"><strong>{selectedCity ? `${selectedCity.name} 工作訊號` : '全球工作訊號'}</strong><span>Marker 數字為 5 維加權工作分數</span></div>
          <div className="map-legend"><span className="legend-pill">WiFi 30%</span><span className="legend-pill">安靜 30%</span><span className="legend-pill">插座 20%</span></div>
        </section>

        <section className="results">
          <div className="results-head"><div><h1>能工作的地方</h1><p>{selectedCity ? `${selectedCity.name.toUpperCase()} / ` : 'GLOBAL / '}{filtered.length} RESULTS</p></div><button className="button small" onClick={() => setFilters(defaultFilters)}>重設</button></div>
          <div className="result-list">
            {filtered.map((cafe, index) => {
              const locked = !canAccessCafe(index, unlockUntil);
              return <button className={`cafe-card ${selectedId === cafe.id ? 'selected' : ''} ${locked ? 'locked' : ''}`} key={cafe.id} onClick={() => selectCafe(cafe)}>
                <div className="card-top"><div className="card-title-row"><div><h2>{cafe.name}</h2><p className="card-address">{cafe.address}</p></div><span className="score">{calculateWorkScore(cafe)}</span></div><div className="tag-row">{cafe.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div>
                <div className="metrics"><div className="metric"><span>WiFi</span><strong>{cafe.wifiMbps} Mbps</strong></div><div className="metric"><span>安靜</span><strong>{cafe.quietScore.toFixed(1)} / 5</strong></div><div className="metric"><span>插座</span><strong>{cafe.outletRate}%</strong></div></div>
                <div className="card-foot"><span>{cafe.cityName} · NT${cafe.priceMedian}</span><span>{formatRelativeDate(cafe.lastVerifiedAt)} · {cafe.verifierCount} 人</span></div>
              </button>;
            })}
            {filtered.length === 0 && <div className="data-note">沒有符合全部條件的咖啡廳。降低一個篩選門檻，或新增你剛找到的店。</div>}
          </div>
        </section>
      </main>

      <nav className="mobile-tabs" aria-label="手機視圖"><button className={mobileView === 'filters' ? 'active' : ''} onClick={() => setMobileView('filters')}>篩選</button><button className={mobileView === 'map' ? 'active' : ''} onClick={() => setMobileView('map')}>地圖</button><button className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>清單</button></nav>

      {selected && modal === null && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}><article className="modal" role="dialog" aria-modal="true" aria-labelledby="cafe-title"><div className="modal-head"><span className="section-kicker">咖啡廳詳情</span><button className="icon-button" onClick={() => setSelectedId(null)} aria-label="關閉">×</button></div><div className="modal-body"><div className="detail-hero"><div><h2 id="cafe-title">{selected.name}</h2><p>{selected.address}</p><div className="tag-row">{selected.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div><span className="score">{calculateWorkScore(selected)}</span></div>
        <div className="detail-grid"><div className="detail-metric"><span>WIFI</span><strong>{selected.wifiMbps} Mbps</strong></div><div className="detail-metric"><span>QUIET</span><strong>{selected.quietScore.toFixed(1)}</strong></div><div className="detail-metric"><span>OUTLETS</span><strong>{selected.outletRate}%</strong></div><div className="detail-metric"><span>PRICE</span><strong>NT${selected.priceMedian}</strong></div><div className="detail-metric"><span>FRIENDLY</span><strong>{selected.friendliness.toFixed(1)}</strong></div></div>
        <div className="form-actions"><button className="button" onClick={() => setModal('verify')}>我在這裡 · 驗證</button></div>
        <h3>到店評論</h3>{notice && <div className="notice">{notice}</div>}{selected.reviews.map((review) => <div className="review" key={review.id}><div className="review-head"><strong>{review.author} · {review.rating}/5</strong><span>{review.visitedAt}</span></div><p>{review.comment}</p></div>)}
        <form onSubmit={handleReview}><div className="form-grid"><div className="field"><label htmlFor="author">顯示名稱</label><input id="author" name="author" /></div><div className="field"><label htmlFor="rating">整體評分</label><select id="rating" name="rating" defaultValue="5"><option value="5">5 / 很適合</option><option value="4">4 / 推薦</option><option value="3">3 / 普通</option><option value="2">2 / 不方便</option><option value="1">1 / 不適合</option></select></div><div className="field"><label htmlFor="visitedAt">到訪日期</label><input id="visitedAt" name="visitedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div><div className="field full"><label htmlFor="comment">工作情境評論</label><textarea id="comment" name="comment" placeholder="例如：下午插座充足，Zoom 通話不會吵到別人…" /></div></div>{errors.length > 0 && <p className="form-errors">{errors.join(' · ')}</p>}<div className="form-actions"><button className="button primary" type="submit">送出評論</button></div></form>
      </div></article></div>}

      {modal === 'add' && <ModalFrame title="新增社群店家" onClose={closeModal}><form onSubmit={handleAddCafe}><CafeFormFields />{errors.length > 0 && <p className="form-errors">{errors.join(' · ')}</p>}<div className="form-actions"><button className="button" type="button" onClick={closeModal}>取消</button><button className="button primary" type="submit">加入資料庫</button></div></form></ModalFrame>}
      {modal === 'unlock' && <ModalFrame title="解鎖完整地圖" onClose={closeModal}><p>免費版每城市可查看前 3 間。NT$199 一次解鎖 30 天，包含全部城市、評論與驗證細節。</p>{notice && <div className="notice">{notice}</div>}<div className="form-actions"><button className="button primary" onClick={handleUnlock}>啟用 30 天 Demo 解鎖</button></div><p className="data-note">此 production sprint 未提供 Stripe 金鑰，因此按鈕只啟用可驗證的本機 demo entitlement，不會收款。</p></ModalFrame>}
      {modal === 'verify' && selected && <ModalFrame title={`到店驗證 · ${selected.name}`} onClose={closeModal}><form onSubmit={handleVerification}><div className="form-grid"><Field name="wifiMbps" label="Speedtest WiFi (Mbps)" type="number" defaultValue={selected.wifiMbps} /><Field name="quietScore" label="安靜度 (1–5)" type="number" defaultValue={selected.quietScore} /><Field name="outletRate" label="插座率 (%)" type="number" defaultValue={selected.outletRate} /><Field name="friendliness" label="久坐友善度 (1–5)" type="number" defaultValue={selected.friendliness} /><div className="field full"><label htmlFor="photoName">座位照片證明</label><input id="photoName" name="photoName" type="file" accept="image/*" /></div></div>{errors.length > 0 && <p className="form-errors">{errors.join(' · ')}</p>}{notice && <div className="notice">{notice}</div>}<div className="form-actions"><button className="button primary" type="submit">提交驗證</button></div></form></ModalFrame>}
      {modal === 'admin' && <ModalFrame title="營運台 · Pilot" onClose={closeModal}><div className="admin-grid"><AdminCard label="ACTIVE CAFES" value={stats.activeCafes} /><AdminCard label="REVIEWS" value={stats.reviews} /><AdminCard label="VERIFICATIONS" value={stats.verifications} /><AdminCard label="EST. SIGNAL" value={`NT$${stats.estimatedRevenue}`} /></div><p className="data-note">營收為 demo proxy 指標，不是 Stripe 真實交易。管理員可用「新增店家」建立與更新本機 contribution dataset；正式審核需接 Supabase production credentials。</p></ModalFrame>}
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
  return <div className="form-grid"><Field name="name" label="店名" /><Field name="address" label="地址" /><div className="field"><label htmlFor="cityId">城市</label><select id="cityId" name="cityId" defaultValue="taipei">{cities.map((city) => <option value={city.id} key={city.id}>{city.name} · {city.country}</option>)}</select></div><Field name="hours" label="營業時間" defaultValue="09:00–18:00" /><Field name="lat" label="緯度" type="number" defaultValue="25.0478" /><Field name="lng" label="經度" type="number" defaultValue="121.5319" /><Field name="wifiMbps" label="WiFi Mbps" type="number" defaultValue="50" /><Field name="quietScore" label="安靜度 1–5" type="number" defaultValue="4" /><Field name="outletRate" label="插座率 0–100" type="number" defaultValue="70" /><Field name="priceMedian" label="價格中位數 NT$" type="number" defaultValue="150" /><Field name="friendliness" label="久坐友善度 1–5" type="number" defaultValue="4" /><Field name="tags" label="標籤（逗號分隔）" defaultValue="不限時, 插座多" /></div>;
}

function AdminCard({ label, value }: { label: string; value: string | number }) {
  return <div className="admin-card"><span>{label}</span><strong>{value}</strong></div>;
}
