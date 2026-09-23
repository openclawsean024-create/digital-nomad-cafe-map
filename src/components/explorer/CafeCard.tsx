'use client';

import type { Cafe } from '@/domain/types';
import {
  evidenceLabel,
  evidenceMarker,
  formatLastVerified,
  formatMetric,
  formatWorkScore,
} from '@/domain/filter';

interface CafeCardProps {
  cafe: Cafe;
  onSelect: (cafeId: string) => void;
  isSelected: boolean;
}

export function CafeCard({ cafe, onSelect, isSelected }: CafeCardProps) {
  const marker = evidenceMarker(cafe);

  return (
    <article
      className={`cw-card${isSelected ? ' cw-card--active' : ''}`}
      data-testid="cafe-card"
      data-cafe-id={cafe.id}
      data-evidence={marker.status}
    >
      <button
        type="button"
        className="cw-card-btn"
        onClick={() => onSelect(cafe.id)}
        aria-label={`查看 ${cafe.name} 詳細資料`}
      >
        <header className="cw-card-head">
          <span
            className={`cw-evidence-pill cw-evidence-pill--${marker.status}`}
            aria-hidden="true"
            title={`資料狀態：${evidenceLabel(cafe)}`}
          />
          <div className="cw-card-titles">
            <h3 className="cw-card-title">{cafe.name}</h3>
            <p className="cw-card-where">
              {cafe.cityName} · {cafe.address}
            </p>
          </div>
          <span className="cw-card-score" data-testid="work-score">
            {formatWorkScore(cafe)}
          </span>
        </header>
        <dl className="cw-card-metrics">
          <div>
            <dt>Wi-Fi</dt>
            <dd>{formatMetric(cafe.wifiMbps, 'Mbps')}</dd>
          </div>
          <div>
            <dt>安靜</dt>
            <dd>{formatMetric(cafe.quietScore, '/5')}</dd>
          </div>
          <div>
            <dt>插座</dt>
            <dd>{formatMetric(cafe.outletRate, '%')}</dd>
          </div>
          <div>
            <dt>價格</dt>
            <dd>{formatMetric(cafe.priceMedian, '$')}</dd>
          </div>
        </dl>
        <footer className="cw-card-foot">
          <span className="cw-evidence-label">{evidenceLabel(cafe)}</span>
          <span className="cw-card-verified">
            {formatLastVerified(cafe.lastVerifiedAt)}
          </span>
        </footer>
      </button>
    </article>
  );
}
