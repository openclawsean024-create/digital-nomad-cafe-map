'use client';

import { JSX, useEffect, useRef, useState } from 'react';

export interface SpeedtestMockProps {
  /**
   * Called once when the mock run completes. Argument is a random Mbps in
   * the SPEC §15.13 range 30..150 (inclusive). No real speedtest service is
   * called — credentials are not provided per Stage 5 boundary.
   */
  onResult?: (mbps: number) => void;
  /**
   * Optional override for the mocked elapsed milliseconds. Defaults to 1500
   * to keep the UX snappy; tests can pass `0` to advance instantly.
   */
  durationMs?: number;
}

type RunState = 'idle' | 'running' | 'done';

const DEFAULT_DURATION_MS = 1500;
const MIN_MBPS = 30;
const MAX_MBPS = 150;

function pickRandomMbps(): number {
  // Single Math.random call keeps the distribution uniform; round to 1 dp.
  const value = MIN_MBPS + Math.random() * (MAX_MBPS - MIN_MBPS);
  return Math.round(value * 10) / 10;
}

export default function SpeedtestMock({
  onResult,
  durationMs = DEFAULT_DURATION_MS,
}: SpeedtestMockProps): JSX.Element {
  const [state, setState] = useState<RunState>('idle');
  const [progress, setProgress] = useState(0);
  const [mbps, setMbps] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleRun(): void {
    if (state === 'running') return;
    setState('running');
    setMbps(null);
    setProgress(0);
    timerRef.current = setTimeout(() => {
      const value = pickRandomMbps();
      setMbps(value);
      setProgress(100);
      setState('done');
      onResult?.(value);
    }, durationMs);
  }

  return (
    <section className="speedtest-mock" aria-label="WiFi speedtest mock">
      <button
        type="button"
        className="button primary speedtest-run"
        onClick={handleRun}
        disabled={state === 'running'}
        data-testid="speedtest-run"
      >
        {state === 'running' ? '測速中…' : 'Run speedtest · 開始測速'}
      </button>
      {state === 'running' ? (
        <div
          className="speedtest-progress"
          data-testid="speedtest-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="speedtest-progress-bar" style={{ width: `${Math.max(10, progress)}%` }} />
        </div>
      ) : null}
      {state === 'done' && mbps !== null ? (
        <p className="speedtest-result" data-testid="speedtest-result">
          WiFi speed: <strong>{mbps} Mbps</strong>
          <span className="speedtest-note">（mock 30–150 Mbps 隨機值；非真實測速）</span>
        </p>
      ) : null}
    </section>
  );
}
