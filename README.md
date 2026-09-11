# FITLIFE 360 — React Native Fitness, Nutrition, Yoga & Habit Coaching App

Expo + TypeScript + Supabase | Expo Router | Android + iOS | Educational wellness guidance (not medical advice).

> **Safety first:** exercises strengthen specific muscles, but fat loss occurs body-wide per genetics + energy balance. No spot-reduction claims, no crash diets, no punishment workouts, no skipping meals. Every exercise page shows form cues, breathing, mistakes, regressions, progressions + stop signals (sharp pain, dizziness, chest pain, faintness).

## 📱 Screens

| Home | Workouts | Exercise guide |
|---|---|---|
| ![Home](screenshots/01-home.png) | ![Workouts](screenshots/02-workouts.png) | ![Exercise guide](screenshots/03-exercise-detail.png) |
| Nutrition | Yoga | Progress |
| ![Nutrition](screenshots/04-nutrition.png) | ![Yoga](screenshots/05-yoga.png) | ![Progress](screenshots/06-progress.png) |

> Capture guide: [`screenshots/README.md`](screenshots/README.md).

## Features
- **User accounts (Supabase):** signup creates `auth.users` + auto `profiles` row (trigger `handle_new_user`); name saved on signup, weight/height saved in onboarding → `profiles` (current) + `body_metrics` (history). RLS: users see only their rows.
- **Auth screens:** animated gym → strength → yoga → food fullscreen slideshow behind a dark veil (`AuthBackdrop`), so login/signup look premium on first impression.
- **Weight + height per account:** Progress → Weight logs both, shows 7-day average + 14-day history from Supabase.
- **Training checkmarks ✓:** Active Workout + Yoga Active have tap-to-check per item; each ✓ inserts into `training_logs` (`user_id`, `log_date`, `kind`, `item_name`, `completed=true`). Repeating a yoga pose/session in a day adds rows → daily count “× N times”.
- **Daily share:** Home shows live weight + yoga names × times + workouts; Progress → Today/share builds `“Weight: X kg | Yoga: Name × N”` text, saves snapshot to `daily_shares`, shares via native Share sheet.
- **Bottom tabs:** clear Ionicons (Home / Workouts / Nutrition / Progress / Profile) with orange active state. Every nested screen has a top nav bar with back button + title; all tab screens end with bottom spacing above the tab bar.
- **4 switchable themes:** Ember (charcoal+orange, default), Volt (black+volt), Abyss (navy+cyan), Ivory (clean light) — Profile → App theme. Applies **instantly** (context + per-render styles, no restart) and persists in AsyncStorage; saved choice loads before first paint (`src/theme/index.tsx` engine; every style flows through `Colors.*` via `useStyles()` factories).
- **Bottom navigation everywhere:** custom bottom nav (Home/Workouts/Nutrition/Progress/Profile) renders on all 26 nested pages too, with active highlighting.
- **Font-free icons (`src/components/AppIcon.tsx`):** all 73 UI icons are official Ionicons artwork embedded as SVG paths and drawn with react-native-svg — identical in Expo Go and standalone APKs/IPAs with zero font loading (`scripts/gen-appicon.js` regenerates from the `ionicons` package; `__tests__/appicon.test.tsx` renders every glyph).
- **Delete anything:** every exercise detail has Delete (community → Supabase) / Hide (built-in → local, restorable from library footer); same for yoga flows. Empty searches offer “Add ‘query’” with the name prefilled in the add form.
- **Auth:** one shared `AuthHeader` (logo + headline) + animated backdrop on all 4 screens; minimal content (fields + submit + quiet links); full disclaimer lives only in onboarding.
- **Launcher icon:** bright orange dumbbell badge (`scripts/gen-icons.js` regenerates `assets/` + all `mipmap-*` PNGs) — rerun the script + rebuild APK after any icon change.
- **Button hierarchy:** hero CTA (one main action per screen), floating Finish pills (workouts/logger), compact pills (log/add/delete), icon-only deletes, ghost secondaries — flat, no glow; images carry the highlight instead.
- **One standard button:** `PrimaryButton` (clean, medium, identical on every page) for all main actions; `SmallButton` pills for inline rows, `IconButton` for tiny deletes, `GhostButton` for secondary routes.
- **Design system (`src/components/ui.tsx` + `Toast.tsx`):**
  - Buttons: `PrimaryButton` = Save/progress (spinner + locked while busy, no double-taps), `SubmitButton` = deeper shade for completing/sending (login, signup, create, share), `GhostButton` = secondary, `SmallButton`/`IconButton` = inline/destructive (danger = red). Destructive always confirms via dialog.
  - Feedback: `toast()` success/error/info toasts (hosted in root layout) for saves; `Alert` only for errors + destructive confirms.
  - Forms: `Field` (label + input + inline validation, no placeholder-only inputs) on auth, onboarding, weight, measurements, plan, add-screens.
  - Pages: `PageHeader` (icon + title + subtitle) on all tabs; `LoadingView`/`ErrorCard` (with retry) on histories; `EmptyState` everywhere empty; `DataRow` tables for logs; `TopSpace`/`BottomSpace` rhythm on all 38 screens.
