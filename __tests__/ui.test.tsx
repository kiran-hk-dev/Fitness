import React from 'react';
import { Text, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { SectionTitle, Card, BigActionButton, ButtonGrid } from '../src/components/ui';
import { Celebration } from '../src/components/Celebration';
import { GUTTER, cell } from '../src/theme';
import { STEP_MILESTONES } from '../src/utils/steps';

jest.mock('react-native-svg', () => {
  const R = require('react');
  const stub = (n: string) => (p: any) => R.createElement(n, p, p.children);
  return {
    __esModule: true, default: stub('Svg'), Svg: stub('Svg'), Path: stub('Path'),
    Rect: stub('Rect'), Circle: stub('Circle'), Ellipse: stub('Ellipse'),
    Polygon: stub('Polygon'), Polyline: stub('Polyline'), Line: stub('Line'),
    G: stub('G'), Defs: stub('Defs'), LinearGradient: stub('LinearGradient'), Stop: stub('Stop'),
  };
});

function renderOnce(el: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => { tree = renderer.create(el); });
  const json = tree.toJSON();
  act(() => { tree.unmount(); });
  return json;
}

/** Walk the rendered tree collecting every style object we can see. */
function collectStyles(node: any, out: any[] = []): any[] {
  if (!node || typeof node !== 'object') return out;
  const flat = [].concat(node.props?.style ?? []).filter(Boolean);
  for (const s of flat) if (typeof s === 'object') out.push(s);
  for (const c of node.children ?? []) collectStyles(c, out);
  return out;
}

describe('SectionTitle', () => {
  it('renders with and without an icon / right text', () => {
    expect(renderOnce(<SectionTitle title="Plain" />)).not.toBeNull();
    expect(renderOnce(<SectionTitle title="With icon" icon="trophy-outline" />)).not.toBeNull();
    expect(renderOnce(<SectionTitle title="With right" right="3 items" />)).not.toBeNull();
    expect(renderOnce(<SectionTitle title="All" icon="map-outline" right="4 of 7" hint="sub" />)).not.toBeNull();
  });

  it('leaves more room above than below, so headings group with what follows', () => {
    const styles = collectStyles(renderOnce(<SectionTitle title="X" icon="add" />));
    const row = styles.find((s) => typeof s.marginTop === 'number' && typeof s.marginBottom === 'number');
    expect(row).toBeDefined();
    expect(row.marginTop).toBeGreaterThan(row.marginBottom);
  });

  it('drops its top margin when tight (used inside a Card)', () => {
    const tight = collectStyles(renderOnce(<SectionTitle title="X" icon="add" tight />));
    const row = tight.find((s) => s.marginTop === 0);
    expect(row).toBeDefined();
  });

  it('never lets the right pill take the whole row', () => {
    const styles = collectStyles(renderOnce(<SectionTitle title="X" right="a very long trailing note here" />));
    const pill = styles.find((s) => s.maxWidth === '45%');
    expect(pill).toBeDefined();
  });

  it('has a real title and pill text', () => {
    const texts: string[] = [];
    const walk = (n: any): void => {
      if (typeof n === 'string') {
        if (n.trim()) texts.push(n);
        return;
      }
      if (!n || typeof n !== 'object') return;
      for (const c of n.children ?? []) walk(c);
    };
    walk(renderOnce(<SectionTitle title="Badges" right="2 earned" />));
    expect(texts).toContain('Badges');
    expect(texts).toContain('2 earned');
  });
});

describe('grid spacing between cards', () => {
  const card = (title: string) => (
    <ButtonGrid>
      <BigActionButton title={title} hint="h" icon="add" onPress={() => {}} />
      <BigActionButton title={title} hint="h" icon="add" onPress={() => {}} />
    </ButtonGrid>
  );

  it('the bordered card never carries the grid width', () => {
    const styles = collectStyles(renderOnce(card('A')));
    const tile = styles.find((s) => typeof s.borderWidth === 'number' && typeof s.borderRadius === 'number');
    expect(tile).toBeDefined();
    // The cell's percentage width must live on the wrapper. Putting it on the
    // card means the card's padding sits inside its border and two cards meet
    // flush with no gap between them.
    expect(tile.width).toBeUndefined();
  });

  it('the wrapper cell supplies the horizontal gutter', () => {
    const styles = collectStyles(renderOnce(card('A')));
    const wrapper = styles.find(
      (s) => typeof s.width === 'string' && typeof s.paddingHorizontal === 'number',
    );
    expect(wrapper).toBeDefined();
    expect(parseFloat(wrapper.width as string) * 2).toBe(100);
    expect(wrapper.paddingHorizontal).toBe(GUTTER);
    expect(wrapper.paddingHorizontal).toBeGreaterThan(0);
  });

  it('leaves vertical room between rows too', () => {
    const styles = collectStyles(renderOnce(card('A')));
    const wrapper = styles.find(
      (s) => typeof s.width === 'string' && typeof s.paddingBottom === 'number',
    );
    expect(wrapper.paddingBottom).toBeGreaterThan(0);
  });

  it('cancels the row gutter back to the content edge', () => {
    const styles = collectStyles(renderOnce(card('A')));
    const row = styles.find((s) => s.flexWrap === 'wrap' && typeof s.marginHorizontal === 'number');
    const wrapper = styles.find(
      (s) => typeof s.width === 'string' && typeof s.paddingHorizontal === 'number',
    );
    expect(row.marginHorizontal + wrapper.paddingHorizontal).toBe(0);
  });

  it('works for any column count', () => {
    for (const cols of [2, 3, 4]) {
      const styles = collectStyles(renderOnce(
        <ButtonGrid columns={cols}>
          {Array.from({ length: cols }, (_, i) => (
            <BigActionButton key={i} title="x" icon="add" onPress={() => {}} />
          ))}
        </ButtonGrid>,
      ));
      const w = styles.find((s) => typeof s.width === 'string' && typeof s.paddingHorizontal === 'number');
      expect(parseFloat(w.width as string) * cols).toBeCloseTo(100, 5);
    }
  });
});

