import { Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Colors } from '../theme';

export const W = Dimensions.get('window').width - 64;
// ^ screen padding (16×2) + Card padding (16×2): charts sit INSIDE cards,
// so full screen-32 width overflowed the card and drew outside it.

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
}

// Built per render (not module scope) so chart colors follow theme switches.
const chartBase = () => ({
  backgroundGradientFrom: Colors.card,
  backgroundGradientTo: Colors.card,
  decimalPlaces: 1,
  color: (o = 1) => hexToRgba(Colors.primary, o),
  labelColor: (o = 1) => hexToRgba(Colors.muted, o),
  propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
  propsForBackgroundLines: { stroke: Colors.border },
});

/** Weight trend line (oldest → newest). */
export function WeightChart({ labels, values }: { labels: string[]; values: number[] }) {
  if (!values.length) return null;
  return (
    <LineChart
      data={{ labels, datasets: [{ data: values }] }}
      width={W}
      height={200}
      yAxisSuffix="kg"
      chartConfig={chartBase()}
      bezier
      style={{ borderRadius: 16 }}
    />
  );
}

/** Total daily checkmarks, last 7 days. */
export function ActivityChart({ labels, totals }: { labels: string[]; totals: number[] }) {
  if (!totals.length) return null;
  return (
    <BarChart
      data={{ labels, datasets: [{ data: totals }] }}
      width={W}
      height={200}
      yAxisLabel=""
      yAxisSuffix=""
      chartConfig={{ ...chartBase(), decimalPlaces: 0 }}
      style={{ borderRadius: 16 }}
      fromZero
      showValuesOnTopOfBars
    />
  );
}

/** Macro split donut (grams). */
export function MacroPie({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat;
  if (!total) return null;
  return (
    <PieChart
      data={[
        { name: `Protein ${protein}g`, population: protein, color: '#34D399', legendFontColor: Colors.muted, legendFontSize: 12 },
        { name: `Carbs ${carbs}g`, population: carbs, color: '#EAB308', legendFontColor: Colors.muted, legendFontSize: 12 },
        { name: `Fat ${fat}g`, population: fat, color: '#FB923C', legendFontColor: Colors.muted, legendFontSize: 12 },
      ]}
      width={W}
      height={180}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="4"
      chartConfig={{ color: (o = 1) => `rgba(255,255,255,${o})` }}
    />
  );
}

export { Colors };
