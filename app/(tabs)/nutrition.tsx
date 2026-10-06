import { ScrollView, View, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card, Body, Muted, ActionCard, BottomSpace, SectionTitle, TopSpace, PageHeader,
  ButtonGrid, BigActionButton,
} from '../../src/components/ui';
import { MacroPie } from '../../src/components/Charts';
import { FoodPhoto } from '../../src/components/FoodArt';
import { FOODS } from '../../src/data/foods';
import { QUICK_MEALS, quickMealCalories, quickMealCount } from '../../src/data/quickMeals';
import { buildTargets } from '../../src/utils/nutrition';
import { FadeIn, Stagger, BouncyPress } from '../../src/components/Motion';
import { AppIcon } from '../../src/components/AppIcon';
import { Colors, cell } from '../../src/theme';

export default function NutritionTab() {
  const router = useRouter();
  const t = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'fat_loss' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <FadeIn>
        <PageHeader title="Nutrition" subtitle="Fuel + recovery" icon="nutrition-outline" />
      </FadeIn>

      <FadeIn delay={70}>
        <Card>
          <SectionTitle title="Today's macro split" icon="pie-chart-outline" />
          <MacroPie protein={t.protein_g} carbs={t.carbs_g} fat={t.fat_g} />
          <Body>Cal {t.calories} • P {t.protein_g}g • C {t.carbs_g}g • F {t.fat_g}g • Fiber {t.fiber_g}g</Body>
          <Muted>Educational estimates — editable in Profile. Not a prescription.</Muted>
        </Card>
      </FadeIn>

      {/* Logging is the main job on this tab — make it the biggest thing here. */}
      <FadeIn delay={130}>
        <SectionTitle title="Log it fast" icon="flash-outline" />
      </FadeIn>
      <ButtonGrid>
        <BigActionButton
          style={cell(2)}
          title="Log a meal"
          hint="Tap to log instantly"
          icon="restaurant-outline"
          onPress={() => router.push('/nutrition/logger' as any)}
          badge="GO"
        />
        <BigActionButton
          style={cell(2)}
          title="Browse foods"
          hint="Macros and images"
          icon="search-outline"
          color={Colors.accent}
          onPress={() => router.push('/nutrition/search' as any)}
        />
      </ButtonGrid>

      {/* Popular presets — one tap each. */}
      <SectionTitle title="Popular meals" icon="star-outline" right="one tap each" />
      <Stagger step={45} baseDelay={180}>
        {QUICK_MEALS.filter((m) => m.slot === 'lunch' || m.slot === 'breakfast').slice(0, 4).map((m) => (
          <BouncyPress
            key={m.id}
            scaleTo={0.97}
            accessibilityLabel={`Log ${m.name}`}
            onPress={() => router.push('/nutrition/logger' as any)}
          >
            <View style={preset.row}>
              <View style={[preset.icon, { backgroundColor: m.accent + '22' }]}>
                <Text style={preset.emoji}>{m.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Body>{m.name}</Body>
                <Muted>{quickMealCount(m)} items · {quickMealCalories(m)} kcal</Muted>
              </View>
              <View style={[preset.plus, { backgroundColor: m.accent }]}>
                <AppIcon name="add" size={16} color="#FFFFFF" />
              </View>
            </View>
          </BouncyPress>
        ))}
      </Stagger>

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

      <SectionTitle title="More" icon="layers-outline" />
      <ActionCard title="7-Day Plan + Grocery" desc="Saved in Supabase" icon="calendar-outline" onPress={() => router.push('/nutrition/plan' as any)} />
      <ActionCard title="Recipes" desc="Simple, high-protein" icon="restaurant-outline" onPress={() => router.push('/nutrition/recipes' as any)} />
      <ActionCard title="Heavy Meal Recovery" desc="Kind reset with pictures" icon="heart-outline" onPress={() => router.push('/nutrition/recovery' as any)} />
      <ActionCard title="Add your own food" desc="Custom item with macros" icon="add-circle-outline" onPress={() => router.push('/nutrition/add-food' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}

const preset = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    marginVertical: 4,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  emoji: { fontSize: 20 },
  plus: { width: 30, height: 30, borderRadius: 15, alignItems: 'center' as const, justifyContent: 'center' as const },
};