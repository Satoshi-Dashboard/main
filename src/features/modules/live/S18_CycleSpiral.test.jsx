import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import S18_CycleSpiral from './S18_CycleSpiral';

const MOCK_WAYPOINTS = [
  { ts: Date.UTC(2020, 4, 11), price: 8800 },
  { ts: Date.UTC(2021, 10, 10), price: 69000 },
  { ts: Date.UTC(2023, 6, 1), price: 30500 },
  { ts: Date.UTC(2024, 2, 14), price: 72000 },
];

vi.mock('@/shared/hooks/useBinanceHistoricalBTC', () => ({
  useBinanceHistoricalBTC: () => ({
    waypoints: MOCK_WAYPOINTS,
    loading: false,
    error: null,
    dataPoints: MOCK_WAYPOINTS.length,
    latestPrice: MOCK_WAYPOINTS[MOCK_WAYPOINTS.length - 1].price,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/shared/components/module', () => ({
  ModuleShell: ({ children }) => <div>{children}</div>,
}));

function readTransform(element) {
  const match = element.style.transform.match(
    /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([-\d.]+)\)/
  );

  if (!match) {
    throw new Error(`Unexpected transform: ${element.style.transform}`);
  }

  return {
    x: Number.parseFloat(match[1]),
    y: Number.parseFloat(match[2]),
    scale: Number.parseFloat(match[3]),
  };
}

async function renderSpiral() {
  render(<S18_CycleSpiral />);
  const area = await screen.findByTestId('cycle-spiral-interaction-area');

  await waitFor(() => {
    expect(readTransform(area).scale).toBeCloseTo(1, 5);
  });

  return area;
}

describe('S18_CycleSpiral interactions', () => {
  it('updates zoom scale and transform on wheel input', async () => {
    const area = await renderSpiral();

    fireEvent.wheel(area, { deltaY: -120, clientX: 400, clientY: 300 });

    await waitFor(() => {
      const transform = readTransform(area);
      expect(transform.scale).toBeCloseTo(1.1, 5);
      expect(transform.x).not.toBe(0);
      expect(transform.y).not.toBe(0);
    });
  });

  it('clamps zoom between the supported minimum and maximum', async () => {
    const area = await renderSpiral();

    for (let index = 0; index < 16; index += 1) {
      fireEvent.wheel(area, { deltaY: -120, clientX: 450, clientY: 360 });
    }

    await waitFor(() => {
      expect(readTransform(area).scale).toBeCloseTo(3, 5);
    });

    for (let index = 0; index < 40; index += 1) {
      fireEvent.wheel(area, { deltaY: 120, clientX: 450, clientY: 360 });
    }

    await waitFor(() => {
      expect(readTransform(area).scale).toBeCloseTo(0.5, 5);
    });
  });

  it('starts dragging on pointer down, pans on move, and stops on pointer up', async () => {
    const area = await renderSpiral();

    fireEvent.pointerDown(area, { button: 0, clientX: 100, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(area, { buttons: 1, clientX: 145, clientY: 175, pointerId: 1 });

    await waitFor(() => {
      const transform = readTransform(area);
      expect(transform.x).toBeCloseTo(45, 5);
      expect(transform.y).toBeCloseTo(55, 5);
    });

    fireEvent.pointerUp(area, { button: 0, clientX: 145, clientY: 175, pointerId: 1 });
    const transformAfterPointerUp = readTransform(area);

    fireEvent.pointerMove(area, { buttons: 1, clientX: 200, clientY: 240, pointerId: 1 });

    expect(readTransform(area)).toEqual(transformAfterPointerUp);
  });

  it('stops dragging when the pointer leaves the interactive area', async () => {
    const area = await renderSpiral();

    fireEvent.pointerDown(area, { button: 0, clientX: 200, clientY: 220, pointerId: 1 });
    fireEvent.pointerMove(area, { buttons: 1, clientX: 240, clientY: 260, pointerId: 1 });

    await waitFor(() => {
      const transform = readTransform(area);
      expect(transform.x).toBeCloseTo(40, 5);
      expect(transform.y).toBeCloseTo(40, 5);
    });

    fireEvent.pointerLeave(area, { pointerId: 1 });
    const transformAfterLeave = readTransform(area);

    fireEvent.pointerMove(area, { buttons: 1, clientX: 300, clientY: 320, pointerId: 1 });

    expect(readTransform(area)).toEqual(transformAfterLeave);
  });

  it('switches cursor state while dragging and restores it afterwards', async () => {
    const area = await renderSpiral();

    expect(area.style.cursor).toBe('grab');

    fireEvent.pointerDown(area, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(area, { buttons: 1, clientX: 112, clientY: 114, pointerId: 1 });

    await waitFor(() => {
      expect(area.style.cursor).toBe('grabbing');
    });

    fireEvent.pointerUp(area, { button: 0, clientX: 112, clientY: 114, pointerId: 1 });

    await waitFor(() => {
      expect(area.style.cursor).toBe('grab');
    });
  });
});
