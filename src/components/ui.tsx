import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, Image, useColorScheme } from 'react-native';
import { Colors, Shadow, FontSize, gridRow, cell } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';

function useDark() {
  return useColorScheme() !== 'light';
}

export function Card({ children, style, accent }: { children: React.ReactNode; style?: any; accent?: string }) {
  const dark = useDark();
  return (
    <View
      style={[
        useStyles().card,
        Shadow.card,
        { backgroundColor: dark ? Colors.card : Colors.cardLight, borderColor: dark ? Colors.border : Colors.borderLight },
        accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: any }) {
  const dark = useDark();
  return <Text style={[useStyles().h1, { color: dark ? Colors.text : Colors.textLight }, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: any }) {
  const dark = useDark();
  return <Text style={[useStyles().h2, { color: dark ? Colors.text : Colors.textLight }, style]}>{children}</Text>;
}

/** Body copy. Forwards `style` and `numberOfLines` so long labels inside rows
 *  can be truncated instead of shoving their siblings off-screen. */
export function Body({ children, style, numberOfLines }: {
  children: React.ReactNode;
  style?: any;
  numberOfLines?: number;
}) {
  const dark = useDark();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[useStyles().body, { color: dark ? Colors.text : Colors.textLight }, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: {
  children: React.ReactNode;
  style?: any;
  numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[useStyles().muted, style]}>
      {children}
    </Text>
  );
}

export type BtnIcon = AppIconName;

interface ActionProps {
  title: string;
  onPress: () => void;
  icon?: BtnIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

/** Height/weight of the primary CTA — big enough to hit without looking. */
const CTA = { paddingVertical: 16, borderRadius: 16, fontSize: 16 };

/**
 * THE main action of a screen. Filled, full width, generous padding, and it
 * always says what happens next. Shows a spinner and locks while busy.
 */
export function PrimaryButton({ title, onPress, icon, loading, disabled, style }: ActionProps) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        useStyles().btn,
        off && { opacity: 0.5 },
        pressed && !off && { opacity: 0.88, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.onPrimary} style={{ marginRight: 8 }} />
      ) : icon ? (
        <AppIcon name={icon} size={20} color={Colors.onPrimary} style={{ marginRight: 8 }} />
      ) : null}
      <Text style={[useStyles().btnText, { color: Colors.onPrimary }]}>{loading ? 'Working…' : title}</Text>
    </Pressable>
  );
}

/** Big feature button used in grids on Home/Activity (icon above label).
 *  Sized by the caller (see `half` in useStyles) — NOT flex:1, because
 *  flex:1 means flexBasis:0 and inside a flexWrap row the items never wrap. */
