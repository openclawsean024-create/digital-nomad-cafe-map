'use client';

import {
  ChangeEvent,
  FormEvent,
  JSX,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const VERIFICATIONS_KEY = 'deskbound-verifications-v1';

/**
 * SPEC §15.13 5 維評分 labels. These MUST match the labels used in
 * /landing (page.tsx) and src/components/CafeExplorer.tsx — see ADR-003.
 */
export const FIVE_DIM_LABELS = ['WiFi', '安靜', '插座', '價格', '友善'] as const;
export type FiveDimLabel = typeof FIVE_DIM_LABELS[number];

export interface VerificationPayload {
  wifiMbps: number;
  quietScore: number;
  outletRate: number;
  priceMedian: number; // stored for completeness even though 5-dim form uses 1-5
  friendliness: number;
  photoName: string;
  photoDataUrl?: string;
  ts: string;
}

export interface VerifyFormProps {
  /**
   * Pre-fill wifiMbps (e.g. after the SpeedtestMock finishes). The field
   * remains editable so the founder can override.
   */
  initialWifiMbps?: number | null;
}

const RATING_OPTIONS: ReadonlyArray<number> = [1, 2, 3, 4, 5];

function readStoredVerifications(): VerificationPayload[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(VERIFICATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is VerificationPayload => {
      if (typeof entry !== 'object' || entry === null) return false;
      const v = entry as Record<string, unknown>;
      return (
        typeof v.wifiMbps === 'number' &&
        typeof v.quietScore === 'number' &&
        typeof v.outletRate === 'number' &&
        typeof v.friendliness === 'number' &&
        typeof v.photoName === 'string' &&
        typeof v.ts === 'string'
      );
    });
  } catch {
    return [];
  }
}

