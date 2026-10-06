import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, useWindowDimensions, Modal } from 'react-native';
import { Colors, FontSize } from '../theme';
import { RingProgress } from './ActivityVisuals';
import { AppIcon } from './AppIcon';
import type { StepMilestone } from '../utils/steps';

/**
 * Full-screen celebration: confetti fall + medal pop + a big ring that fills
 * to the milestone, then a single obvious "Keep going" button.
 * Nothing here reaches the network — the caller decides what to celebrate.
 */

const CONFETTI_COLORS = ['#FF7A1A', '#FFC93C', '#38BDF8', '#34D399', '#F472B6', '#A78BFA'];

function Confetti({ count = 26 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        delay: Math.random() * 900,
        dur: 1700 + Math.random() * 1400,
        spin: 2200 + Math.random() * 2200,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: -60 + Math.random() * 120,
      })),
    [count, width],
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {pieces.map((p) => <Confetto key={p.id} {...p} screenH={height} />)}
    </View>
  );
}

function Confetto({
  x,
  delay,
  dur,
  spin,
  size,
  color,
  drift,
  screenH,
}: {
  x: number; delay: number; dur: number; spin: number; size: number; color: string; drift: number; screenH: number;
}) {
  const fall = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.timing(fall, {
      toValue: 1,
      duration: dur,
      delay,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const b = Animated.loop(
      Animated.timing(turn, { toValue: 1, duration: spin, easing: Easing.linear, useNativeDriver: true }),
    );
    b.start();
    a.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [fall, turn, dur, delay, spin]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, screenH + 40] });
  const translateX = fall.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size * 1.5,
        borderRadius: 2,
        backgroundColor: color,
        opacity: fall.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

/** Ring that sweeps to `progress`, with the value + label in the middle. */
function MedalRing({ m, steps }: { m: StepMilestone; steps: number }) {
  const pop = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = Animated.timing(pop, {
      toValue: 1,
      duration: 700,
      easing: Easing.back(2.2),
      useNativeDriver: false,
    });
    t.start();
    return () => t.stop();
  }, [pop]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shine, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shine]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const progress = Math.min(1, steps / m.steps);

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale }], opacity: pop }}>
      <Animated.View
        style={{
          transform: [{ scale: shine.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        }}
      >
        <RingProgress value={progress} size={190} thickness={15} color={m.victory ? '#FFC93C' : Colors.primary} color2={m.victory ? Colors.primary : Colors.accent} glow={m.victory}>
          <Text style={{ fontSize: 52, marginBottom: 2 }}>{m.emoji}</Text>
          <Text style={styles.medalSteps}>{steps.toLocaleString()}</Text>
          <Text style={styles.medalGoal}>of {m.steps.toLocaleString()}</Text>
        </RingProgress>
      </Animated.View>
    </Animated.View>
  );
}

export interface CelebrationProps {
  /** null hides the overlay. */
  milestone: StepMilestone | null;
  steps: number;
  onClose: () => void;
  /** Optional secondary line, e.g. the next goal. */
  nextLabel?: string;
}

export function Celebration({ milestone, steps, onClose, nextLabel }: CelebrationProps) {
  const text = useRef(new Animated.Value(0)).current;
  const btn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!milestone) return;
    text.setValue(0);
    btn.setValue(0);
    Animated.sequence([
      Animated.timing(text, { toValue: 1, duration: 480, delay: 320, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }),
      Animated.timing(btn, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(2)), useNativeDriver: false }),
    ]).start();
  }, [milestone, text, btn]);

  if (!milestone) return null;
  const gold = milestone.victory;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: Colors.scrim }]}>
        <Confetti count={gold ? 40 : 24} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.card, { opacity: text, borderColor: gold ? '#FFC93C' : Colors.primary }]}>
          <Text style={[styles.kicker, { color: gold ? '#FFC93C' : Colors.primary }]}>
            {gold ? '★ ACHIEVEMENT UNLOCKED ★' : 'ACHIEVEMENT UNLOCKED'}
          </Text>
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.sub}>{milestone.subtitle}</Text>

          <MedalRing m={milestone} steps={steps} />

          <Animated.View style={{ opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
            <View style={styles.prize}>
              <AppIcon name="trophy-outline" size={18} color={Colors.primary} />
              <Text style={styles.prizeText}>
                {gold
                  ? '10,000 steps in one day. That is the win. 🏆'
                  : `Badge banked. ${nextLabel ?? 'Keep walking.'}`}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: btn, transform: [{ translateY: btn.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: gold ? '#FFC93C' : Colors.primary },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              accessibilityRole="button"
            >
              <AppIcon name="arrow-forward" size={20} color={gold ? '#1A1200' : Colors.onPrimary} />
              <Text style={[styles.ctaText, { color: gold ? '#1A1200' : Colors.onPrimary }]}>Keep going</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 26,
    borderWidth: 2,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    backgroundColor: Colors.card,
    elevation: 12,
  },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: Colors.text, fontSize: 30, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  sub: { color: Colors.muted, fontSize: 14, fontWeight: '700', marginTop: 2 },
  medalSteps: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '900' },
  medalGoal: { color: Colors.muted, fontSize: 12, fontWeight: '700' },
  prize: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.raised,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  prizeText: { color: Colors.text, fontSize: 13, fontWeight: '700', marginLeft: 8, flex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 16,
    width: '100%',
  },
  ctaText: { fontSize: 16, fontWeight: '900', marginLeft: 8 },
});