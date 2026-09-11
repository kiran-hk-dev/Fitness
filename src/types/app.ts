export type GoalType = 'fat_loss' | 'maintain' | 'muscle_gain' | 'general_fitness';
export type DietType = 'veg' | 'non_veg' | 'eggetarian' | 'vegan';
export type WorkoutLevel = 'easy' | 'normal' | 'advanced';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'core' | 'glutes' | 'legs' | 'cardio' | 'mobility' | 'full_body';
export type Environment = 'home' | 'gym' | 'both';

export interface Profile {
  id: string;
  display_name: string | null;
  age_range: string | null;
  sex: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel;
  goal: GoalType;
  diet_type: DietType;
  workout_level: WorkoutLevel;
  workout_location: Environment;
  equipment: string[];
  preferred_duration_min: number;
  daily_steps_target: number;
  water_target_ml: number;
  sleep_target_h: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  level: WorkoutLevel;
  equipment: string;
  environment: Environment;
  instructions: string[];
  reps: string;
  sets: number;
  rest_sec: number;
  breathing: string;
  tempo: string;
  mistakes: string[];
  contraindications: string;
  regression: string;
  progression: string;
  media_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
}

export interface Food {
  id: string;
  name: string;
  category: string;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
}

export interface YogaPose {
  id: string;
  name: string;
  level: WorkoutLevel;
  duration_sec: number;
  setup: string;
  breathing: string;
  errors: string[];
  easier: string;
  caution: string;
}

export interface NutritionTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_ml: number;
}
