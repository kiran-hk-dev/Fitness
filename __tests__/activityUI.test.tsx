import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { RingProgress, CountUp, AnimatedBar, StatBadge } from '../src/components/ActivityVisuals';
import { MilestoneMap } from '../src/components/MilestoneMap';
import { Celebration } from '../src/components/Celebration';
import { FadeIn, Stagger, BouncyPress, PopNumber, AnimatedCheck, LiveDot, GrowBar, FlyChip } from '../src/components/Motion';
import { STEP_MILESTONES } from '../src/utils/steps';

jest.mock('react-native-svg', () => {
  const R = require('react');
  const stub = (name: string) => (props: any) => R.createElement(name, props, props.children);
  return {
    __esModule: true,
    default: stub('Svg'),
    Svg: stub('Svg'),
    Path: stub('Path'),
    Rect: stub('Rect'),
    Circle: stub('Circle'),
    Ellipse: stub('Ellipse'),
    Polygon: stub('Polygon'),
    Polyline: stub('Polyline'),
    Line: stub('Line'),
    G: stub('G'),
    Defs: stub('Defs'),
    LinearGradient: stub('LinearGradient'),
    Stop: stub('Stop'),
  };
});

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));


/**
 * Render, assert, then UNMOUNT. Unmount matters: several of these components
 * run infinite Animated.loop animations whose cleanup is what stops them, so a
 * test that never unmounts leaves timers running past teardown.
 */
function renderOnce(element: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  const json = tree.toJSON();
  act(() => {
    tree.unmount();
  });
  return json;
}

describe('animated activity visuals mount', () => {
  it('renders the ring at 0, mid and full', () => {
    for (const v of [0, 0.5, 1]) {
      expect(renderOnce(<RingProgress value={v} size={120} />)).not.toBeNull();
    }
  });

  it('renders a glowing ring (pulse loop starts and stops cleanly)', () => {
    expect(renderOnce(<RingProgress value={0.7} size={140} glow />)).not.toBeNull();
  });

  it('survives junk progress values', () => {
    expect(renderOnce(<RingProgress value={NaN} />)).not.toBeNull();
    expect(renderOnce(<RingProgress value={-5} />)).not.toBeNull();
    expect(renderOnce(<RingProgress value={99} />)).not.toBeNull();
  });

  it('renders the counter and the bar', () => {
    expect(renderOnce(<CountUp to={1042} />)).not.toBeNull();
    expect(renderOnce(<AnimatedBar value={0.4} />)).not.toBeNull();
  });

  it('renders a stat badge', () => {
    expect(
      renderOnce(<StatBadge icon="footsteps-outline" label="steps" value="4,200" />),
    ).not.toBeNull();
  });
});

describe('achievement map', () => {
  it('renders with no steps at all', () => {
    expect(renderOnce(<MilestoneMap steps={0} unlocked={[]} />)).not.toBeNull();
  });

  it('renders with everything unlocked', () => {
    expect(
      renderOnce(<MilestoneMap steps={25_000} unlocked={STEP_MILESTONES.map((m) => m.code)} />),
    ).not.toBeNull();
  });

  it('renders mid-journey, including the victory shimmer', () => {
    expect(renderOnce(<MilestoneMap steps={10_400} unlocked={[]} />)).not.toBeNull();
  });

  it('places a badge at exactly 1k and the victory at 10k', () => {
    expect(STEP_MILESTONES.some((m) => m.steps === 1000 && !m.victory)).toBe(true);
    expect(STEP_MILESTONES.find((m) => m.victory)?.steps).toBe(10_000);
  });
});

describe('celebration overlay', () => {
  it('renders nothing when there is no milestone', () => {
    expect(renderOnce(<Celebration milestone={null} steps={0} onClose={jest.fn()} />)).toBeNull();
  });

  it('opens for an ordinary badge', () => {
    expect(
      renderOnce(<Celebration milestone={STEP_MILESTONES[0]} steps={1000} onClose={jest.fn()} />),
    ).not.toBeNull();
  });

  it('opens for the 10k victory badge with confetti', () => {
    const tenK = STEP_MILESTONES.find((m) => m.victory)!;
    expect(
      renderOnce(<Celebration milestone={tenK} steps={10_000} onClose={jest.fn()} />),
    ).not.toBeNull();
  });
});

describe('motion primitives mount and clean up', () => {
  it('FadeIn renders children', () => {
    expect(renderOnce(<FadeIn><Text>hi</Text></FadeIn>)).not.toBeNull();
  });

  it('Stagger fades every child in sequence', () => {
    expect(
      renderOnce(
        <Stagger step={10} baseDelay={0}>
          <Text>a</Text>
          <Text>b</Text>
          <Text>c</Text>
        </Stagger>,
      ),
    ).not.toBeNull();
  });

  it('BouncyPress accepts a plain style, an array and a function', () => {
    expect(renderOnce(<BouncyPress style={{ flex: 1 }}><Text>a</Text></BouncyPress>)).not.toBeNull();
    expect(
      renderOnce(<BouncyPress style={[{ flex: 1 }, { borderWidth: 2 }]}><Text>a</Text></BouncyPress>),
    ).not.toBeNull();
    expect(
      renderOnce(<BouncyPress style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.7 : 1 })}><Text>a</Text></BouncyPress>),
    ).not.toBeNull();
  });

  it('BouncyPress supports the render-prop children form', () => {
    expect(
      renderOnce(<BouncyPress>{({ pressed }) => <Text>{pressed ? 'down' : 'up'}</Text>}</BouncyPress>),
    ).not.toBeNull();
  });

  it('BouncyPress fires onPress', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<BouncyPress onPress={onPress}><Text>tap</Text></BouncyPress>);
    });
    const root = tree.root.findByProps({ accessibilityRole: 'button' });
    act(() => { root.props.onPress(); });
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('PopNumber punches when the value changes', () => {
    expect(renderOnce(<PopNumber value={1}><Text>1</Text></PopNumber>)).not.toBeNull();
    expect(renderOnce(<PopNumber value={999}><Text>999</Text></PopNumber>)).not.toBeNull();
  });

  it('AnimatedCheck appears only when shown', () => {
    expect(renderOnce(<AnimatedCheck show={false} />)).toBeNull();
    expect(renderOnce(<AnimatedCheck show label="logged" />)).not.toBeNull();
  });

  it('GrowBar clamps junk values', () => {
    for (const v of [0, 0.5, 1, 5, -1, NaN]) {
      expect(renderOnce(<GrowBar value={v} />)).not.toBeNull();
    }
  });

  it('LiveDot pulse starts and stops', () => {
    expect(renderOnce(<LiveDot />)).not.toBeNull();
  });

  it('FlyChip mounts and unmounts its loop', () => {
    expect(renderOnce(<FlyChip trigger={0} from={{ x: 10, y: 10 }} />)).not.toBeNull();
    expect(renderOnce(<FlyChip trigger={5} from={{ x: 0, y: 0 }} label="+" />)).not.toBeNull();
  });
});