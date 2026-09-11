import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Colors, MuscleColor } from '../theme';

type J = [number, number];
export interface Joints {
  head: J; sh: J; el: J; ha: J; hip: J; kn: J; an: J;
  el2?: J; ha2?: J; kn2?: J; an2?: J;
}

// Named body positions (viewBox 0 0 100 120, ground y=106)
const P: Record<string, Joints> = {
  stand: { head: [50, 12], sh: [50, 30], el: [50, 48], ha: [50, 64], hip: [50, 66], kn: [50, 86], an: [50, 106] },
  squat: { head: [50, 28], sh: [47, 44], el: [60, 50], ha: [72, 46], hip: [36, 68], kn: [54, 86], an: [48, 106] },
  pressUp: { head: [50, 16], sh: [50, 32], el: [43, 20], ha: [39, 9], hip: [50, 68], kn: [50, 88], an: [50, 106] },
  pressDown: { head: [50, 16], sh: [50, 32], el: [37, 40], ha: [39, 30], hip: [50, 68], kn: [50, 88], an: [50, 106] },
  curlUp: { head: [50, 12], sh: [50, 30], el: [50, 50], ha: [50, 32], hip: [50, 68], kn: [50, 88], an: [50, 106] },
  raiseUp: { head: [50, 12], sh: [50, 30], el: [35, 32], ha: [22, 30], el2: [65, 32], ha2: [78, 30], hip: [50, 68], kn: [50, 88], an: [50, 106] },
  plank: { head: [82, 64], sh: [72, 70], el: [72, 88], ha: [72, 104], hip: [42, 70], kn: [22, 76], an: [6, 84] },
  pushDown: { head: [82, 78], sh: [72, 84], el: [84, 92], ha: [72, 104], hip: [42, 84], kn: [22, 90], an: [6, 96] },
  hingeDown: { head: [66, 32], sh: [58, 42], el: [56, 60], ha: [54, 78], hip: [36, 50], kn: [44, 80], an: [44, 106] },
  rowStart: { head: [74, 50], sh: [64, 56], el: [58, 72], ha: [56, 88], hip: [36, 58], kn: [42, 84], an: [42, 106] },
  rowPull: { head: [74, 50], sh: [64, 56], el: [50, 70], ha: [62, 58], hip: [36, 58], kn: [42, 84], an: [42, 106] },
  lunge: { head: [50, 12], sh: [50, 30], el: [50, 48], ha: [50, 64], hip: [50, 66], kn: [66, 86], an: [66, 106], kn2: [34, 88], an2: [20, 106] },
  walk1: { head: [50, 12], sh: [50, 30], el: [44, 46], ha: [40, 60], hip: [50, 66], kn: [62, 86], an: [68, 106], kn2: [38, 86], an2: [32, 106] },
  walk2: { head: [50, 12], sh: [50, 30], el: [56, 46], ha: [60, 60], hip: [50, 66], kn: [38, 86], an: [32, 106], kn2: [62, 86], an2: [68, 106] },
  bridgeDown: { head: [18, 96], sh: [30, 94], el: [34, 100], ha: [40, 104], hip: [52, 96], kn: [72, 96], an: [74, 106] },
  bridgeUp: { head: [18, 96], sh: [30, 94], el: [34, 100], ha: [40, 104], hip: [56, 78], kn: [76, 88], an: [76, 106] },
  cobra: { head: [70, 60], sh: [62, 74], el: [62, 90], ha: [62, 104], hip: [36, 96], kn: [20, 100], an: [6, 102] },
  child: { head: [30, 84], sh: [40, 88], el: [56, 92], ha: [70, 90], hip: [48, 78], kn: [40, 100], an: [40, 106] },
  deadbug: { head: [22, 96], sh: [34, 92], el: [46, 80], ha: [50, 64], hip: [50, 94], kn: [64, 80], an: [78, 78], kn2: [40, 100], an2: [40, 106] },
  table: { head: [78, 58], sh: [64, 64], el: [64, 86], ha: [64, 104], hip: [36, 64], kn: [36, 88], an: [36, 104] },
  downDog: { head: [58, 78], sh: [50, 62], el: [40, 50], ha: [28, 46], hip: [66, 42], kn: [70, 74], an: [70, 104] },
  warrior: { head: [50, 10], sh: [50, 28], el: [28, 28], ha: [10, 28], el2: [72, 28], ha2: [90, 28], hip: [50, 62], kn: [68, 86], an: [68, 106], kn2: [32, 88], an2: [16, 106] },
  boat: { head: [58, 28], sh: [50, 44], el: [62, 54], ha: [72, 50], hip: [40, 80], kn: [58, 60], an: [74, 60] },
};