export default function VerifyForm({ initialWifiMbps = null }: VerifyFormProps): JSX.Element {
  const [wifiMbps, setWifiMbps] = useState<string>(
    initialWifiMbps !== null ? String(initialWifiMbps) : ''
  );
  const [ratings, setRatings] = useState<Record<FiveDimLabel, number | null>>({
    WiFi: null,
    安靜: null,
    插座: null,
    價格: null,
    友善: null,
  });
  const [photoName, setPhotoName] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<VerificationPayload | null>(null);

  useEffect(() => {
    if (initialWifiMbps !== null) setWifiMbps(String(initialWifiMbps));
  }, [initialWifiMbps]);

  const groupDefs = useMemo(
    () =>
      FIVE_DIM_LABELS.map((label) => ({
        label,
        // WiFi group shows Mbps input; the other 4 use 1–5 rating radios
        kind: label === 'WiFi' ? 'mbps' : 'rating',
      })),
    []
  );

  function setRating(label: FiveDimLabel, value: number): void {
    setRatings((prev) => ({ ...prev, [label]: value }));
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setPhotoName('');
      setPhotoDataUrl(null);
      return;
    }
    setPhotoName(file.name);
    // Render preview as data URL (mock-only — no actual upload per boundary)
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoDataUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    const wifi = Number(wifiMbps);
    if (!wifiMbps || Number.isNaN(wifi) || wifi < 0) {
      setError('請先跑 speedtest 取得 WiFi Mbps（或手動輸入 ≥ 0 的數字）');
      return;
    }
    const quiet = ratings.安靜;
    const outlet = ratings.插座;
    const price = ratings.價格;
    const friendly = ratings.友善;
    if (quiet === null || outlet === null || price === null || friendly === null) {
      setError('請為 安靜 / 插座 / 價格 / 友善 4 個維度各選一個評分');
      return;
    }
    if (!photoName.trim()) {
      setError('請選擇至少一張座位照片');
      return;
    }

    const payload: VerificationPayload = {
      wifiMbps: wifi,
      quietScore: quiet,
      outletRate: outlet,
      priceMedian: 0, // not captured in 1-5 rating (UI stores rating only)
      friendliness: friendly,
      photoName,
      photoDataUrl: photoDataUrl ?? undefined,
      ts: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      const existing = readStoredVerifications();
      window.localStorage.setItem(
        VERIFICATIONS_KEY,
        JSON.stringify([...existing, payload])
      );
    }
    setSuccess(payload);
    // eslint-disable-next-line no-console
    console.log('[verify] verification saved', payload);
  }

  if (success) {
    return (
      <section className="verify-success" data-testid="verify-success">
        <h2>驗證已儲存 · Verification saved</h2>
        <p>
          感謝到店驗證！這筆資料已寫到 localStorage
          (<code>{VERIFICATIONS_KEY}</code>)；Day 1 正式啟動 Supabase 後會 sync 上去。
        </p>
        <dl className="verify-summary">
          <dt>WiFi</dt><dd>{success.wifiMbps} Mbps</dd>
          <dt>安靜</dt><dd>{success.quietScore}/5</dd>
          <dt>插座</dt><dd>{success.outletRate}/5</dd>
          <dt>價格</dt><dd>{success.priceMedian === 0 ? '—' : `${success.priceMedian}/5`}</dd>
          <dt>友善</dt><dd>{success.friendliness}/5</dd>
          <dt>照片</dt><dd>{success.photoName}</dd>
        </dl>
        <button
          type="button"
          className="button ghost verify-another"
          onClick={() => {
            setSuccess(null);
            setPhotoName('');
            setPhotoDataUrl(null);
            setRatings({ WiFi: null, 安靜: null, 插座: null, 價格: null, 友善: null });
            setWifiMbps('');
          }}
        >
          驗證下一家
        </button>
      </section>
    );
  }

  return (
    <form className="verify-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="verify-fieldset">
        <legend>1. WiFi 速度（speedtest mock）</legend>
        <label htmlFor="verify-wifi" className="verify-field-label">
          WiFi Mbps
          <input
            id="verify-wifi"
            type="number"
            min={0}
            step="0.1"
            placeholder="請先按上方 Run speedtest"
            aria-label="WiFi Mbps"
            value={wifiMbps}
            onChange={(event) => setWifiMbps(event.target.value)}
          />
        </label>
      </fieldset>

      {groupDefs
        .filter((g) => g.kind === 'rating')
        .map((group) => (
          <fieldset key={group.label} className="verify-fieldset">
            <legend>2/3/4/5. {group.label}（1 最差 / 5 最好）</legend>
            <div
              className="verify-radios"
              role="radiogroup"
              aria-label={`${group.label} rating`}
            >
              {RATING_OPTIONS.map((value) => {
                const id = `verify-${group.label}-${value}`;
                const checked = ratings[group.label] === value;
                return (
                  <label key={id} htmlFor={id} className={`verify-radio ${checked ? 'selected' : ''}`}>
                    <input
                      id={id}
                      type="radio"
                      name={`rating-${group.label}`}
                      value={value}
                      checked={checked}
                      onChange={() => setRating(group.label, value)}
                    />
                    <span>{value}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

      <fieldset className="verify-fieldset">
        <legend>6. 座位照片</legend>
        <label htmlFor="verify-photo" className="verify-field-label">
          座位照片（選擇檔案 — mock 不會上傳）
          <input
            id="verify-photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            aria-label="座位照片 photo upload"
          />
        </label>
        {photoName ? (
          <p className="verify-photo-name" data-testid="verify-photo-name">
            已選擇：<strong>{photoName}</strong>
            {photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoDataUrl}
                alt={photoName}
                className="verify-photo-preview"
              />
            ) : null}
          </p>
        ) : null}
      </fieldset>

      {error ? (
        <p role="alert" className="verify-error">{error}</p>
      ) : null}

      <div className="verify-actions">
        <button type="submit" className="button primary verify-submit">
          Submit verification · 送出驗證
        </button>
      </div>

      <p className="verify-note">
        Demo mode — submit 寫 localStorage（<code>{VERIFICATIONS_KEY}</code>），不會呼叫任何外部 service。
      </p>
    </form>
  );
}
