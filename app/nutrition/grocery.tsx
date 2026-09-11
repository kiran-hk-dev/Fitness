import { ScrollView, View } from 'react-native';
import {Card, H1, Body, BottomSpace, TopSpace} from '../../src/components/ui';
import { GROCERY_LIST } from '../../src/data/mealTemplates';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Grocery() {
  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Grocery List</H1>
      {GROCERY_LIST.map((g) => <Card key={g}><Body>☐ {g}</Body></Card>)}
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
