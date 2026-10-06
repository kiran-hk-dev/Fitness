import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, FontSize } from '../theme';
import { STEP_MILESTONES, type StepMilestone } from '../utils/steps';

/**
 * The achievement map: a winding path from 0 to 20k with a badge pinned at
 * every milestone. 1k pops the first medal; 10k gets the golden VICTORY node.
 * Locked nodes stay visible (grey) so there is always a next goal to chase.
 */

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface MilestoneMapProps {
  steps: number;
  /** Codes already unlocked ever — drives the filled vs locked look. */
  unlocked?: string[];
  /** Called when a locked node is tapped (hint / how to earn it). */
  onPressLocked?: (m: StepMilestone) => void;
  /** Maximum nodes per row. Shrinks automatically on narrow screens. */
  perRow?: number;
  /** Fixed height. Defaults to whatever the measured layout needs. */
  height?: number;
}

export function MilestoneMap({ steps, unlocked = [], onPressLocked, perRow = 4, height }: MilestoneMapProps) {
  const fill = useRef(new Animated.Value(0)).current;
  const locked = new Set(unlocked);
  const safeSteps = Number.isFinite(steps) && steps > 0 ? steps : 0;

  // Fraction of the whole path completed (0–1 across the full 20k ladder).
  const overall = Math.min(1, safeSteps / STEP_MILESTONES[STEP_MILESTONES.length - 1].steps);

  // Columns adapt to the real available width. A hard-coded cell width pushed
  // the trail off-screen on narrow phones, so the nodes are absolutely
  // positioned against a measured width instead.
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const safeCols = Math.max(2, Math.min(perRow, STEP_MILESTONES.length));
  const nodeW = width > 0 ? width / safeCols : 0;
  const nodeH = 118;
  const rows = Math.ceil(STEP_MILESTONES.length / safeCols);
  const padY = nodeH / 2;
  const w = width || safeCols * 86;
  const h = rows * nodeH;
  const trackWidth = 5;
  const mapHeight = height ?? h + 24;

  useEffect(() => {
    const t = Animated.timing(fill, {
      toValue: overall,
      duration: 1100,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    t.start();
    return () => t.stop();
  }, [overall, fill]);

  // Serpentine centre-line for the trail, in SVG coordinates.
  const points = STEP_MILESTONES.map((m, i) => {
    const row = Math.floor(i / safeCols);
    const colInRow = i % safeCols;
    const forward = row % 2 === 0;
    const col = forward ? colInRow : safeCols - 1 - colInRow;
    return {
      x: col * nodeW + nodeW / 2,
      y: row * nodeH + padY,
      m,
    };
  });

  // Smooth snake through the nodes.
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const midY = (prev.y + p.y) / 2;
    return `${acc} C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
  }, '');

  const totalLen = points.length * nodeW || 1; // approximate length for dash math
  const dashOffset = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [totalLen, 0],
  });

  if (width === 0) {
    // Nothing sensible to draw yet — reserve the height so layout doesn't jump.
    return <View onLayout={onLayout} style={{ height: mapHeight }} />;
  }

  return (
    <View onLayout={onLayout} style={{ height: mapHeight, width: '100%' }}>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="trail" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.primary} />
            <Stop offset="1" stopColor={Colors.accent} />
          </LinearGradient>
        </Defs>
        <Path d={pathD} stroke={Colors.border} strokeWidth={trackWidth} fill="none" strokeDasharray="1 8" strokeLinecap="round" />
        {overall > 0 ? (
          <AnimatedPath
            d={pathD}
            stroke="url(#trail)"
            strokeWidth={trackWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${totalLen} ${totalLen}`}
            strokeDashoffset={dashOffset}
          />
        ) : null}
      </Svg>

      {points.map((p, i) => (
        <MapNode
          key={p.m.code}
          m={p.m}
          left={p.x - nodeW / 2}
          top={p.y - nodeH / 2}
          cellWidth={nodeW}
          cellHeight={nodeH}
          unlocked={locked.has(p.m.code) || safeSteps >= p.m.steps}
          reached={safeSteps >= p.m.steps}
          delay={i * 90}
          onPress={() => onPressLocked?.(p.m)}
        />
      ))}
    </View>
  );
}

function MapNode({
  m,
  left,
  top,
  cellWidth,
  cellHeight,
  unlocked,
  reached,
  delay,
  onPress,
}: {
  m: StepMilestone;
  left: number;
  top: number;
  cellWidth: number;
  cellHeight: number;
  unlocked: boolean;
  reached: boolean;
  delay: number;
  onPress?: () => void;
}) {
  const pop = useRef(new Animated.Value(unlocked ? 1 : 0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = Animated.timing(pop, {
      toValue: unlocked ? 1 : 0,
      duration: 520,
      delay: unlocked ? delay : 0,
      easing: Easing.back(2),
      useNativeDriver: false,
    });
    t.start();
    return () => t.stop();
  }, [unlocked, delay, pop]);

  useEffect(() => {
    if (!reached || !m.victory) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reached, m.victory, shimmer]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const dotSize = m.victory ? 44 : 32;
  const accent = reached ? (m.victory ? '#FFC93C' : Colors.primary) : Colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.node, { left, top, width: cellWidth, height: cellHeight }]}
      accessibilityRole="button"
      accessibilityLabel={`${m.title} at ${m.steps} steps${reached ? ' reached' : ' locked'}`}
    >
      <Animated.View style={[styles.nodeInner, { transform: [{ scale }], opacity: pop }]}>
        {reached && m.victory ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.halo,
              {
                backgroundColor: '#FFC93C',
                opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.5] }),
                transform: [{ scale: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.2] }) }],
              },
            ]}
          />
        ) : null}
        <View style={[styles.badge, { width: dotSize + 18, height: dotSize + 18, borderColor: accent, borderWidth: m.victory ? 3 : 2 }]}>
          <Text style={[styles.badgeEmoji, { fontSize: m.victory ? 22 : 16 }]}>{reached ? m.emoji : '🔒'}</Text>
        </View>
        <Text style={[styles.nodeSteps, { color: reached ? accent : Colors.muted }]}>
          {m.steps >= 1000 ? `${Math.round(m.steps / 1000)}k` : m.steps}
        </Text>
        <Text style={[styles.nodeTitle, { color: reached ? Colors.text : Colors.muted }]} numberOfLines={2}>
          {m.title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  node: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  nodeInner: { alignItems: 'center', justifyContent: 'center' },
  halo: { borderRadius: 999, alignSelf: 'center' },
  badge: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  badgeEmoji: { textAlign: 'center' },
  nodeSteps: { fontWeight: '800', fontSize: FontSize.sm, marginTop: 4 },
  nodeTitle: { fontWeight: '700', fontSize: 9, textAlign: 'center', paddingHorizontal: 2 },
});