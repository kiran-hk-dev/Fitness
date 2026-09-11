import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../theme';
import { ExerciseArt, YogaArt } from './ExerciseArt';
import { photosForExercise, photosForPose, customImagesFor, coverIndex } from '../data/exerciseMedia';

/** All animation frames: user-uploaded 5-frame gallery first, else start/end photos. */
function exerciseFrames(exerciseId: string): string[] {
  const custom = customImagesFor(exerciseId);
  if (custom.length) return custom;
  const p = photosForExercise(exerciseId);
  return p ? [p.start, p.end] : [];
}
function poseFrames(poseId: string): string[] {
  const custom = customImagesFor(poseId);
  if (custom.length) return custom;
  const p = photosForPose(poseId);
  return p ? [p.start, p.end] : [];
}

/**
 * Professional exercise photo with loading shimmer + illustrated fallback.
 * Photos are cached on-device (disk) after first load — works offline after that.
 */
export function ExercisePhoto({
  exerciseId, muscle, height = 150, rounded = 16, which = 'start',
}: {
  exerciseId: string; muscle: string; height?: number; rounded?: number; which?: 'start' | 'end';
}) {
  const frames = exerciseFrames(exerciseId);
  const uri = which === 'start' ? frames[coverIndex(exerciseId)] ?? frames[0] : frames[frames.length - 1];
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!uri || failed) {
    return (
      <View style={[useStyles().fallback, { height, borderRadius: rounded }]}>
        <ExerciseArt exerciseId={exerciseId} muscle={muscle} size={64} />
      </View>
    );
  }
  return (
    <View style={[useStyles().wrap, { height, borderRadius: rounded }]}>
      {loading ? (
        <View style={useStyles().loader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : null}
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

/** Hero gallery: auto-playing animated demo through ALL frames + manual tabs. */
export function ExerciseGallery({ exerciseId, muscle, heroHeight = 240 }: { exerciseId: string; muscle: string; heroHeight?: number }) {
  const frames = exerciseFrames(exerciseId);
  const [idx, setIdx] = useState(() => coverIndex(exerciseId));
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);
  const SPEEDS = [0.5, 1, 2];

  // Animated loop: crossfades through frames like a GIF demo
  useEffect(() => {
    if (!playing || !frames.length || failed) return;
    const ms = Math.round(1600 / SPEEDS[speedIdx]);
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), ms);
    return () => clearInterval(t);
  }, [playing, speedIdx, frames.length, failed]);

  const pick = (i: number) => {
    setPlaying(false); // manual control pauses the loop
    setIdx(i);
  };

  if (!frames.length || failed) {
    return (
      <View style={[useStyles().fallback, { height: 240, borderRadius: 18 }]}>
        <ExerciseArt exerciseId={exerciseId} muscle={muscle} size={110} />
        <Text style={useStyles().fallbackText}>Illustrated guide (photo unavailable offline)</Text>
      </View>
    );
  }
  const label = frames.length <= 2 ? (idx === 0 ? 'START' : 'FINISH') : `FRAME ${idx + 1}/${frames.length}`;
  return (
    <View>
      <View style={useStyles().hero}>
        <Image
          key={idx}
          source={{ uri: frames[idx] }}
          style={{ width: '100%', height: heroHeight }}
          contentFit="cover"
          transition={300}
          cachePolicy="disk"
          onError={() => setFailed(true)}
        />
        <View style={useStyles().heroBadge}>
          <Text style={useStyles().heroBadgeText}>{playing ? '▶ ' : '⏸ '}{label}</Text>
        </View>
        <View style={useStyles().heroControls}>
          <Pressable onPress={() => setPlaying((p) => !p)} style={useStyles().ctrlBtn}>
            <Text style={useStyles().ctrlText}>{playing ? '⏸' : '▶'}</Text>
          </Pressable>
          <Pressable onPress={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)} style={useStyles().ctrlBtn}>
            <Text style={useStyles().ctrlText}>{SPEEDS[speedIdx]}x</Text>
          </Pressable>
        </View>
      </View>
      <View style={useStyles().tabs}>
        {frames.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => pick(i)}
            style={[useStyles().tab, idx === i ? useStyles().tabOn : useStyles().tabOff]}
          >
            <Text style={[useStyles().tabText, idx === i ? useStyles().tabTextOn : useStyles().tabTextOff]}>
              {frames.length <= 2 ? (i === 0 ? '1 · Start' : '2 · Finish') : `${i + 1}`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Yoga pose photo (falls back to illustrated figure when no photo mapped). */
export function YogaPhoto({ poseId, height = 130 }: { poseId: string; height?: number }) {
  const frames = poseFrames(poseId);
  const [failed, setFailed] = useState(false);
  if (!frames.length || failed) {
    return (
      <View style={[useStyles().fallback, { height, borderRadius: 16 }]}>
        <YogaArt poseId={poseId} size={56} />
      </View>
    );
  }
  return (
    <View style={[useStyles().wrap, { height, borderRadius: 16 }]}>
      <Image
        source={{ uri: frames[0] }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

/** Auto-playing animated gallery for ONE yoga pose (cycles its frames). */
export function YogaGallery({ poseId, height = 170 }: { poseId: string; height?: number }) {
  const frames = poseFrames(poseId);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing || frames.length < 2 || failed) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), 1600);
    return () => clearInterval(t);
  }, [playing, frames.length, failed]);
  if (!frames.length || failed) {
    return (
      <View style={[useStyles().fallback, { height, borderRadius: 14 }]}>
        <YogaArt poseId={poseId} size={64} />
      </View>
    );
  }
  return (
    <View style={[useStyles().wrap, { height, borderRadius: 14 }]}>
      <Image
        key={idx}
        source={{ uri: frames[idx] }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
        onError={() => setFailed(true)}
      />
      <View style={useStyles().heroBadge}>
        <Text style={useStyles().heroBadgeText}>{playing ? '▶' : '⏸'} {idx + 1}/{frames.length}</Text>
      </View>
      <Pressable onPress={() => setPlaying((p) => !p)} style={[useStyles().ctrlBtn, { position: 'absolute', right: 10, bottom: 10 }]}>
        <Text style={useStyles().ctrlText}>{playing ? '⏸' : '▶'}</Text>
      </Pressable>
    </View>
  );
}

/** Auto-cycling pose slideshow — animated session preview (crossfades poses). */
export function PoseSlideshow({ poseIds, height = 170 }: { poseIds: string[]; height?: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (poseIds.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % poseIds.length), 1800);
    return () => clearInterval(t);
  }, [poseIds.length]);
  const pid = poseIds[idx % poseIds.length];
  const frames = poseFrames(pid);
  const [failed, setFailed] = useState(false);
  return (
    <View style={[useStyles().wrap, { height, borderRadius: 16 }]}>
      {frames.length && !failed ? (
        <Image
          key={pid}
          source={{ uri: frames[0] }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={500}
          cachePolicy="disk"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[useStyles().fallback, { height, borderRadius: 16 }]}>
          <YogaArt poseId={pid} size={56} />
        </View>
      )}
      <View style={useStyles().heroBadge}>
        <Text style={useStyles().heroBadgeText}>▶ {idx + 1}/{poseIds.length}</Text>
      </View>
    </View>
  );
}

