// Real exercise demo photos (start + end positions), MIT-licensed open data.
// Every URL below was verified live (HTTP 200). Cached on-device by expo-image.
// If a photo fails offline, UI falls back to the built-in SVG figure.

const CDN = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const F = (folder: string) => ({
  start: `${CDN}/${folder}/0.jpg`,
  end: `${CDN}/${folder}/1.jpg`,
});

export interface ExercisePhotos {
  start: string;
  end: string;
}

/** Our exercise id -> real demo photos */
export const EXERCISE_PHOTOS: Record<string, ExercisePhotos> = {
  'push-up': F('Pushups'),
  'incline-push-up': F('Incline_Push-Up'),
  'db-press': F('Dumbbell_Bench_Press'),
  'band-row': F('Seated_Cable_Rows'),
  'db-row': F('One-Arm_Dumbbell_Row'),
  'lat-pulldown': F('Wide-Grip_Lat_Pulldown'),
  'lateral-raise': F('Side_Lateral_Raise'),
  'db-shoulder-press': F('Dumbbell_Shoulder_Press'),
  'db-curl': F('Dumbbell_Bicep_Curl'),
  'cable-pressdown': F('Triceps_Pushdown'),
  'dead-bug': F('Dead_Bug'),
  plank: F('Plank'),
  'ab-wheel': F('Ab_Roller'),
  'bodyweight-squat': F('Bodyweight_Squat'),
  'goblet-squat': F('Goblet_Squat'),
  rdl: F('Romanian_Deadlift'),
  walking: F('Jogging_Treadmill'),
  'cat-cow': F('Cat_Stretch'),
  'dips-chest': F('Dips_-_Chest_Version'),
  'cable-fly': F('Cable_Chest_Press'),
  'pull-up': F('Band_Assisted_Pull-Up'),
  'seated-row': F('Elevated_Cable_Rows'),
  'military-press': F('Standing_Military_Press'),
  'arnold-press': F('Arnold_Dumbbell_Press'),
  'face-pull': F('Face_Pull'),
  'hammer-curl': F('Hammer_Curls'),
  'barbell-curl': F('Barbell_Curl'),
  'preacher-curl': F('Preacher_Curl'),
  'bench-dips': F('Bench_Dips'),
  skullcrusher: F('EZ-Bar_Skullcrusher'),
  'overhead-extension': F('Seated_Triceps_Press'),
  crunch: F('Crunches'),
  'reverse-crunch': F('Reverse_Crunch'),
  'russian-twist': F('Russian_Twist'),
  'hanging-knee-raise': F('Hanging_Leg_Raise'),
  'side-plank': F('Side_Bridge'),
  lunge: F('Dumbbell_Lunges'),
  'hip-thrust': F('Barbell_Hip_Thrust'),
  'calf-raise': F('Standing_Calf_Raises'),
  rowing: F('Rowing_Stationary'),
  'jump-squat': F('Freehand_Jump_Squat'),
  'calf-stretch': F('Standing_Gastrocnemius_Calf_Stretch'),
  'decline-press': F('Decline_Dumbbell_Bench_Press'),
  'incline-db-press': F('Incline_Dumbbell_Press'),
  'chin-up': F('Chin-Up'),
  'inverted-row': F('Inverted_Row'),
  'upright-row': F('Upright_Barbell_Row'),
  'front-raise': F('Front_Dumbbell_Raise'),
  'seated-lateral': F('Seated_Side_Lateral_Raise'),
  'concentration-curl': F('Concentration_Curls'),
  'incline-curl': F('Incline_Dumbbell_Curl'),
  'rope-pushdown': F('Triceps_Pushdown_-_Rope_Attachment'),
  'triceps-dips': F('Dips_-_Triceps_Version'),
  'cable-crunch': F('Cable_Crunch'),
  'oblique-crunch': F('Oblique_Crunches_-_On_The_Floor'),
  'pallof-press': F('Pallof_Press'),
  'leg-press': F('Leg_Press'),
  'hack-squat': F('Hack_Squat'),
  'bulgarian-split': F('Split_Squat_with_Dumbbells'),
  'leg-curl': F('Seated_Leg_Curl'),
  'glute-kickback': F('Glute_Kickback'),
  'single-leg-bridge': F('Single_Leg_Glute_Bridge'),
  'battle-ropes': F('Battling_Ropes'),
};