- **Swipe-to-submit slider:** `SlideButton` (drag past 80% to confirm, snaps back otherwise) guards the big moments — finish workout, finish yoga, start app.
- **Cards, not buttons, for navigation:** `ActionCard` (icon + title + desc + chevron) everywhere you go somewhere; `CheckCard` checkbox-cards for onboarding picks. Real `Button`s only for submit/save. Plans tiers swipe in a horizontal snap **slider** with dots; Profile reminders are ON/OFF **switch sliders** wired to local notifications.
- **Graphs:** weight trend line (Progress → Weight), 7-day activity bars (Progress → Strength), macro donut (Nutrition tab) via react-native-chart-kit.
- **Delete everywhere:** meal logs, workout sessions, checkmarks, weight entries, diet plans — each with confirm dialogs (RLS enforced).
- **3-day log retention:** each user's logs (training, meals, sessions, water, habits, weight, shares) older than 3 days auto-delete — server daily job (`0005`) + silent app-side prune on startup (`pruneOldLogs`). Profiles/plans/foods are never deleted. Change `3` → your days in both places to adjust.
- **Real tracking screens:** Measurements (waist/hip/chest/arm/thigh log + change deltas + delete), Habits (7 daily toggles with streaks + week dot-grid), Monthly Review (last-30-day stats computed live: sessions, yoga, active days, meals, water, weight delta + improved/stalled verdicts).
- **Visual yoga player:** each pose is a big photo card (name, timer, breathing, setup, easier version) + session slideshow preview + per-pose checkmarks.
- **Visual Kind Reset:** animated ½-veg/¼-protein/¼-grain plate + photo steps (hydrate → walk → plate → protein) + animated craving toolkit.
- **Exercise images:** 63 exercises, each with **real start/finish demo photos** auto-playing as an animated loop (0.5x/1x/2x + pause), followed by image-by-image cards pairing each photo with one cue + one "feel it here" focus tag. Every photo was visually inspected against its exercise (plank opens on the hold frame via `EXERCISE_COVERS`; names match photos, e.g. Seated Row / Walk-Jog Intervals). Full-width photo list, muscle filters + search. Photos cached on-device (works offline); URLs in `src/data/exerciseMedia.ts` (all verified live).
- **Yoga images:** 12 sessions with auto-playing pose slideshows; **27/32 poses have distinct real animated photos** (each pose card auto-plays its own start⇄finish gallery + setup/breathing/easier/caution lines); only breath/cobra/downward-dog/warrior/boat use illustrated fallback (no free photos exist for those).
- **Diet images:** foods show real pack photos only when the pack visibly matches the item (verified by inspection — idli/dosa/upma/rice/dal/rajma/chole/paneer/curd/buttermilk/chana/nuts/ragi/chapati); everything else uses clean emoji tiles rather than a wrong photo.
- **Diet images:** every food shows a photo-style image tile + macro chips.
- **Add your own:** Workouts → Add-exercise screen, Yoga → Add-yoga screen, Diet → Add-food screen — pick **up to 5 demo photos** each (animated preview in the form), uploaded to the `user-media` bucket, URLs saved in `images_json` — they animate everywhere instantly for all users. Header **＋** buttons on library/diet/yoga lists jump straight to add; your own foods show a delete button (owner-only RLS).
- **Diet plans in Supabase:** Nutrition → Plan → name any template and save a 7-day plan — stored per account in `user_meal_plans`, listed with delete.
- **Home dashboard:** calorie/protein/water/steps/workout/sleep/streak, quick actions (Start Workout, Log Meal, +Water, Yoga, Progress, “I Ate Too Much”), weekly rings, kind suggestion card.
- **Nutrition engine:** Mifflin-St Jeor TDEE estimate + goal-adjusted calories, protein by body-weight/activity, editable targets, Indian + international food DB (idli, dosa, roti, rice, dal, paneer, eggs, chicken…), meal templates + swaps, grocery list, micronutrient cards with “do not megadose” warnings.
- **“I Ate Rice / Sugar” recovery:** return to normal portions + veg/protein, normal water, optional easy walk, plate guide (½ veg, ¼ protein, ¼ grains), craving toolkit, log “large meal / high-sugar day” without shame.
- **Water:** 150/250/500 ml + custom, target ≈ 35 ml/kg + activity/climate, quiet hours, adaptive reminders, pale-yellow education + overhydration note.
- **Exercise library:** photo grid (2-col) with **real start/finish demo photos** for every move (verified CDN URLs in `src/data/exerciseMedia.ts`, cached on-device via expo-image, illustrated fallback offline). Detail page = photo hero gallery (Start ⇄ Finish toggle) + numbered how-to steps. Filter by muscle + search. Prefetched on open.
- **Photo credit:** demo photos from free-exercise-db (MIT License) — see `PHOTO_CREDIT`.
- **Workout player:** demo on top → name/muscle → set/reps → timer/rest → previous performance → RPE; replace by same pattern; summary with volume + recovery suggestion.
- **Level programs:** Plans screen = 3 separated tiers (Beginner / Medium / Advanced × 10 different exercises each, photo thumbnails); Active Workout loads the chosen tier's actual 10 (never the same-for-all bug).
- **Six-pack/core:** dead bug → plank → hanging knee raise → ab-wheel; 2–4x/week quality reps, visible abs need overall fat loss.
- **Yoga:** easy/normal flows (morning, recovery, stress, sun salutation, core-balance), every pose has setup/breathing/duration/errors/easier/caution.
- **12-week progression:** W1-4 Foundation → W5-8 Build → W9-12 Progress → Reassess (adherence, pain, recovery, form, performance). Increase only after 2 sessions at top rep range with good form + RPE ≤8; else maintain/reduce. Never auto-unlock advanced by time.
- **Progress:** rolling-average weight, measurements/photos (private), consistency/volume/strength/cardio/steps/yoga, protein days, sugar trend, water/sleep, monthly review.
- **Notifications:** workout/water/meal/bedtime/weekly review, adaptive (skip if done), per-category toggle + quiet hours (`expo-notifications`).
- **Admin:** Supabase tables + `published` flag; validate numbers + media URLs before publishing.

