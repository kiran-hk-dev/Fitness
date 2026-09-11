import { supabase } from './supabase';

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in — log in first.');
  return user.id;
}

const slug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) +
  '-' + Date.now().toString(36);

/** Upload one picked photo to the `user-media` bucket → public URL. Needs 0004. */
export async function uploadUserMedia(localUri: string, folder: 'exercises' | 'yoga' | 'foods'): Promise<string> {
  await requireUserId();
  const res = await fetch(localUri);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from('user-media').upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('user-media').getPublicUrl(path);
  return data.publicUrl;
}

/** Upload up to 5 frames → ordered public URLs for the animated gallery. */
export async function uploadFrameSet(uris: string[], folder: 'exercises' | 'yoga'): Promise<string[]> {
  const urls: string[] = [];
  for (const u of uris.slice(0, 5)) urls.push(await uploadUserMedia(u, folder));
  return urls;
}

// ---------- USER-ADDED EXERCISES (stored in Supabase) ----------
export async function addExerciseToSupabase(opts: {
  name: string; muscleGroup: string; level: string;
  equipment: string; environment?: string; instructions: string[];
  reps?: string; sets?: number; restSec?: number; breathing?: string;
  images?: string[]; focusCues?: string[];
}) {
  const userId = await requireUserId();
  const { error } = await supabase.from('exercises').insert({
    id: slug(opts.name),
    name: opts.name,
    muscle_group: opts.muscleGroup,
    level: opts.level,
    equipment: opts.equipment,
    environment: opts.environment ?? 'both',
    instructions_json: opts.instructions,
    images_json: opts.images ?? [],
    focus_cues_json: opts.focusCues ?? [],
    created_by: userId,
    published: true,
  });
  if (error) throw error;
}

// ---------- USER-ADDED YOGA (stored in Supabase) ----------
export async function addYogaToSupabase(opts: {
  name: string; level: string; durationMin: number; focus: string; poses: string[];
  images?: string[]; poseDetails?: { name: string; image: string; cue: string }[];
}) {
  const userId = await requireUserId();
  const { error } = await supabase.from('yoga_sessions').insert({
    id: slug(opts.name),
    name: opts.name,
    level: opts.level,
    duration_min: opts.durationMin,
    focus: opts.focus,
    poses_json: opts.poses,
    images_json: opts.images ?? [],
    pose_details_json: opts.poseDetails ?? [],
    created_by: userId,
    published: true,
  });
  if (error) throw error;
}

export async function getSupabaseYoga(): Promise<any[]> {
  const { data, error } = await supabase.from('yoga_sessions').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

/** Community exercises added by users (have images_json galleries). */
export async function getSupabaseExercises(): Promise<any[]> {
  const { data, error } = await supabase.from('exercises').select('*').order('name').limit(200);
  if (error) throw error;
  return data ?? [];
}

// ---------- USER-ADDED DIET ITEMS (stored in Supabase) ----------
export async function addFoodToSupabase(opts: {
  name: string; category: string; serving: string;
  calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number;
}) {
  const userId = await requireUserId();
  const { error } = await supabase.from('foods').insert({
    id: slug(opts.name),
    name: opts.name,
    category: opts.category,
    serving_size: opts.serving,
    calories: opts.calories,
    protein_g: opts.protein,
    carbs_g: opts.carbs,
    fat_g: opts.fat,
    fiber_g: opts.fiber ?? 0,
    sugar_g: opts.sugar ?? 0,
    created_by: userId,
    published: true,
  });
  if (error) throw error;
}

export async function getSupabaseFoods(): Promise<any[]> {
  const { data, error } = await supabase.from('foods').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

/** Delete your own food (RLS: created_by must match). */
export async function deleteOwnFood(id: string) {
  const userId = await requireUserId();
  const { error } = await supabase.from('foods').delete().eq('id', id).eq('created_by', userId);
  if (error) throw error;
}

// ---------- DIET PLANS (stored per account in Supabase) ----------
export interface DietPlanDay { day: string; breakfast: string; lunch: string; snack: string; dinner: string }
export interface DietPlan { id: string; name: string; diet: string; days: DietPlanDay[]; created_at: string }

export async function saveDietPlan(name: string, diet: string, days: DietPlanDay[]) {
  const userId = await requireUserId();
  const { error } = await supabase.from('user_meal_plans').insert({
    user_id: userId, name, diet, days_json: days,
  });
  if (error) throw error;
}

export async function getDietPlans(): Promise<DietPlan[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('user_meal_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, name: r.name, diet: r.diet, days: r.days_json ?? [], created_at: r.created_at,
  }));
}

export async function deleteDietPlan(id: string) {
  const { error } = await supabase.from('user_meal_plans').delete().eq('id', id);
  if (error) throw error;
}
