// Generates src/components/AppIcon.tsx from official ionicons SVGs.
// Zero font dependency: icons render via react-native-svg (already proven in builds).
const fs = require('fs');
const path = require('path');
const DIR = 'node_modules/ionicons/dist/svg';
const NEED = [
  'add', 'add-circle-outline', 'alert-circle', 'arrow-forward', 'bar-chart-outline',
  'barbell', 'barbell-outline', 'basket-outline', 'body-outline', 'calendar-outline',
  'camera-outline', 'cart-outline', 'checkmark', 'checkmark-circle',
  'checkmark-circle-outline', 'checkmark-done', 'chevron-forward', 'clipboard-outline',
  'close', 'close-circle-outline', 'cloud-offline-outline', 'cloud-outline',
  'cloud-upload-outline', 'download-outline', 'egg-outline', 'ellipse',
  'ellipse-outline', 'fitness-outline', 'heart-outline', 'home', 'home-outline',
  'images-outline', 'information-circle', 'layers-outline', 'leaf-outline',
  'list-outline', 'log-out-outline', 'nutrition', 'nutrition-outline',
  'pause-circle-outline', 'people-outline', 'person', 'person-outline',
  'pie-chart-outline', 'pizza-outline', 'play', 'receipt-outline',
  'refresh-outline', 'repeat-outline', 'restaurant-outline', 'scale-outline',
  'search', 'search-outline', 'share-social-outline', 'speedometer-outline',
  'stats-chart', 'stats-chart-outline', 'sunny-outline', 'time-outline',
  'today-outline', 'trash', 'trash-outline', 'trending-up-outline',
  'trophy-outline', 'walk-outline', 'water-outline',
  'log-in-outline', 'person-add-outline', 'mail-outline', 'send',
  'eye-outline', 'eye-off-outline', 'add-circle',
];
const TAG = { path: 'p', rect: 'r', circle: 'c', ellipse: 'e' };
const ATTR = {
  d: 'd', cx: 'cx', cy: 'cy', r: 'r', rx: 'rx', ry: 'ry', x: 'x', y: 'y',
  width: 'w', height: 'h', points: 'pts', x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2',
  fill: 'f', stroke: 's', 'stroke-width': 'sw', 'stroke-linecap': 'slc',
  'stroke-linejoin': 'slj', 'fill-rule': 'fr', opacity: 'o', transform: 'tf',
};
function parseInner(inner) {
  const els = [];
  const re = /<(path|rect|circle|ellipse|polygon|polyline|line)\b([^>]*)\/?>/g;
  let m;
  while ((m = re.exec(inner)) !== null) {
    const [, tag, attrs] = m;
    if (!TAG[tag]) throw new Error('unsupported element: ' + tag);
    const a = {};
    const am = attrs.matchAll(/([\w-]+)="([^"]*)"/g);
    let amx;
    while ((amx = am.next().value)) {
      const k = ATTR[amx[1]];
      if (k) a[k] = amx[2];
    }
    els.push({ t: TAG[tag], a });
  }
  return els;
}
const glyphs = {};
for (const n of NEED) {
  const raw = fs.readFileSync(path.join(DIR, n + '.svg'), 'utf8');
  const inner = raw.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  glyphs[n] = parseInner(inner);
}
const out = `import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, Ellipse, Polygon, Polyline, Line } from 'react-native-svg';

export const APP_ICONS = ${JSON.stringify(NEED)} as const;
export type AppIconName = (typeof APP_ICONS)[number];

type El = { t: string; a: Record<string, string> };
const GLYPHS: Record<string, El[]> = ${JSON.stringify(glyphs)};

function paint(a: Record<string, string>, color: string): Record<string, string> {
  const o: Record<string, string> = {};
  // fill: absent or currentColor -> theme color; explicit none stays none
  if (!a.f || a.f === 'currentColor') o.fill = color;
  else o.fill = a.f;
  if (a.s) o.stroke = a.s === 'currentColor' ? color : a.s;
  if (a.sw) o.strokeWidth = a.sw;
  if (a.slc) o.strokeLinecap = a.slc;
  if (a.slj) o.strokeLinejoin = a.slj;
  if (a.fr) o.fillRule = a.fr;
  if (a.o) o.opacity = a.o;
  if (a.tf) o.transform = a.tf;
  return o;
}

function renderEl(e: El, color: string, key: number) {
  const p: any = { ...paint(e.a, color) };
  switch (e.t) {
    case 'p': return <Path d={e.a.d} key={key} {...p} />;
    case 'r': return <Rect x={e.a.x} y={e.a.y} width={e.a.w} height={e.a.h} rx={e.a.rx} ry={e.a.ry} key={key} {...p} />;
    case 'c': return <Circle cx={e.a.cx} cy={e.a.cy} r={e.a.r} key={key} {...p} />;
    case 'e': return <Ellipse cx={e.a.cx} cy={e.a.cy} rx={e.a.rx} ry={e.a.ry} key={key} {...p} />;
    case 'g': return <Polygon points={e.a.pts} key={key} {...p} />;
    case 'h': return <Polyline points={e.a.pts} key={key} {...p} />;
    case 'l': return <Line x1={e.a.x1} y1={e.a.y1} x2={e.a.x2} y2={e.a.y2} key={key} {...p} />;
    default: return null;
  }
}

/**
 * Font-free icon. Same API subset as Ionicons (name/size/color/style),
 * drawn with react-native-svg — renders identically in Expo Go AND
 * standalone APKs/IPAs with zero font loading.
 */
export function AppIcon({ name, size = 24, color, style }: {
  name: AppIconName | string; size?: number; color: string; style?: any;
}) {
  const els = GLYPHS[name] ?? null;
  if (!els) return <View style={[{ width: size, height: size }, style]} />;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 512 512">
        {els.map((e, i) => renderEl(e, color, i))}
      </Svg>
    </View>
  );
}
`;
fs.writeFileSync('src/components/AppIcon.tsx', out);
console.log('AppIcon.tsx written:', (out.length / 1024).toFixed(0) + 'kb,', NEED.length, 'icons');
