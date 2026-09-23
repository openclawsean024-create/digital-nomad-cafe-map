'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import type { Cafe } from '@/domain/types';
import {
  evidenceLabel,
  evidenceMarker,
  formatLastVerified,
  formatMetric,
  formatWorkScore,
} from '@/domain/filter';

interface DetailModalProps {
  cafe: Cafe | null;
  onClose: () => void;
  /** Called whenever Escape / X / backdrop closes the modal. */
  onClosed: () => void;
}

export function DetailModal({ cafe, onClose, onClosed }: DetailModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!cafe) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    closeRef.current?.focus();
    document.body.dataset['modalOpen'] = 'true';
    return () => {
      document.body.dataset['modalOpen'] = 'false';
      previouslyFocused.current?.focus?.();
    };
  }, [cafe]);

  useEffect(() => {
    if (!cafe) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cafe, onClose]);

  if (!cafe) return null;

  const marker = evidenceMarker(cafe);

  const onBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="cw-modal"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
      data-testid="detail-modal"
    >
      <div
        ref={dialogRef}
        className="cw-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onKeyDown={onDialogKeyDown}
        tabIndex={-1}
      >
        <header className="cw-modal-head">
          <div>
            <p className="cw-modal-eyebrow">{cafe.cityName}</p>
            <h2 id="detail-modal-title">{cafe.name}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="cw-modal-close"
            onClick={() => {
              onClose();
              onClosed();
            }}
            aria-label="關閉詳細資料"
            data-testid="detail-modal-close"
          >
            ×
          </button>
        </header>

        <section className="cw-modal-meta">
          <span
            className={`cw-evidence-pill cw-evidence-pill--${marker.status}`}
            aria-hidden="true"
          />
          <div>
            <p className="cw-modal-meta-label">資料狀態</p>
            <p className="cw-modal-meta-value">{evidenceLabel(cafe)}</p>
            <p className="cw-modal-meta-foot">
              最後驗證 {formatLastVerified(cafe.lastVerifiedAt)} ・ {cafe.verifierCount} 位驗證者
            </p>
          </div>
        </section>

        <section className="cw-modal-metrics" aria-label="五維工作條件">
          <article>
            <h4>Wi-Fi</h4>
            <p>{formatMetric(cafe.wifiMbps, 'Mbps')}</p>
            <p className="cw-modal-foot-note">未驗證時不會顯示建議速度</p>
          </article>
          <article>
            <h4>安靜</h4>
            <p>{formatMetric(cafe.quietScore, '/5')}</p>
            <p className="cw-modal-foot-note">參考自最近一次實測, 1=熱鬧, 5=安靜</p>
          </article>
          <article>
            <h4>插座</h4>
            <p>{formatMetric(cafe.outletRate, '%')}</p>
            <p className="cw-modal-foot-note">實測座位旁有插座的百分比</p>
          </article>
          <article>
            <h4>價格</h4>
            <p>{formatMetric(cafe.priceMedian, '$')}</p>
            <p className="cw-modal-foot-note">單點飲品中位數</p>
          </article>
          <article>
            <h4>友善度</h4>
            <p>{formatMetric(cafe.friendliness, '/5')}</p>
            <p className="cw-modal-foot-note">不限時 / 歡迎久坐 / 不趕人</p>
          </article>
        </section>

        <section className="cw-modal-summary">
          <p>
            工作條件總分：<strong>{formatWorkScore(cafe)}</strong>
          </p>
          {cafe.phone ? <p>電話：{cafe.phone}</p> : null}
          {cafe.website ? (
            <p>
              網站：{' '}
              <a href={cafe.website} target="_blank" rel="noreferrer">
                {cafe.website}
              </a>
            </p>
          ) : null}
          <p>營業時間：{cafe.hours}</p>
        </section>

        <section className="cw-modal-source" aria-label="資料來源">
          <h3>資料來源與補資料流程</h3>
          <p>
            收錄自 OpenStreetMap 公開資料 ({cafe.id})；五維評分尚未通過在地實地驗證。
            補資料屬於 <strong>local-only</strong>，只會存於你的瀏覽器：
          </p>
          <ul>
            <li>匯出 localStorage 備份（開發者工具 → Application → IndexedDB ＋ localStorage）</li>
            <li>正式上線前會提供個人 export，不會與公開伺服器同步</li>
            <li>所有人驗證流程只對 <code>?founder=1</code> 持票者開放</li>
          </ul>
        </section>

        <footer className="cw-modal-foot">
          <button
            type="button"
            className="cw-btn cw-btn--primary"
            onClick={() => {
              onClose();
              onClosed();
            }}
          >
            關閉
          </button>
        </footer>
      </div>
    </div>
  );
}
