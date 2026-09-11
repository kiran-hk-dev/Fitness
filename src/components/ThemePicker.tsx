import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from './ui';
import { THEME_LIST, useTheme, Colors } from '../theme';
import { AppIcon } from './AppIcon';

// 4 professional themes — applies instantly across every screen, no restart.
export function ThemePicker() {
  const { themeName, setTheme } = useTheme();

  return (
    <Card>
      <Text style={[useStyles().head, { color: Colors.text }]}>🎨 App theme</Text>
      <Text style={[useStyles().sub, { color: Colors.muted }]}>4 professional looks · instant, no restart</Text>
      {THEME_LIST.map((t) => {
        const on = themeName === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => setTheme(t.id)}
            style={[useStyles().row, { borderColor: on ? t.swatch : Colors.border, backgroundColor: on ? Colors.primarySoft : 'transparent' }]}
          >
            <View style={[useStyles().swatch, { backgroundColor: t.swatch }]} />
            <View style={{ flex: 1 }}>
              <Text style={[useStyles().name, { color: Colors.text }]}>{t.name}</Text>
              <Text style={[useStyles().desc, { color: Colors.muted }]}>{t.desc}</Text>
            </View>
            {on ? (
              <AppIcon name="checkmark-circle" size={22} color={t.swatch} />
            ) : (
              <AppIcon name="chevron-forward" size={20} color={Colors.muted} />
            )}
          </Pressable>
        );
      })}
    </Card>
  );
}

const useStyles = () => StyleSheet.create({
  head: { fontWeight: '800', fontSize: 16 },
  sub: { fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 10, marginVertical: 4 },
  swatch: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  name: { fontWeight: '800', fontSize: 14 },
  desc: { fontSize: 12, marginTop: 1 },
});
