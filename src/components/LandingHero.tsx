'use client';

import type { JSX } from 'react';

export default function LandingHero(): JSX.Element {
  return (
    <header className="landing-hero">
      <p className="section-kicker">Deskbound — Stage 5 pilot (Day 1)</p>
      <h1 className="landing-headline">
        Find a cafe that actually lets you work.
        <span className="landing-headline-sub">
          WiFi speed, power outlets, no time limit. Verified by humans.
        </span>
      </h1>
      <p className="landing-sub">
        全台 4357 間咖啡廳 × 5 維評分 × 到店驗證。
        <br />
        訂閱 Day 1 launch，第一批到店驗證名單優先開放。
      </p>
    </header>
  );
}