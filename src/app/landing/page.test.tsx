// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LandingPage from './page';

const EMAIL_KEY = 'deskbound-pilot-emails-v1';

describe('/landing page (SPEC §15.13.1)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
  });

  it('renders the SPEC hero copy', () => {
    render(<LandingPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Find a cafe that actually lets you work/i })
    ).toBeTruthy();
  });

  it('renders all five SPEC 5-dim labels in the demo section (WiFi / 安靜 / 插座 / 價格 / 友善)', () => {
    render(<LandingPage />);
    const demos = screen.getAllByLabelText(/5-dim demo/i);
    // Only one section should be rendered at a time
    expect(demos.length).toBeGreaterThanOrEqual(1);
    const demo = demos[0];
    const labels = Array.from(demo.querySelectorAll('li strong')).map((node) => node.textContent);
    for (const expected of ['WiFi', '安靜', '插座', '價格', '友善']) {
      expect(labels).toContain(expected);
    }
    expect(demo.querySelectorAll('li strong').length).toBe(5);
  });

  it('renders an email capture form with submit button', () => {
    render(<LandingPage />);
    const inputs = screen.getAllByRole('textbox', { name: /email/i });
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole('button', { name: /notify|訂閱|launch/i }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('writes the submitted email to localStorage and shows thank-you state', async () => {
    render(<LandingPage />);
    const input = screen.getAllByRole('textbox', { name: /email/i })[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'founder@deskbound.test' } });
    const submit = screen.getAllByRole('button', { name: /notify|訂閱|launch/i })[0];
    fireEvent.click(submit);
    await waitFor(() => {
      const raw = window.localStorage.getItem(EMAIL_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw ?? '[]') as Array<{ email: string }>;
      expect(parsed.some((entry) => entry.email === 'founder@deskbound.test')).toBe(true);
    });
    expect(screen.getAllByText(/founder@deskbound\.test/).length).toBeGreaterThanOrEqual(1);
  });

  it('rejects malformed email addresses', () => {
    render(<LandingPage />);
    const input = screen.getAllByRole('textbox', { name: /email/i })[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getAllByRole('button', { name: /notify|訂閱|launch/i })[0]);
    expect(screen.getAllByRole('alert')[0].textContent).toMatch(/email/i);
    expect(window.localStorage.getItem(EMAIL_KEY)).toBeNull();
  });

  it('exposes a "back to map" link to /', () => {
    render(<LandingPage />);
    const links = screen.getAllByRole('link', { name: /back to.*map/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].getAttribute('href')).toBe('/');
  });
});