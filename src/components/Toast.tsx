import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme';
import { AppIcon } from './AppIcon';

type ToastKind = 'success' | 'error' | 'info';
interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}

let push: ((text: string, kind?: ToastKind) => void) | null = null;
let seq = 0;

/** Show a toast from anywhere: toast('Saved ✓'), toast('Failed', 'error'). */
export function toast(text: string, kind: ToastKind = 'success') {
  push?.(text, kind);
}

/** Mount once at app root (already in app/_layout.tsx). */
export function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  const s = useStyles();

  useEffect(() => {
    push = (text, kind = 'success') => {
      const id = ++seq;
      setItems((list) => [...list.slice(-2), { id, text, kind }]);
      setTimeout(() => setItems((list) => list.filter((m) => m.id !== id)), 2800);
    };
    return () => {
      push = null;
    };
  }, []);

  if (!items.length) return null;
  return (
    <View style={s.host} pointerEvents="none">
      {items.map((m) => (
        <View
          key={m.id}
          style={[
            s.toast,
            {
              backgroundColor: Colors.card,
              borderColor: m.kind === 'success' ? Colors.primary : m.kind === 'error' ? Colors.danger : Colors.accent,
            },
          ]}
        >
          <AppIcon
            name={m.kind === 'success' ? 'checkmark-circle' : m.kind === 'error' ? 'alert-circle' : 'information-circle'}
            size={18}
            color={m.kind === 'success' ? Colors.primary : m.kind === 'error' ? Colors.danger : Colors.accent}
          />
          <Text style={[s.text, { color: Colors.text }]}>{m.text}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, bottom: 96, alignItems: 'center', zIndex: 999 },
  toast: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16, marginTop: 8, maxWidth: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  text: { fontWeight: '700', fontSize: 14, marginLeft: 8, flexShrink: 1 },
});
