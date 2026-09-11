import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Easing } from 'react-native';
import { Colors } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';

const THUMB = 58;
const PAD = 5;
const THRESHOLD = 0.78;

/**
 * Swipe-to-submit slider button ("slide to unlock" pattern).
 * Drag the knob past ~80% to confirm — prevents accidental taps on
 * big actions like finishing a workout. Snaps back if released early.
 */
export function SlideButton({ title, onComplete, icon = 'chevron-forward' }: {
  title: string;
  onComplete: () => void;
  icon?: AppIconName;
}) {
  const trackW = useRef(0);
  const x = useRef(new Animated.Value(0)).current;
  const cur = useRef(0);
  const startX = useRef(0);
  const fired = useRef(false);
  const [done, setDone] = useState(false);
  const s = useStyles();

  useEffect(() => {
    const id = x.addListener(({ value }) => {
      cur.current = value;
    });
    return () => x.removeListener(id);
  }, [x]);

  const max = () => Math.max(0, trackW.current - THUMB - PAD * 2);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !fired.current,
      onMoveShouldSetPanResponder: () => !fired.current,
      onPanResponderGrant: () => {
        x.stopAnimation((v: number) => {
          startX.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        if (fired.current) return;
        x.setValue(Math.min(Math.max(0, startX.current + g.dx), max()));
      },
      onPanResponderRelease: () => {
        if (fired.current) return;
        if (cur.current > max() * THRESHOLD) {
          fired.current = true;
          Animated.timing(x, {
            toValue: max(), duration: 140, easing: Easing.out(Easing.ease), useNativeDriver: false,
          }).start(() => {
            setDone(true);
            onComplete();
            setTimeout(() => {
              fired.current = false;
              setDone(false);
              Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
            }, 1200);
          });
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  return (
    <View
      style={[s.track, done && { borderColor: Colors.primary }]}
      onLayout={(e) => {
        trackW.current = e.nativeEvent.layout.width;
      }}
    >
      {/* progress fill follows the knob */}
      <Animated.View style={[s.fill, { width: Animated.add(x, THUMB + PAD) }]} />
      <Text style={s.hint} numberOfLines={1}>
        {done ? '✓ Done!' : title}
      </Text>
      <Animated.View
        style={[s.knob, { transform: [{ translateX: x }] }]}
        {...pan.panHandlers}
      >
        <AppIcon name={done ? 'checkmark' : icon} size={24} color={Colors.text} />
      </Animated.View>
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  track: {
    height: 64, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.raised, marginVertical: 8, justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: Colors.primary, opacity: 0.28, borderRadius: 999,
  },
  hint: {
    position: 'absolute', left: THUMB + 12, right: 12, textAlign: 'center',
    color: Colors.text, fontWeight: '800', fontSize: 15,
  },
  knob: {
    position: 'absolute', left: PAD, width: THUMB, height: THUMB - 10,
    borderRadius: (THUMB - 10) / 2, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
});
