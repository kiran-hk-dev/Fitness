import { ScrollView, View } from 'react-native';
import {Card, H1, Body, Muted, BottomSpace, TopSpace} from '../../src/components/ui';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Photos() {
  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Progress Photos (private)</H1>
      <Card><Body>Optional. Stored in private Supabase bucket, visible only to you.</Body>
        <Muted>Use expo-image-picker → upload to `progress-photos/{`userId`}/...`</Muted></Card>
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