describe('tile sizing', () => {
  it('button tiles are compact and cannot inflate', () => {
    const styles = collectStyles(renderOnce(
      <ButtonGrid>
        <BigActionButton title="A" hint="x" icon="add" onPress={() => {}} />
      </ButtonGrid>,
    ));
    const tile = styles.find((s) => typeof s.borderRadius === 'number' && typeof s.paddingVertical === 'number');
    expect(tile).toBeDefined();
    // No minHeight: the box must size to its content, so a long hint cannot
    // stretch every tile in the row.
    expect(tile.minHeight).toBeUndefined();
    expect(tile.height).toBeUndefined();
    expect(tile.paddingVertical).toBeLessThanOrEqual(12);
  });

  it('tile text is small enough to read as a label, not a headline', () => {
    const styles = collectStyles(renderOnce(
      <ButtonGrid>
        <BigActionButton title="Train" hint="hint" icon="add" onPress={() => {}} />
      </ButtonGrid>,
    ));
    const title = styles.find((s) => s.fontSize === 13.5);
    expect(title).toBeDefined();
    const hint = styles.find((s) => s.fontSize === 10);
    expect(hint).toBeDefined();
  });

  it('caps the hint so long text cannot blow up the tile', () => {
    const tree = renderOnce(
      <ButtonGrid>
        <BigActionButton
          title="Train"
          hint="Strength · Yoga · Cardio · Mobility"
          icon="layers-outline"
          onPress={() => {}}
        />
      </ButtonGrid>,
    );
    const capped: number[] = [];
    const walk = (n: any): void => {
      if (typeof n === 'string' || !n || typeof n !== 'object') return;
      if (typeof n.props?.numberOfLines === 'number') capped.push(n.props.numberOfLines);
      for (const c of n.children ?? []) walk(c);
    };
    walk(tree);
    expect(capped.length).toBeGreaterThan(0);
    expect(Math.max(...capped)).toBeLessThanOrEqual(2);
  });

  it('two cells in a grid fill the row exactly', () => {
    const a = cell(2);
    expect(parseFloat(a.width) * 2).toBe(100);
  });

  it('grid gutters cancel between row and cells', () => {
    expect(cell(2).paddingHorizontal).toBe(GUTTER);
  });
});

describe('Celebration fits its card', () => {
  const gold = STEP_MILESTONES.find((m) => m.victory)!;

  it('renders a bounded card', () => {
    expect(renderOnce(<Celebration milestone={STEP_MILESTONES[0]} steps={1000} onClose={() => {}} />)).not.toBeNull();
    expect(renderOnce(<Celebration milestone={gold} steps={10000} onClose={() => {}} />)).not.toBeNull();
  });

  it('the card and its animated wrappers all declare a width', () => {
    // A child with width:'100%' inside an un-sized Animated.View overflows the
    // card — this is what pushed "Keep going" outside the box.
    const styles = collectStyles(renderOnce(<Celebration milestone={gold} steps={10000} onClose={() => {}} />));
    const card = styles.find((s) => s.maxWidth === 380);
    expect(card).toBeDefined();
    expect(card.width).toBe('100%');

    const cta = styles.find((s) => s.borderRadius === 14 && s.width === '100%');
    expect(cta).toBeDefined();

    // every full-width wrapper is present and sized
    const fulls = styles.filter((s) => s.width === '100%' && s.alignSelf === 'stretch');
    expect(fulls.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render at all without a milestone', () => {
    expect(renderOnce(<Celebration milestone={null} steps={0} onClose={() => {}} />)).toBeNull();
  });
});

describe('Cards stay compact', () => {
  it('default card padding is not oversized', () => {
    const styles = collectStyles(renderOnce(<Card><Text>hi</Text></Card>));
    const c = styles.find((s) => s.borderRadius === 18 && typeof s.padding === 'number');
    expect(c).toBeDefined();
    expect(c.padding).toBeLessThanOrEqual(16);
  });

  it('cards have vertical breathing room that does not collide', () => {
    const styles = collectStyles(renderOnce(<Card><Text>hi</Text></Card>));
    const c = styles.find((s) => s.borderRadius === 18 && typeof s.marginVertical === 'number');
    expect(c).toBeDefined();
    expect(c.marginVertical).toBeGreaterThan(0);
    expect(c.marginVertical).toBeLessThanOrEqual(8);
  });
});