## Project structure
```
FitLife360/
  app/  (expo-router)
    _layout.tsx  index.tsx  +not-found.tsx
    (auth)/ welcome, login, signup, forgot-password
    (onboarding)/ profile, goal, diet, equipment, level, schedule, summary
    (tabs)/ index(Home), workouts, nutrition, progress, profile
    workouts/ plans, library, [id], active, summary, history
    nutrition/ logger, search, plan, recipes, grocery, recovery
    yoga/ index, [id], active, history
    progress/ weight, measurements, strength, habits, photos, monthly-review
  src/
    lib/ supabase.ts, queryClient.ts, notifications.ts, tracking.ts (profile/weight/training/yoga/share helpers)
    theme/ colors/spacing
    components/ ui.tsx (Card, Button, Disclaimer, Empty…)
    store/ useAppStore, useWorkoutStore (zustand)
    utils/ nutrition.ts, hydration.ts, progression.ts, safety.ts, format.ts
    data/ exercises.ts, yoga.ts, foods.ts, mealTemplates.ts, workoutPlans.ts
    types/ app.ts
  supabase/ migrations/0001_init.sql (schema+RLS), 0002_user_tracking.sql (training_logs, daily_shares, auto-profile), seed.sql
  __tests__/ core.test.ts
```

## Prerequisites
- Node 18+ / 22, npm, Expo CLI (`npm i -g expo` optional — `npx expo` works)
- Expo Go app on phone (dev) + Android Studio / Xcode (emulators) for full builds
- Free Supabase project: https://supabase.com/dashboard

## 1) Install
```powershell
cd FitLife360
# npm.ps1 may be blocked on Windows — use npm.cmd:
& "C:\Program Files\nodejs\npm.cmd" install
```

