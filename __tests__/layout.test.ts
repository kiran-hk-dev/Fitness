import { GUTTER, cell, gridRow } from '../src/theme';
import { MEAL_SLOTS, slotMeta, LONGEST_SLOT_LABEL } from '../src/lib/meals';

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
    // 6 => two cards 6px apart, which is enough to read as separate. The exact
    // number is irrelevant; having ONE value is the point.
    expect(GUTTER).toBe(6);
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
  it('shows the real word, not an abbreviation', () => {
    expect(MEAL_SLOTS.find((m) => m.id === 'breakfast')!.label).toBe('Breakfast');
    expect(MEAL_SLOTS.map((m) => m.label)).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Snack']);
  });

  it('no label is a truncated fragment', () => {
    for (const m of MEAL_SLOTS) {
      // the old UI did label.slice(0, 4) which rendered "Brea"
      expect(m.label).not.toBe(m.label.slice(0, 4));
    }
  });

  it('the longest label fits a quarter-width tab at 360dp', () => {
    // 360dp screen - 32 screen padding + gutter = 340 / 4 = 85 per cell,
    // minus 12 gutter padding = 73 for the box, minus 8 inner padding = 65.
    const available = 360 - 32 + GUTTER * 2;
    const cellInner = available / 4 - GUTTER * 2;
    const textRoom = cellInner - 8;
    // bold system sans averages ~0.58em per character
    const needed = LONGEST_SLOT_LABEL.length * 0.58 * 10.5;
    expect(textRoom).toBeGreaterThan(needed);
  });

  it('every slot has a label and emoji', () => {
    for (const m of MEAL_SLOTS) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.emoji.length).toBeGreaterThan(0);
    }
  });

  it('labels are unique so tabs are distinguishable', () => {
    const labels = MEAL_SLOTS.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('slotMeta returns a full shape for an unknown slot', () => {
    const m = slotMeta('brunch');
    expect(m.label).toBe('brunch');
    expect(m.emoji.length).toBeGreaterThan(0);
  });
});