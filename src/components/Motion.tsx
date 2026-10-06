import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, type ViewStyle } from 'react-native';
import { Colors, FontSize } from '../theme';
import { AppIcon } from './AppIcon';

/**
 * Shared motion primitives.
 *
 * All of these use React Native core `Animated` (no Reanimated plugin needed)
 * and they accept `delay` so a list can cascade without any per-screen code.
 */

// ------------------------------------------------------------------ fade in --

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  durationMs?: number;
  /** Distance travelled while fading. Default: a short rise. */
  dy?: number;
  style?: ViewStyle;
}

/** Fade + rise. Put one of these per row to get a staggered entrance. */
export function FadeIn({ children, delay = 0, durationMs = 320, dy = 12, style }: FadeInProps) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = Animated.timing(v, {
      toValue: 1,
      duration: durationMs,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [v, delay, durationMs]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Fade every direct child in sequence. Cheap way to make a screen feel alive. */
export function Stagger({
  children,
  step = 55,
  baseDelay = 40,
  dy = 12,
}: {
  children: React.ReactNode;
  step?: number;
  baseDelay?: number;
  dy?: number;
}) {
  const items = React.Children.toArray(children);
  return (
    <>
      {items.map((child, i) => (
        <FadeIn key={i} delay={baseDelay + i * step} dy={dy}>
          {child}
        </FadeIn>
      ))}
    </>
  );
}

// --------------------------------------------------------------- press feel --

/** Pressable that squashes and springs back — used for every tappable card. */
export function BouncyPress({
  children,
  onPress,
  style,
  scaleTo = 0.94,
  disabled,
  accessibilityLabel,
}: {
  children: React.ReactNode | ((p: { pressed: boolean }) => React.ReactNode);
  onPress?: () => void;
  /** Plain style, array of styles, or a function of the press state. */
  style?: any;
  scaleTo?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const v = useRef(new Animated.Value(0)).current;

  const spring = (to: number) => {
    Animated.spring(v, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => spring(1)}
      onPressOut={() => spring(0)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            typeof style === 'function' ? style({ pressed }) : style,
            {
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) }],
            },
          ]}
        >
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

// --------------------------------------------------------------- pop number --

/** A value that punches in scale whenever it changes (calories, count, total). */
export function PopNumber({
  value,
  children,
  style,
}: {
  value: number;
  children: React.ReactNode;
  style?: any;
}) {
  const v = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    Animated.sequence([
      Animated.timing(v, { toValue: 1.22, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
    ]).start();
  }, [value, v]);

  return <Animated.View style={[{ transform: [{ scale: v }] }, style]}>{children}</Animated.View>;
}

// ----------------------------------------------------------- flying chip ----

/**
 * A small dot that launches toward a target when `trigger` changes — the
 * "your food flew into the tray" cue. Purely decorative.
 */
export function FlyChip({
  trigger,
  from,
  color = Colors.primary,
  label,
}: {
  trigger: number;
  from: { x: number; y: number };
  color?: string;
  label?: string;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const prev = useRef(trigger);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (prev.current === trigger) return;
    prev.current = trigger;
    setShow(true);
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 460, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => setShow(false));
  }, [trigger, v]);

  if (!show) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.flyChip,
        {
          left: from.x,
          top: from.y,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 190] }) },
            { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.3, 0.5] }) },
          ],
        },
      ]}
    >
      {label ? <Text style={s.flyChipText}>{label}</Text> : null}
    </Animated.View>
  );
}

// --------------------------------------------------------------- check pop --

/** A ✓ that scales in and settles. Shows when something is completed. */
export function AnimatedCheck({
  show,
  size = 64,
  color = Colors.primary,
  label,
}: {
  show: boolean;
  size?: number;
  color?: string;
  label?: string;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!show) {
      v.setValue(0);
      ring.setValue(0);
      return;
    }
    ring.setValue(0);
    Animated.timing(ring, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(v, { toValue: 1.2, duration: 200, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();
  }, [show, v, ring]);

  if (!show) return null;
  return (
    <View pointerEvents="none" style={s.checkHost}>
      <Animated.View
        style={[
          s.checkRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            opacity: ring,
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.35] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          s.checkInner,
          { backgroundColor: color, transform: [{ scale: v }] },
        ]}
      >
        <AppIcon name="checkmark" size={size * 0.45} color={Colors.bg} />
      </Animated.View>
      {label ? (
        <Animated.Text style={[s.checkLabel, { opacity: ring }]}>{label}</Animated.Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- misc bits --

/** Horizontal pulsing dot — "recording"/live indicator. */
export function LiveDot({ color = Colors.primary, size = 8 }: { color?: string; size?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
      }}
    />
  );
}

/** Wraps children in an absolutely-positioned animated bar that fills 0→value. */
export function GrowBar({
  value,
  color = Colors.primary,
  height = 10,
  trackColor,
  style,
}: {
  value: number;
  color?: string;
  height?: number;
  trackColor?: string;
  style?: ViewStyle;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const target = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  useEffect(() => {
    const t = Animated.timing(v, {
      toValue: target,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    t.start();
    return () => t.stop();
  }, [target, v]);

  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: trackColor ?? Colors.border, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flyChip: { position: 'absolute', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  flyChipText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  checkHost: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 60 },
  checkRing: { position: 'absolute', borderWidth: 3 },
  checkInner: { alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 28 },
  checkLabel: { color: Colors.text, fontWeight: '900', fontSize: FontSize.md, marginTop: 12 },
});