export function BigActionButton({
  title,
  hint,
  icon,
  onPress,
  color = Colors.primary,
  badge,
  style,
}: {
  title: string;
  hint?: string;
  icon: BtnIcon;
  onPress: () => void;
  color?: string;
  badge?: string;
  style?: any;
}) {
  const s = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${title}. ${hint}` : title}
      style={({ pressed }) => [
        s.bigAction,
        { borderColor: color, backgroundColor: color + '16' },
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        style,
      ]}
    >
      <View style={[s.bigActionIcon, { backgroundColor: color }]}>
        <AppIcon name={icon} size={24} color={Colors.bg} />
      </View>
      <Text style={[s.bigActionTitle, { color: Colors.text }]} numberOfLines={2}>{title}</Text>
      {hint ? <Text style={s.bigActionHint} numberOfLines={2}>{hint}</Text> : null}
      {badge ? (
        <View style={[s.bigActionBadge, { backgroundColor: color }]}>
          <Text style={s.bigActionBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Row of tiles, two (or `columns`) per row.
 *
 * The grid wraps every child in a padded cell. Doing it here rather than
 * asking callers to pass `gridCell()` onto the card is deliberate: padding on
 * a bordered card lands INSIDE its border, which leaves two cards flush
 * against each other with no gap. Callers just drop their cards in.
 */
export function ButtonGrid({ children, columns = 2, style }: {
  children: React.ReactNode;
  columns?: number;
  style?: any;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[gridRow(), style]}>
      {items.map((child, i) => (
        <View key={i} style={cell(columns)}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** Row of PickButtons with the same gutter discipline as ButtonGrid. */
export function PickRow({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[useStyles().pickRow, style]}>{children}</View>;
}

/** Choice between two/three options in a row — which water amount, which run.
 *  Row gutter comes from PickRow, so the button itself has no side margin. */
export function PickButton({ label, onPress, selected, icon }: {
  label: string; onPress: () => void; selected?: boolean; icon?: BtnIcon;
}) {
  const dark = useDark();
  const s = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        s.pick,
        {
          borderColor: selected ? Colors.primary : dark ? Colors.border : Colors.borderLight,
          backgroundColor: selected ? Colors.primarySoft : 'transparent',
        },
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
    >
      {icon ? <AppIcon name={icon} size={17} color={selected ? Colors.primary : Colors.muted} style={{ marginRight: 6 }} /> : null}
      <Text style={[s.pickText, { color: selected ? Colors.primary : dark ? Colors.text : Colors.textLight }]}>{label}</Text>
    </Pressable>
  );
}

/** SUBMIT = completing/sending (finish plan, send form). Deeper shade than Save. */
export function SubmitButton({ title, onPress, icon = 'send', loading, disabled, style }: ActionProps) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      style={({ pressed }) => [useStyles().submit, off && { opacity: 0.5 }, pressed && !off && { opacity: 0.88, transform: [{ scale: 0.98 }] }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
      ) : (
        <AppIcon name={icon} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
      )}
      <Text style={useStyles().submitText}>{loading ? 'Sending…' : title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, icon, loading, disabled, style }: ActionProps) {
  const dark = useDark();
  const off = loading || disabled;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      style={({ pressed }) => [
        useStyles().ghost,
        { borderColor: dark ? Colors.border : Colors.borderLight, backgroundColor: dark ? Colors.bgSoft : '#F1F5F9' },
        off && { opacity: 0.5 },
        pressed && !off && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
      ) : icon ? (
        <AppIcon name={icon} size={16} color={Colors.primary} style={{ marginRight: 6 }} />
      ) : null}
      <Text style={[useStyles().ghostText, { color: dark ? Colors.text : Colors.textLight }]}>{loading ? 'Working…' : title}</Text>
    </Pressable>
  );
}

/** Compact pill for inline row actions (Log set, + Add, Delete). */

/** Icon-only circle (delete ✕, play, share). tone danger paints it red. */
export function SmallButton({ title, onPress, icon, tone, style, disabled }: {
  title: string; onPress: () => void; icon?: AppIconName;
  tone?: 'primary' | 'danger' | 'ghost'; style?: any; disabled?: boolean;
}) {
  const t = tone ?? 'primary';
  const s = useStyles();
  const bg = t === 'primary' ? Colors.primary : t === 'danger' ? Colors.danger : 'transparent';
  const fg = t === 'ghost' ? Colors.muted : Colors.onPrimary;
  const border = t === 'ghost' ? Colors.border : 'transparent';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [s.small, { backgroundColor: bg, borderColor: border }, disabled && { opacity: 0.5 }, pressed && !disabled && { opacity: 0.8 }, style]}
    >
      {icon ? <AppIcon name={icon} size={14} color={fg} style={{ marginRight: 5 }} /> : null}
      <Text style={[s.smallText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

/** Icon-only circle (delete ✕, play, share). tone danger paints it red. */
export function IconButton({ icon, onPress, tone, disabled }: {
  icon: AppIconName; onPress: () => void; tone?: 'default' | 'danger'; disabled?: boolean;
}) {
  const danger = tone === 'danger';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        useStyles().iconBtn,
        { borderColor: danger ? Colors.danger : Colors.border },
        disabled && { opacity: 0.5 },
        pressed && !disabled && { opacity: 0.7 },
      ]}
    >
      <AppIcon name={icon} size={17} color={danger ? Colors.danger : Colors.primary} />
    </Pressable>
  );
}

/** Tappable navigation card: icon + title + optional desc + chevron.
 *  Use for GOING somewhere. Buttons are only for submit/save. */
export function ActionCard({ title, desc, icon, accent, onPress }: {
  title: string; desc?: string; icon?: AppIconName;
  accent?: string; onPress: () => void;
}) {
  const dark = useDark();
  const c = accent ?? Colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        useStyles().actionCard,
        { borderColor: dark ? Colors.border : Colors.borderLight },
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      {icon ? (
        <View style={[useStyles().actionIcon, { backgroundColor: c + '1E' }]}>
          <AppIcon name={icon} size={20} color={c} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[useStyles().actionTitle, { color: dark ? Colors.text : Colors.textLight }]}>{title}</Text>
        {desc ? <Text style={useStyles().muted}>{desc}</Text> : null}
      </View>
      <AppIcon name="chevron-forward" size={20} color={Colors.muted} />
    </Pressable>
  );
}

/** Checkbox card for CHOOSING an option (single-select). */
export function CheckCard({ label, desc, selected, onPress }: {
  label: string; desc?: string; selected: boolean; onPress: () => void;
}) {
  const dark = useDark();
  return (
    <Pressable
      onPress={onPress}
      style={[
        useStyles().checkCard,
        { borderColor: selected ? Colors.primary : dark ? Colors.border : Colors.borderLight },
        selected && { backgroundColor: Colors.primarySoft },
      ]}
    >
      <View style={[useStyles().checkbox, selected && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}>
        {selected ? <AppIcon name="checkmark" size={15} color={Colors.text} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[useStyles().actionTitle, { color: dark ? Colors.text : Colors.textLight }]}>{label}</Text>
        {desc ? <Text style={useStyles().muted}>{desc}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Shared auth header: app logo + name + headline. Same on all auth screens. */
export function AuthHeader({ headline, compact }: { headline: string; compact?: boolean }) {
  const dark = useDark();
  const size = compact ? 60 : 84;
  return (
    <View style={useStyles().authHead}>
      <Image source={require('../../assets/icon.png')} style={{ width: size, height: size, borderRadius: size * 0.24 }} />
      <Text style={[useStyles().authName, { color: dark ? Colors.text : Colors.textLight }]}>FitLife 360</Text>
      <Text style={useStyles().authHeadline}>{headline}</Text>
    </View>
  );
}

/** Quiet side-by-side text links (secondary auth routes). */
export function LinkRow({ links }: { links: { label: string; onPress: () => void }[] }) {
  return (
    <View style={useStyles().linkRow}>
      {links.map((l) => (
        <Pressable key={l.label} onPress={l.onPress} hitSlop={10}>
          <Text style={useStyles().linkText}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Chip({ label, color, icon }: { label: string; color?: string; icon?: AppIconName }) {
  const c = color ?? Colors.primary;
  return (
    <View style={[useStyles().chip, { backgroundColor: c + '22', borderColor: c }]}>
      {icon ? <AppIcon name={icon} size={12} color={c} style={{ marginRight: 4 }} /> : null}
      <Text style={[useStyles().chipText, { color: c }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.min(1, Math.max(0, value));
  return (
    <View style={useStyles().track}>
      <View style={[useStyles().fill, { width: `${pct * 100}%`, backgroundColor: color ?? Colors.primary }]} />
    </View>
  );
}

/**
 * Section header. The icon sits in a rounded badge and the optional `right`
 * text is a pill, so a heading reads as one unit instead of three loose bits
 * of text. Vertical rhythm is owned here (above/below) so every screen spaces
 * identically — previously each caller guessed and headings ended up with 24px
 * above and 4px below.
 */
export function SectionTitle({
  title,
  icon,
  right,
  hint,
  tone,
  tight,
}: {
  title: string;
  icon?: AppIconName;
  right?: string;
  /** Optional second line under the title. */
  hint?: string;
  /** Overrides the icon badge colour. */
  tone?: string;
  /**
   * Use when the heading sits INSIDE a Card. The card's own padding is the
   * spacing there, so the screen-level top margin would double it up.
   */
  tight?: boolean;
}) {
  const dark = useDark();
  const s = useStyles();
  const c = tone ?? Colors.primary;
  return (
    <View style={[s.sectionRow, tight && { marginTop: 0, marginBottom: 8 }]}>
      <View style={s.sectionLeft}>
        {icon ? (
          <View style={[s.sectionBadge, { backgroundColor: c + '1F' }]}>
            <AppIcon name={icon} size={13} color={c} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={[s.sectionTitle, { color: dark ? Colors.text : Colors.textLight }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {hint ? <Text style={s.sectionHint} numberOfLines={2}>{hint}</Text> : null}
        </View>
      </View>
      {right ? (
        <View style={s.sectionPill}>
          <Text style={s.sectionPillText} numberOfLines={1}>
            {right}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Fixed vertical gap. Use instead of hand-written marginTop numbers. */
export function Space({ size = 12 }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (t: string) => void; placeholder: string }) {
  const dark = useDark();
  return (
    <View style={[useStyles().searchWrap, { backgroundColor: dark ? Colors.bgSoft : '#F1F5F9', borderColor: dark ? Colors.border : Colors.borderLight }]}>
      <AppIcon name="search" size={18} color={Colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        style={[useStyles().searchInput, { color: dark ? Colors.text : Colors.textLight }]}
      />
    </View>
  );
}

export function DisclaimerBanner({ text }: { text: string }) {
  return (
    <View style={useStyles().disclaimer}>
      <AppIcon name="information-circle" size={16} color={Colors.accent} style={useStyles().disclaimerIcon} />
      <Text style={useStyles().disclaimerText}>{text}</Text>
    </View>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: AppIconName }) {
  return (
    <View style={useStyles().empty}>
      <View style={useStyles().emptyIcon}>
        <AppIcon name={icon ?? 'fitness-outline'} size={32} color={Colors.muted} />
      </View>
      <Text style={useStyles().emptyTitle}>{title}</Text>
      {hint ? <Text style={useStyles().muted}>{hint}</Text> : null}
    </View>
  );
}

/** Standard page header: title + subtitle + optional icon. Same on every page. */
export function PageHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: AppIconName }) {
  const dark = useDark();
  return (
    <View style={useStyles().pageHead}>
      {icon ? (
        <View style={[useStyles().pageIcon, { backgroundColor: Colors.primary + '1E' }]}>
          <AppIcon name={icon} size={22} color={Colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[useStyles().h1, { color: dark ? Colors.text : Colors.textLight, marginVertical: 0 }]}>{title}</Text>
        {subtitle ? <Text style={useStyles().muted}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** Labeled form field with validation message. Standard form layout everywhere. */
export function Field({ label, error, hint, ...inputProps }: {
  label: string; error?: string; hint?: string;
  value: string; onChangeText: (t: string) => void; placeholder?: string;
  keyboardType?: any; secureTextEntry?: boolean; multiline?: boolean; numberOfLines?: number;
  autoCapitalize?: any;
}) {
  const dark = useDark();
  const { value, onChangeText, placeholder, keyboardType, secureTextEntry, multiline, numberOfLines, autoCapitalize } = inputProps;
  return (
    <View style={useStyles().fieldWrap}>
      <Text style={[useStyles().fieldLabel, { color: dark ? Colors.text : Colors.textLight }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[
          useStyles().fieldInput,
          { color: dark ? Colors.text : Colors.textLight, borderColor: error ? Colors.danger : dark ? Colors.border : Colors.borderLight, backgroundColor: dark ? Colors.bgSoft : '#FFFFFF' },
          multiline && { minHeight: 88, textAlignVertical: 'top' },
        ]}
      />
      {error ? <Text style={useStyles().fieldError}>⚠ {error}</Text> : hint ? <Text style={useStyles().fieldHint}>{hint}</Text> : null}
    </View>
  );
}

/** Loading state: spinner card. Use while fetching lists. */
export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={useStyles().loadingWrap}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={useStyles().loadingText}>{label ?? 'Loading…'}</Text>
    </View>
  );
}

/** Error state with retry. Use when a fetch/save fails (not silent empty). */
export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={useStyles().errorWrap}>
      <AppIcon name="cloud-offline-outline" size={28} color={Colors.danger} />
      <Text style={useStyles().errorTitle}>Something went wrong</Text>
      <Text style={useStyles().errorText}>{message}</Text>
      {onRetry ? <GhostButton title="Try again" icon="refresh-outline" onPress={onRetry} /> : null}
    </View>
  );
}

/** Label/value table row for log lists, with optional right-side action. */
export function DataRow({ label, value, sub, action }: { label: string; value: string; sub?: string; action?: React.ReactNode }) {
  const dark = useDark();
  return (
    <View style={[useStyles().dataRow, { borderColor: dark ? Colors.border : Colors.borderLight }]}>
      <View style={{ flex: 1 }}>
        <Text style={[useStyles().dataLabel, { color: dark ? Colors.text : Colors.textLight }]}>{label}</Text>
        {sub ? <Text style={useStyles().muted}>{sub}</Text> : null}
      </View>
      <Text style={[useStyles().dataValue, { color: dark ? Colors.text : Colors.textLight }]}>{value}</Text>
      {action ? <View style={{ marginLeft: 8 }}>{action}</View> : null}
    </View>
  );
}

/** Breathing room above the bottom tab bar — put last inside tab screens. */
export function BottomSpace({ height = 96 }: { height?: number }) {
  return <View style={{ height }} />;
}

/** Breathing room at the top — put first inside every screen ScrollView. */
export function TopSpace({ height = 16 }: { height?: number }) {
  return <View style={{ height }} />;
}

// Section rhythm: a heading gets SECT_ABOVE from whatever preceded it and
// leaves SECT_BELOW to the first thing under it. Owned here so no screen has
// to guess and headings can never end up crammed against their content.
const SECT_ABOVE = 22;
const SECT_BELOW = 10;

const useStyles = () => StyleSheet.create({
  card: { borderRadius: 18, padding: 14, borderWidth: 1, marginVertical: 6 },
  h1: { fontSize: FontSize.xl, fontWeight: '800', marginVertical: 6, letterSpacing: 0.2 },
  h2: { fontSize: FontSize.md, fontWeight: '800' },
  body: { fontSize: FontSize.md, lineHeight: 22 },
  muted: { color: Colors.muted, fontSize: FontSize.sm, lineHeight: 19 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: CTA.borderRadius,
    paddingVertical: CTA.paddingVertical,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    flexDirection: 'row',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { fontWeight: '800', fontSize: CTA.fontSize, letterSpacing: 0.2 },
  submit: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    flexDirection: 'row',
  },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  ghost: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 6, flexDirection: 'row', borderWidth: 1.5 },
  ghostText: { fontWeight: '700', fontSize: 14 },
  // Grid tile. Compact on purpose: icon, label, one hint line. The hint is
  // capped at 2 lines and the box has no min-height to grow past, so a long
  // hint ("Strength · Yoga · Cardio · Mobility") can never inflate the tile.
  bigAction: { borderRadius: 16, borderWidth: 1.5, paddingVertical: 11, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  bigActionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bigActionTitle: { fontWeight: '800', fontSize: 13.5, textAlign: 'center', marginTop: 6 },
  bigActionHint: { color: Colors.muted, fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 2, lineHeight: 13 },
  bigActionBadge: { position: 'absolute', top: 6, right: 6, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1.5 },
  bigActionBadgeText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.4 },
  pickRow: { flexDirection: 'row', marginHorizontal: -4 },
  pick: { flex: 1, borderWidth: 2, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginHorizontal: 4 },
  pickText: { fontWeight: '800', fontSize: 14 },
  small: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, alignSelf: 'flex-start', marginVertical: 4 },
  smallText: { fontWeight: '800', fontSize: 13 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, marginRight: 6, marginVertical: 2 },
  chipText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  actionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 13, marginVertical: 5 },
  actionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  actionTitle: { fontWeight: '800', fontSize: 15 },
  checkCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, padding: 13, marginVertical: 5 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  pageHead: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  pageIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  fieldWrap: { marginVertical: 6 },
  fieldLabel: { fontWeight: '700', fontSize: 13, marginBottom: 5 },
  fieldInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  fieldError: { color: Colors.danger, fontSize: 12, marginTop: 4, fontWeight: '600' },
  fieldHint: { color: Colors.muted, fontSize: 12, marginTop: 4 },
  loadingWrap: { padding: 32, alignItems: 'center' },
  loadingText: { color: Colors.muted, fontSize: 14, marginTop: 10 },
  errorWrap: { borderRadius: 16, borderWidth: 1, borderColor: Colors.danger, padding: 20, alignItems: 'center', marginVertical: 8 },
  errorTitle: { color: Colors.text, fontWeight: '800', fontSize: 16, marginTop: 8 },
  errorText: { color: Colors.muted, fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 8 },
  dataRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 10 },
  dataLabel: { fontWeight: '700', fontSize: 14 },
  dataValue: { fontWeight: '800', fontSize: 14 },
  track: { height: 8, borderRadius: 999, backgroundColor: Colors.border, overflow: 'hidden', marginVertical: 6 },
  fill: { height: '100%', borderRadius: 999 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SECT_ABOVE,
    marginBottom: SECT_BELOW,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  // Badge and title are deliberately small: a heading must not out-weigh the
  // content it introduces.
  sectionBadge: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  sectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0 },
  sectionHint: { color: Colors.muted, fontSize: 11.5, marginTop: 1, lineHeight: 15 },
  sectionPill: {
    backgroundColor: Colors.raised,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '45%',
  },
  sectionPillText: { color: Colors.muted, fontSize: 10.5, fontWeight: '800' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, marginVertical: 8 },
  searchInput: { flex: 1, padding: 10, fontSize: 15, marginLeft: 6 },
  disclaimer: { backgroundColor: Colors.raised, borderRadius: 12, padding: 12, marginVertical: 8, flexDirection: 'row', alignItems: 'flex-start' },
  disclaimerText: { color: Colors.muted, fontSize: 13, lineHeight: 19, flex: 1 },
  disclaimerIcon: { marginRight: 6 },
  empty: { padding: 28, alignItems: 'center' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.raised, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { color: Colors.muted, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  authHead: { alignItems: 'center', marginBottom: 20 },
  authName: { fontWeight: '800', fontSize: 24, marginTop: 12 },
  authHeadline: { color: Colors.muted, fontSize: 14, marginTop: 4 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginVertical: 12 },
  linkText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