/** Yoga pose id -> real demo photos (poses without photos use illustrated fallback) */
export const YOGA_PHOTOS: Record<string, ExercisePhotos> = {
  catcow: F('Cat_Stretch'),
  child: F('Childs_Pose'),
  bridge: F('Butt_Lift_Bridge'),
  'side-bridge-pose': F('Side_Bridge'),
  'mountain-climb': F('Mountain_Climbers'),
  'seated-glute': F('Seated_Glute'),
  'lying-glute': F('Lying_Glute'),
  'pelvic-bridge': F('Pelvic_Tilt_Into_Bridge'),
  'calf-wall-stretch': F('Standing_Gastrocnemius_Calf_Stretch'),
  'itband-stretch': F('IT_Band_and_Glute_Stretch'),
  'chair-back-stretch': F('Chair_Lower_Back_Stretch'),
  'seated-hamstring': F('Seated_Hamstring_and_Calf_Stretch'),
  'elbow-to-knee': F('Elbow_to_Knee'),
  'chin-chest-stretch': F('Chin_To_Chest_Stretch'),
  'superman-flow': F('Superman'),
  'inchworm-walk': F('Inchworm'),
  'hamstring-fold': F('Hamstring_Stretch'),
  'shoulder-opener': F('Shoulder_Stretch'),
  'triceps-shoulder-stretch': F('Triceps_Stretch'),
  'upper-back-opener': F('Upper_Back_Stretch'),
  'hip-flexor-lunge': F('Kneeling_Hip_Flexor'),
  'worlds-greatest': F('Worlds_Greatest_Stretch'),
  'seated-calf': F('Seated_Calf_Stretch'),
  'standing-hamstring-calf': F('Standing_Hamstring_and_Calf_Stretch'),
  'chair-leg-stretch': F('Chair_Leg_Extended_Stretch'),
  'chair-upper-stretch': F('Chair_Upper_Body_Stretch'),
  'elbow-circles': F('Elbow_Circles'),
};

export const PHOTO_CREDIT = 'Demo photos: free-exercise-db (MIT License)';

/**
 * Cover frame per exercise (what thumbnails + galleries open on).
 * Default 0 (start). Plank's start frame is a kneeling rest pose, so its
 * cover is the actual hold (frame 1) — verified by visual inspection.
 */
export const EXERCISE_COVERS: Record<string, number> = { plank: 1 };
export function coverIndex(exerciseId: string): number {
  return EXERCISE_COVERS[exerciseId] ?? 0;
}

/** Runtime registry for user-uploaded galleries (5-frame Supabase images). */
const customRegistry = new Map<string, string[]>();
export function registerCustomImages(id: string, urls: string[]) {
  if (urls.length) customRegistry.set(id, urls.slice(0, 5));
}
export function customImagesFor(id: string): string[] {
  return customRegistry.get(id) ?? [];
}

export function photosForExercise(exerciseId: string): ExercisePhotos | null {
  return EXERCISE_PHOTOS[exerciseId] ?? null;
}

export function photosForPose(poseId: string): ExercisePhotos | null {
  return YOGA_PHOTOS[poseId] ?? null;
}

/** All photo URLs (for prefetching on the library screen). */
export function allPhotoUrls(): string[] {
  return [
    ...Object.values(EXERCISE_PHOTOS).flatMap((p) => [p.start, p.end]),
    ...Object.values(YOGA_PHOTOS).flatMap((p) => [p.start, p.end]),
  ];
}