const PATTERNS: Record<string, string[]> = {
  squat: ['stand', 'squat', 'stand'],
  push: ['plank', 'pushDown', 'plank'],
  press: ['pressDown', 'pressUp', 'pressDown'],
  row: ['rowStart', 'rowPull', 'rowStart'],
  curl: ['stand', 'curlUp', 'stand'],
  raise: ['stand', 'raiseUp', 'stand'],
  hinge: ['stand', 'hingeDown', 'stand'],
  plank: ['plank', 'pushDown', 'plank'],
  lunge: ['stand', 'lunge', 'stand'],
  walk: ['walk1', 'walk2', 'walk1'],
  bridge: ['bridgeDown', 'bridgeUp', 'bridgeDown'],
  mobility: ['child', 'cobra', 'child'],
  core: ['bridgeDown', 'deadbug', 'bridgeDown'],
  yogaTable: ['table', 'cobra', 'table'],
  yogaStand: ['stand', 'warrior', 'stand'],
  yogaFold: ['stand', 'downDog', 'stand'],
  yogaFloor: ['bridgeDown', 'bridgeUp', 'bridgeDown'],
  yogaSit: ['child', 'boat', 'child'],
};

const BY_EXERCISE: Record<string, string> = {
  'push-up': 'push', 'incline-push-up': 'push', 'db-press': 'press',
  'band-row': 'row', 'db-row': 'row', 'lat-pulldown': 'row',
  'lateral-raise': 'raise', 'db-shoulder-press': 'press', 'db-curl': 'curl',
  'cable-pressdown': 'curl', 'dead-bug': 'core', plank: 'plank', 'ab-wheel': 'plank',
  'bodyweight-squat': 'squat', 'goblet-squat': 'squat', rdl: 'hinge',
  walking: 'walk', 'cat-cow': 'mobility',
  'dips-chest': 'push', 'cable-fly': 'press', 'pull-up': 'row', 'seated-row': 'row',
  'military-press': 'press', 'arnold-press': 'press', 'face-pull': 'row',
  'hammer-curl': 'curl', 'barbell-curl': 'curl', 'preacher-curl': 'curl',
  'bench-dips': 'push', skullcrusher: 'curl', 'overhead-extension': 'curl',
  crunch: 'core', 'reverse-crunch': 'core', 'russian-twist': 'core',
  'hanging-knee-raise': 'core', 'side-plank': 'plank',
  lunge: 'lunge', 'hip-thrust': 'bridge', 'calf-raise': 'walk',
  rowing: 'walk', 'jump-squat': 'squat', 'calf-stretch': 'mobility',
  'decline-press': 'press', 'incline-db-press': 'press', 'chin-up': 'row',
  'inverted-row': 'row', 'upright-row': 'raise', 'front-raise': 'raise',
  'seated-lateral': 'raise', 'concentration-curl': 'curl', 'incline-curl': 'curl',
  'rope-pushdown': 'curl', 'triceps-dips': 'push', 'cable-crunch': 'core',
  'oblique-crunch': 'core', 'pallof-press': 'core', 'leg-press': 'squat',
  'hack-squat': 'squat', 'bulgarian-split': 'lunge', 'leg-curl': 'squat',
  'glute-kickback': 'bridge', 'single-leg-bridge': 'bridge', 'battle-ropes': 'walk',
};

const BY_MUSCLE: Record<string, string> = {
  chest: 'push', back: 'row', shoulders: 'press', biceps: 'curl', triceps: 'curl',
  core: 'plank', glutes: 'bridge', legs: 'squat', cardio: 'walk', mobility: 'mobility', full_body: 'squat',
};

const MUSCLE_JOINT: Record<string, 'sh' | 'el' | 'hip' | 'kn'> = {
  chest: 'sh', back: 'sh', shoulders: 'sh', biceps: 'el', triceps: 'el',
  core: 'hip', glutes: 'hip', legs: 'kn', cardio: 'kn', mobility: 'hip', full_body: 'hip',
};

export function patternFor(exerciseId: string, muscle: string): string {
  return BY_EXERCISE[exerciseId] ?? BY_MUSCLE[muscle] ?? 'squat';
}

export function yogaPatternFor(poseId: string): string {
  if (['side-bridge-pose', 'pelvic-bridge', 'bridge'].includes(poseId)) return 'yogaFloor';
  if (['seated-glute', 'lying-glute'].includes(poseId)) return 'yogaFloor';
  if (['mountain-climb'].includes(poseId)) return 'plank';
  if (['calf-wall-stretch'].includes(poseId)) return 'yogaStand';
  if (['itband-stretch', 'chair-back-stretch', 'chin-chest-stretch', 'elbow-circles'].includes(poseId)) return 'yogaStand';
  if (['superman-flow', 'pelvic-bridge'].includes(poseId)) return 'yogaFloor';
  if (['inchworm-walk', 'hamstring-fold', 'standing-hamstring-calf'].includes(poseId)) return 'yogaFold';
  if (['shoulder-opener', 'triceps-shoulder-stretch', 'upper-back-opener', 'chair-upper-stretch'].includes(poseId)) return 'yogaStand';
  if (['hip-flexor-lunge', 'worlds-greatest', 'chair-leg-stretch', 'seated-calf'].includes(poseId)) return 'yogaStand';
  if (['seated-hamstring'].includes(poseId)) return 'yogaFloor';
  if (['breath', 'warrior2', 'boat'].includes(poseId)) return poseId === 'warrior2' ? 'yogaStand' : poseId === 'boat' ? 'yogaSit' : 'yogaStand';
  if (['catcow', 'child', 'cobra'].includes(poseId)) return 'yogaTable';
  if (['downdog-mod'].includes(poseId)) return 'yogaFold';
  if (['bridge'].includes(poseId)) return 'yogaFloor';
  return 'yogaStand';
}

