import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { FOOD_PHOTOS } from '../data/foodMedia';
import { Colors } from '../theme';

const BY_FOOD: Record<string, string> = {
  idli: '🥣', dosa: '🥞', upma: '🥣', poha: '🥣', oats: '🥣',
  chapati: '🫓', rice: '🍚', ragi: '🍚',
  sambar: '🍛', dal: '🍛', rajma: '🍛', chole: '🍛',
  paneer: '🧀', egg: '🥚', chicken: '🍗', fish: '🐟',
  curd: '🥛', buttermilk: '🥛',
  sprouts: '🥗', chana: '🥜', nuts: '🥜', banana: '🍌',
};

const BY_CATEGORY: Record<string, { emoji: string; color: string }> = {
  breakfast: { emoji: '🍳', color: '#F59E0B' },
  grains: { emoji: '🍚', color: '#EAB308' },
  dal: { emoji: '🍛', color: '#FB923C' },
  protein: { emoji: '🍗', color: '#EF4444' },
  dairy: { emoji: '🥛', color: '#38BDF8' },
  fruit: { emoji: '🍎', color: '#FF7A1A' },
  snack: { emoji: '🥜', color: '#A78BFA' },
  veg: { emoji: '🥗', color: '#34D399' },
};

export function foodEmoji(foodId: string, category: string): string {
  return BY_FOOD[foodId] ?? BY_CATEGORY[category]?.emoji ?? '🍽️';
}

export function foodColor(category: string): string {
  return BY_CATEGORY[category]?.color ?? '#FF7A1A';
}

/** Diet-item image tile: emoji on a tinted plate. */
export function FoodArt({ foodId, category, size = 56 }: { foodId: string; category: string; size?: number }) {
  const color = foodColor(category);
  return (
    <View
      style={[
        useStyles().tile,
        { backgroundColor: color + '1E', borderColor: color + '55', width: size + 20, height: size + 20, borderRadius: (size + 20) / 2 },
      ]}
    >
      <Text style={{ fontSize: size * 0.62 }}>{foodEmoji(foodId, category)}</Text>
    </View>
  );
}

/** Animated diet photo: real pack photo with a slow Ken Burns zoom loop. */
export function FoodPhoto({ foodId, category, size = 76 }: { foodId: string; category: string; size?: number }) {
  const uri = FOOD_PHOTOS[foodId];
  const color = foodColor(category);
  const zoom = useRef(new Animated.Value(0)).current;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uri || failed) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(zoom, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [uri, failed]);

  if (!uri || failed) return <FoodArt foodId={foodId} category={category} size={size} />;

  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  return (
    <View
      style={[
        useStyles().photoTile,
        { borderColor: color + '66', width: size + 20, height: size + 20, borderRadius: (size + 20) / 2 },
      ]}
    >
      <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale }] }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={400}
          cachePolicy="disk"
          onError={() => setFailed(true)}
        />
      </Animated.View>
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  tile: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoTile: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: Colors.bgSoft, elevation: 3 },
});
