import { GUTTER, cell, gridRow } from '../src/theme';
import { MEAL_SLOTS, slotMeta } from '../src/lib/meals';

/**
 * Layout guards.
 *
 * Every tiled row derives from GUTTER / cell() / gridRow(). When screens used
 * hand-written -3 / -4 / -5 gutters instead, tiles stopped sharing a vertical
 * axis with the cards above and below them. These tests pin the arithmetic so
 * that class of bug cannot come back silently.
 */

describe('layout grid', () => {
  it('has a single gutter value', () => {
    expect(GUTTER).toBe(4);
  });

  it('cell() splits the row into the requested columns', () => {
    expect(cell(2).width).toBe('50%');
    expect(cell(3).width).toBe(`${100 / 3}%`);
    expect(cell(4).width).toBe('25%');
  });

  it('two cells fill exactly 100% — no wrap, no overflow', () => {
    const pct = (w: string) => parseFloat(w);
    expect(pct(cell(2).width) * 2).toBe(100);
    expect(pct(cell(3).width) * 3).toBe(100);
    expect(pct(cell(4).width) * 4).toBe(100);
  });

  it('a cell carries the gutter as padding', () => {
    expect(cell(2).paddingHorizontal).toBe(GUTTER);
    expect(cell(3, 8).paddingHorizontal).toBe(8);
  });

  it('a cell has bottom spacing so rows never touch', () => {
    expect(cell(2).paddingBottom).toBeGreaterThan(0);
  });

  it('gridRow pulls back by exactly the gutter', () => {
    expect(gridRow().marginHorizontal).toBe(-GUTTER);
    expect(gridRow(8).marginHorizontal).toBe(-8);
  });

  it('gridRow + cell padding cancel, so outer edges stay flush', () => {
    // parent -4, child +4 => net 0 at the content edge
    const net = (gridRow().marginHorizontal as number) + (cell(2).paddingHorizontal as number);
    expect(net).toBe(0);
  });

  it('gridRow wraps and is a row', () => {
    const r = gridRow();
    expect(r.flexDirection).toBe('row');
    expect(r.flexWrap).toBe('wrap');
  });

  it('gridRow can take extra styles without losing the gutter', () => {
    const r = gridRow(GUTTER, { marginTop: 8 });
    expect(r.marginHorizontal).toBe(-GUTTER);
    expect(r.marginTop).toBe(8);
  });
});

describe('meal slot labels', () => {
  it('every slot has a short label that is actually short', () => {
    for (const m of MEAL_SLOTS) {
      expect(m.short.length).toBeGreaterThan(0);
      expect(m.short.length).toBeLessThanOrEqual(6);
    }
  });

  it('no slot label is a naive 4-character slice', () => {
    // the old UI did label.slice(0, 4), which rendered "Brea" and "Lunc"
    for (const m of MEAL_SLOTS) {
      expect(m.short).not.toBe(m.label.slice(0, 4));
    }
    // "Breakfast" must not appear truncated
    expect(MEAL_SLOTS.find((m) => m.id === 'breakfast')!.short).toBe('Bfst');
  });

  it('short labels are unique so tabs are distinguishable', () => {
    const shorts = MEAL_SLOTS.map((m) => m.short);
    expect(new Set(shorts).size).toBe(shorts.length);
  });

  it('slotMeta returns a full shape for an unknown slot', () => {
    const m = slotMeta('brunch');
    expect(m.label).toBe('brunch');
    expect(m.short.length).toBeGreaterThan(0);
    expect(m.emoji.length).toBeGreaterThan(0);
  });
});