import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, FontSize } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RingProgressProps {
  /** 0–1. */
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  color2?: string;
  trackColor?: string;
  children?: React.ReactNode;
  /** Animate the sweep on mount and whenever the value rises. */
  animated?: boolean;
  durationMs?: number;
  style?: ViewStyle;
  /** Breathing halo — nice on live values. */
  glow?: boolean;
}

/**
 * Circular progress ring: SVG geometry, animated with RN core `Animated`
 * (no Reanimated babel plugin required). Sweeps clockwise from 12 o'clock.
 */
export function RingProgress({
  value,
  size = 150,
  thickness = 13,
  color = Colors.primary,
  color2,
  trackColor,
  children,
  animated = true,
  durationMs = 900,
  style,
  glow = false,
}: RingProgressProps) {
  const target = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const sweep = useRef(new Animated.Value(animated ? 0 : target)).current;
  const [pulse] = useState(() => new Animated.Value(0));
  const prev = useRef(animated ? 0 : target);

  useEffect(() => {
    const rising = target > prev.current;
    prev.current = target;
    const anim = Animated.timing(sweep, {
      toValue: target,
      // Rising fills smoothly; a drop (undo) lands instantly so it feels responsive.
      duration: animated ? (rising ? durationMs : 0) : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [target, animated, durationMs, sweep]);

  useEffect(() => {
    if (!glow) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, pulse]);

  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = sweep.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });
  const gid = `ring-${color.replace('#', '')}-${size}`;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {glow ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              borderWidth: thickness + 6,
              borderColor: color,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.38] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.05] }) }],
            },
          ]}
        />
      ) : null}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={color2 ?? color} />
          </LinearGradient>
        </Defs>
        <G>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor ?? Colors.border} strokeWidth={thickness} fill="none" />
          {target > 0 ? (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={`url(#${gid})`}
              strokeWidth={thickness}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circ} ${circ}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null}
        </G>
      </Svg>
      {children}
    </View>
  );
}

// ------------------------------------------------------------------ counter --

export interface CountUpProps {
  to: number;
  durationMs?: number;
  style?: any;
  format?: (n: number) => string;
}

/** Number that rolls up from its previous value instead of snapping. */
export function CountUp({ to, durationMs = 700, style, format }: CountUpProps) {
  const end = Number.isFinite(to) ? Math.round(to) : 0;
  const [display, setDisplay] = useState(end);
  const from = useRef(end);
  const anim = useRef(new Animated.Value(end)).current;

  useEffect(() => {
    const start = from.current;
    if (start === end) {
      setDisplay(end);
      from.current = end;
      return;
    }
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    const t = Animated.timing(anim, {
      toValue: end,
      duration: Math.min(durationMs, 250 + Math.abs(end - start) * 6),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    t.start(() => {
      from.current = end;
      anim.removeListener(id);
      setDisplay(end);
    });
    return () => {
      anim.removeListener(id);
      t.stop();
    };
  }, [end, anim, durationMs]);

  return <Text style={style}>{format ? format(display) : display.toLocaleString()}</Text>;
}

// ------------------------------------------------------------- progress bar --

/** Animated horizontal bar. `value` is 0–1. */
export function AnimatedBar({
  value,
  color = Colors.primary,
  height = 12,
  trackColor,
  durationMs = 800,
  style,
}: {
  value: number;
  color?: string;
  height?: number;
  trackColor?: string;
  durationMs?: number;
  style?: ViewStyle;
}) {
  const target = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = Animated.timing(anim, {
      toValue: target,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    t.start();
    return () => t.stop();
  }, [target, anim, durationMs]);

  return (
    <View
      style={[
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? Colors.border, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

// --------------------------------------------------------------- stat badge --

/** Icon + tiny caps label + value. Used by the new stat rows. */
export function StatBadge({
  icon,
  label,
  value,
  color = Colors.primary,
  sub,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeIcon, { backgroundColor: color + '22' }]}>
        <AppIcon name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.badgeLabel}>{label}</Text>
        <Text style={[styles.badgeValue, { color }]} numberOfLines={1}>
          {value}
        </Text>
        {sub ? (
          <Text style={styles.badgeSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.raised,
    marginVertical: 4,
  },
  badgeIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  badgeLabel: { color: Colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  badgeValue: { fontSize: FontSize.lg, fontWeight: '800', marginTop: 1 },
  badgeSub: { color: Colors.muted, fontSize: 11, marginTop: 1 },
});