## 2) Configure environment
```powershell
Copy-Item .env.example .env
# edit .env:
# EXPO_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```
Get values: Supabase Dashboard → Project Settings → API.

## 3) Set up Supabase — RUN ONE FILE
SQL Editor → run **`supabase/setup-all.sql`** once (runs migrations 0001→0009 in order: schema, RLS on every table, storage buckets + policies, owner-delete rules, 3-day retention). Then:
1. SQL Editor → run `supabase/seed.sql` (foods, exercises, yoga, plans).
2. Auth → enable Email provider; (optional) add Google/Apple OAuth + redirect `fitlife360://`.
3. Verify: Table Editor shows `foods`, `exercises`, `workout_plans`, `yoga_sessions`.

<details><summary>What each migration does (only if you prefer step-by-step)</summary>

- `0001_init.sql` — tables + RLS policies
- `0002_user_tracking.sql` — training_logs + daily_shares + auto-profile trigger + height history
- `0003_content.sql` — `user_meal_plans` + signed-in users may ADD foods/exercises/yoga
- `0004_user_content.sql` — `images_json` galleries + `focus_cues_json`/`pose_details_json` + `created_by` + public `user-media` bucket
- `0005_retention.sql` — 3-day auto-delete + daily pg_cron job (enable pg_cron under Database → Extensions)
- `0006_measurements.sql` — `hip_cm` column
- `0007_rls_gaps.sql` — RLS + read on plan days/exercises; `exercise-media` + private `progress-photos` buckets
- `0008_food_owner.sql` — `created_by` on foods + owner-only delete
- `0009_owner_delete.sql` — owner-only delete on exercises + yoga_sessions
</details>

Media contract (no code change needed to add production assets):
```ts
// exercises table / src/data/exercises.ts
{ media_url: 'https://xyz.supabase.co/storage/v1/object/public/exercise-media/push-up.mp4',
  thumbnail_url: '.../push-up-thumb.jpg' }
```

## 4) Run (dev)
```powershell
& "C:\Program Files\nodejs\npx.cmd" expo start
# then: press a (android) / i (ios) / w (web) or scan QR with Expo Go
```
If port blocked: `npx expo start --port 8082 --clear`.

## 5) Build APK / AAB / IPA
```powershell
# EAS (recommended):
& "C:\Program Files\nodejs\npm.cmd" install -g eas-cli
eas login; eas build:configure
eas build -p android --profile preview   # APK for testing
eas build -p android --profile production # AAB for Play Store
eas build -p ios --profile production     # IPA (needs Apple dev account)

# Local Android (needs Android Studio + SDK):
& "C:\Program Files\nodejs\npx.cmd" expo run:android --variant release
```

## 6) Test + typecheck
```powershell
& "C:\Program Files\nodejs\npm.cmd" test        # jest: nutrition + progression rules
& "C:\Program Files\nodejs\npx.cmd" tsc --noEmit # strict TS
```

## Acceptance checklist
- [ ] Signup creates auth user + `profiles` row; onboarding weight/height lands in `profiles` + `body_metrics`.
- [ ] Workout ✓ and yoga ✓ save to `training_logs`; yoga repeats show “× N times” in Yoga History + Today/share.
- [ ] Share sheet shows `Weight: X kg` + `Yoga: Name × N` + workout ✓ counts; snapshot in `daily_shares`.
- [ ] Browse exercises by muscle/level/home-gym; form guide shows cues + stop signals.
- [ ] Start/finish workout; sets save to `workout_sessions`/`workout_sets`.
- [ ] Log breakfast/lunch/dinner/snacks; totals update.
- [ ] Water tracker + reminders respect quiet hours.
- [ ] Yoga easy/normal/advanced with safety cues.
- [ ] Week-12 reassessment (not auto-advanced); RLS blocks cross-user reads; export/delete works.
- [ ] Disclaimers visible; no “burn X to erase Y”, no VLCD, no spot-reduction promise.

## What NOT built (by design)
No spot-fat-loss claims, no “do Y mins to erase X”, no extreme deficits/detoxes/dehydration, no auto-advanced unlock, no diagnosis.

## Future (optional)
AI coach (guardrailed), posture feedback (opt-in), Health Connect/HealthKit, barcode scan, coach/client mode, challenges (no public weight), PDF/CSV export, i18n (EN/KN/HI/TA/TE).
