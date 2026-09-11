import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { EXERCISE_PHOTOS } from '../data/exerciseMedia';
import { YOGA_PHOTOS } from '../data/exerciseMedia';
import { FOOD_PHOTOS } from '../data/foodMedia';

// Gym → strength → yoga → food: slow crossfading fullscreen slideshow.
// Auth needs internet anyway (Supabase), so remote photos are safe here.
const FRAMES = [
  EXERCISE_PHOTOS['db-press'].start,
  EXERCISE_PHOTOS['goblet-squat'].start,
  YOGA_PHOTOS['child'].start,
  YOGA_PHOTOS['bridge'].start,
  FOOD_PHOTOS['oats'],
  EXERCISE_PHOTOS['rowing'].start,
];

export function AuthBackdrop() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FRAMES.length), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        key={idx}
        source={{ uri: FRAMES[idx] }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={900}
        cachePolicy="disk"
      />
      {/* dark veil so white text + cards always pop */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,8,12,0.78)' }]} />
    </View>
  );
}
