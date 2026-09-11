import { ScrollView, View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {Card, H1, Body, Muted, ActionCard, BottomSpace, SectionTitle, TopSpace, PageHeader} from '../../src/components/ui';
import { MacroPie } from '../../src/components/Charts';
import { FoodPhoto } from '../../src/components/FoodArt';
import { FOODS } from '../../src/data/foods';
import { buildTargets } from '../../src/utils/nutrition';
import { Colors } from '../../src/theme';

export default function NutritionTab() {
  const router = useRouter();
  const t = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'fat_loss' });
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <PageHeader title="Nutrition" subtitle="Fuel + recovery" icon="nutrition-outline" />
      <Card>
        <SectionTitle title="Today's macro split" icon="pie-chart-outline" />
        <MacroPie protein={t.protein_g} carbs={t.carbs_g} fat={t.fat_g} />
        <Body>Cal {t.calories} • P {t.protein_g}g • C {t.carbs_g}g • F {t.fat_g}g • Fiber {t.fiber_g}g</Body>
        <Muted>Educational estimates — editable in Profile. Not a prescription.</Muted>
      </Card>
      <SectionTitle title="Eat the rainbow" icon="images-outline" />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FOODS.slice(0, 10)}
        keyExtractor={(f) => f.id}
        renderItem={({ item: f }) => (
          <View style={{ marginRight: 12, alignItems: 'center', width: 84 }}>
            <FoodPhoto foodId={f.id} category={f.category} size={60} />
            <Muted>{f.name.split('(')[0].slice(0, 14)}</Muted>
          </View>
        )}
      />
      <ActionCard title="Log Meal" desc="Photo foods + daily total" icon="restaurant-outline" accent="#FF7A1A" onPress={() => router.push('/nutrition/logger' as any)} />
      <ActionCard title="Find Foods" desc="22 items with images + macros" icon="search-outline" onPress={() => router.push('/nutrition/search' as any)} />
      <ActionCard title="7-Day Plan + Grocery" desc="Saved in Supabase" icon="calendar-outline" onPress={() => router.push('/nutrition/plan' as any)} />
      <ActionCard title="Heavy Meal Recovery" desc="Kind reset with pictures" icon="heart-outline" onPress={() => router.push('/nutrition/recovery' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}