export function FigureWithMuscle({ j, muscle, size }: { j: Joints; muscle: string; size: number }) {
  const color = MuscleColor[muscle] ?? Colors.primary;
  const jointKey = MUSCLE_JOINT[muscle] ?? 'hip';
  const pt = j[jointKey];
  const w = 3.2;
  const seg = (a: J, b: J, c = '#E2E8F0') => (
    <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
  );
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Line x1={4} y1={107} x2={96} y2={107} stroke="#334155" strokeWidth={1.5} strokeLinecap="round" />
      {seg(j.sh, j.hip)}
      {seg(j.sh, j.el)}
      {seg(j.el, j.ha)}
      {j.el2 && j.ha2 ? (<>{seg(j.sh, j.el2)}{seg(j.el2, j.ha2)}</>) : null}
      {seg(j.hip, j.kn)}
      {seg(j.kn, j.an)}
      {j.kn2 && j.an2 ? (<>{seg(j.hip, j.kn2, '#94A3B8')}{seg(j.kn2, j.an2, '#94A3B8')}</>) : null}
      {/* trained-muscle highlight limb */}
      {jointKey === 'sh' ? seg(j.sh, j.el, color) : null}
      {jointKey === 'el' ? seg(j.el, j.ha, color) : null}
      {jointKey === 'hip' ? seg(j.sh, j.hip, color) : null}
      {jointKey === 'kn' ? seg(j.hip, j.kn, color) : null}
      <Circle cx={j.head[0]} cy={j.head[1]} r={7} fill="#E2E8F0" />
      <Circle cx={pt[0]} cy={pt[1]} r={4.5} fill={color} opacity={0.9} />
    </Svg>
  );
}

/** Thumbnail art for cards: tinted tile + figure. */
export function ExerciseArt({ exerciseId, muscle, size = 72 }: { exerciseId: string; muscle: string; size?: number }) {
  const color = MuscleColor[muscle] ?? Colors.primary;
  const pattern = patternFor(exerciseId, muscle);
  const mid = P[PATTERNS[pattern][1]];
  return (
    <View style={[useStyles().tile, { backgroundColor: color + '1E', borderColor: color + '55', width: size + 20, height: size + 28 }]}>
      <FigureWithMuscle j={mid} muscle={muscle} size={size} />
    </View>
  );
}

/** 3-frame how-to strip: Setup → Movement → Peak, paired with step captions. */
export function HowToFrames({
  exerciseId, muscle, steps,
}: {
  exerciseId: string; muscle: string; steps: string[];
}) {
  const pattern = patternFor(exerciseId, muscle);
  const frames = PATTERNS[pattern];
  const labels = ['1 · Setup', '2 · Movement', '3 · Peak'];
  return (
    <View style={useStyles().strip}>
      {frames.map((key, i) => (
        <View key={i} style={useStyles().frame}>
          <View style={[useStyles().frameArt, { borderColor: (MuscleColor[muscle] ?? Colors.primary) + '66' }]}>
            <FigureWithMuscle j={P[key]} muscle={muscle} size={64} />
          </View>
          <Text style={useStyles().frameLabel}>{labels[i]}</Text>
          <Text style={useStyles().frameCap} numberOfLines={3}>{steps[Math.min(i, steps.length - 1)]}</Text>
        </View>
      ))}
    </View>
  );
}

/** Single-figure art for a yoga pose. */
export function YogaArt({ poseId, size = 72 }: { poseId: string; size?: number }) {
  const pattern = yogaPatternFor(poseId);
  const mid = P[PATTERNS[pattern][1]];
  return (
    <View style={[useStyles().tile, { backgroundColor: MuscleColor.mobility + '1E', borderColor: MuscleColor.mobility + '55', width: size + 20, height: size + 28 }]}>
      <FigureWithMuscle j={mid} muscle="mobility" size={size} />
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  tile: { borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  strip: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  frame: { flex: 1, alignItems: 'center', paddingHorizontal: 3 },
  frameArt: { borderRadius: 14, borderWidth: 1, backgroundColor: Colors.bgSoft, padding: 4, alignItems: 'center' },
  frameLabel: { color: Colors.primary, fontWeight: '800', fontSize: 11, marginTop: 6 },
  frameCap: { color: Colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2, lineHeight: 14 },
});
