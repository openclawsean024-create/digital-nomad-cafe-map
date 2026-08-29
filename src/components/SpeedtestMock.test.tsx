// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import SpeedtestMock from './SpeedtestMock';

describe('SpeedtestMock (SPEC §15.13 mock wifi measurement)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders an idle button labeled "Run speedtest" by default', () => {
    render(<SpeedtestMock />);
    const btn = screen.getByRole('button', { name: /run speedtest|開始測速/i });
    expect(btn).toBeTruthy();
    expect(screen.queryByTestId('speedtest-result')).toBeNull();
  });

  it('shows a progress bar while running', () => {
    render(<SpeedtestMock />);
    fireEvent.click(screen.getByRole('button', { name: /run speedtest|開始測速/i }));
    // While running: no result yet, but progress bar should be visible
    expect(screen.queryByTestId('speedtest-progress')).toBeTruthy();
    expect(screen.queryByTestId('speedtest-result')).toBeNull();
  });

  it('after the mock timer elapses, shows an Mbps value in 30..150 range', async () => {
    render(<SpeedtestMock durationMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /run speedtest|開始測速/i }));
    await waitFor(() => {
      expect(screen.queryByTestId('speedtest-result')).toBeTruthy();
    });
    const result = screen.getByTestId('speedtest-result');
    const match = result.textContent?.match(/(\d+(?:\.\d+)?)\s*Mbps/);
    expect(match).toBeTruthy();
    const value = Number(match?.[1] ?? '0');
    expect(value).toBeGreaterThanOrEqual(30);
    expect(value).toBeLessThanOrEqual(150);
  });

  it('calls onResult callback with a 30..150 Mbps number when done', async () => {
    const onResult = vi.fn();
    render(<SpeedtestMock onResult={onResult} durationMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: /run speedtest|開始測速/i }));
    await waitFor(() => {
      expect(onResult).toHaveBeenCalledTimes(1);
    });
    const arg = Number(onResult.mock.calls[0]?.[0]);
    expect(arg).toBeGreaterThanOrEqual(30);
    expect(arg).toBeLessThanOrEqual(150);
  });

  it('locks the button while running (cannot click again mid-run)', () => {
    render(<SpeedtestMock durationMs={0} />);
    const btn = screen.getByRole('button', { name: /run speedtest|開始測速/i }) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(btn.disabled).toBe(true);
  });

  it('can be re-run after the previous run finishes', async () => {
    const onResult = vi.fn();
    render(<SpeedtestMock onResult={onResult} durationMs={0} />);
    const btn = screen.getByRole('button', { name: /run speedtest|開始測速/i }) as HTMLButtonElement;
    fireEvent.click(btn);
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });
    fireEvent.click(btn);
    expect(btn.disabled).toBe(true);
    expect(onResult).toHaveBeenCalledTimes(1);
  });
});
