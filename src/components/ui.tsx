import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, Image, useColorScheme } from 'react-native';
import { Colors, Shadow, FontSize } from '../theme';
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

export function H1({ children }: { children: React.ReactNode }) {
  const dark = useDark();
  return <Text style={[useStyles().h1, { color: dark ? Colors.text : Colors.textLight }]}>{children}</Text>;
}

export function H2({ children }: { children: React.ReactNode }) {
  const dark = useDark();
  return <Text style={[useStyles().h2, { color: dark ? Colors.text : Colors.textLight }]}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  const dark = useDark();
  return <Text style={[useStyles().body, { color: dark ? Colors.text : Colors.textLight }]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[useStyles().muted, style]}>{children}</Text>;
}

export type BtnIcon = AppIconName;

interface ActionProps {
  title: string;
  onPress: () => void;
  icon?: BtnIcon;
  loading?: boolean;
  disabled?: boolean;
}

/** Primary action (Save, Continue-submit, Login…). Shows spinner + locks while busy: no double taps. */
export function PrimaryButton({ title, onPress, icon, loading, disabled }: ActionProps) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      style={({ pressed }) => [useStyles().btn, off && { opacity: 0.55 }, pressed && !off && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.onPrimary} style={{ marginRight: 8 }} />
      ) : icon ? (
        <AppIcon name={icon} size={18} color={Colors.onPrimary} style={{ marginRight: 6 }} />
      ) : null}
      <Text style={useStyles().btnText}>{loading ? 'Working…' : title}</Text>
    </Pressable>
  );
}

/** SUBMIT = completing/sending (finish plan, send form). Deeper shade than Save. */
export function SubmitButton({ title, onPress, icon = 'send', loading, disabled }: ActionProps) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      style={({ pressed }) => [useStyles().submit, off && { opacity: 0.55 }, pressed && !off && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.onPrimary} style={{ marginRight: 8 }} />
      ) : (
        <AppIcon name={icon} size={18} color={Colors.onPrimary} style={{ marginRight: 6 }} />
      )}
      <Text style={useStyles().submitText}>{loading ? 'Sending…' : title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, icon, loading, disabled }: ActionProps) {
  const dark = useDark();
  const off = loading || disabled;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      style={({ pressed }) => [
        useStyles().ghost,
        { borderColor: dark ? Colors.border : Colors.borderLight, backgroundColor: dark ? Colors.bgSoft : '#F1F5F9' },
        off && { opacity: 0.55 },
        pressed && !off && { opacity: 0.8 },
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

export function SectionTitle({ title, icon, right }: { title: string; icon?: AppIconName; right?: string }) {
  const dark = useDark();
  return (
    <View style={useStyles().sectionRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon ? <AppIcon name={icon} size={18} color={Colors.primary} style={{ marginRight: 6 }} /> : null}
        <Text style={[useStyles().h2, { color: dark ? Colors.text : Colors.textLight }]}>{title}</Text>
      </View>
      {right ? <Text style={useStyles().muted}>{right}</Text> : null}
    </View>
  );
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

const useStyles = () => StyleSheet.create({
  card: { borderRadius: 18, padding: 16, borderWidth: 1, marginVertical: 8 },
  h1: { fontSize: FontSize.xxl, fontWeight: '800', marginVertical: 8, letterSpacing: 0.3 },
  h2: { fontSize: FontSize.lg, fontWeight: '700' },
  body: { fontSize: FontSize.md, lineHeight: 22 },
  muted: { color: Colors.muted, fontSize: FontSize.sm, lineHeight: 19 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    flexDirection: 'row',
  },
  btnText: { color: Colors.onPrimary, fontWeight: '800', fontSize: 15 },
  submit: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    flexDirection: 'row',
  },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  ghost: { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 5, flexDirection: 'row', borderWidth: 1 },
  ghostText: { fontWeight: '700', fontSize: 13 },
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
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 },
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
