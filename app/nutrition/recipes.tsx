import { ScrollView, View } from 'react-native';
import {Card, H1, Body, Muted, BottomSpace, TopSpace} from '../../src/components/ui';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Recipes() {
  const items = [
    'Sambar + veg (protein: add dal + curd)',
    'Chole / rajma curry + measured rice + salad',
    'Paneer bhurji + 2 roti + big veg',
    'Egg curry + roti + buttermilk',
    'Curd rice + veg + peanuts (measured)',
  ];
  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Recipes (portion-guided)</H1>
      {items.map((r) => <Card key={r}><Body>{r}</Body><Muted>Swap grains/veg/protein freely within energy needs.</Muted></Card>)}
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