/** Animated preview of just-picked local photos (used in Add screens, before upload). */
export function PickedGallery({ uris, height = 180 }: { uris: string[]; height?: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (uris.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % uris.length), 1200);
    return () => clearInterval(t);
  }, [uris.length]);
  if (!uris.length) return null;
  return (
    <View style={[useStyles().wrap, { height, borderRadius: 14 }]}>
      <Image
        key={uris[idx % uris.length]}
        source={{ uri: uris[idx % uris.length] }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
      />
      <View style={useStyles().heroBadge}>
        <Text style={useStyles().heroBadgeText}>▶ Preview {idx + 1}/{uris.length} · animating</Text>
      </View>
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: Colors.bgSoft, borderWidth: 1, borderColor: Colors.primary, elevation: 2 },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSoft },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSoft, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  fallbackText: { color: Colors.muted, fontSize: 11, marginTop: 6 },
  hero: { borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.bgSoft, borderWidth: 1.5, borderColor: Colors.primary, elevation: 4 },
  heroBadge: { position: 'absolute', left: 10, bottom: 10, backgroundColor: Colors.scrim, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  heroBadgeText: { color: Colors.text, fontSize: 11, fontWeight: '800' },
  heroControls: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row' },
  ctrlBtn: { backgroundColor: Colors.scrim, borderRadius: 999, minWidth: 40, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', marginLeft: 6, borderWidth: 1, borderColor: '#FF7A1A' },
  ctrlText: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  tabs: { flexDirection: 'row', marginTop: 8 },
  tab: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', marginHorizontal: 3, borderWidth: 1 },
  tabOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabOff: { backgroundColor: Colors.bgSoft, borderColor: Colors.border },
  tabText: { fontWeight: '800', fontSize: 13 },
  tabTextOn: { color: Colors.text },
  tabTextOff: { color: Colors.muted },
});
