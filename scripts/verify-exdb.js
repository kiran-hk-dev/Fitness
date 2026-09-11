// Verify 0.jpg + 1.jpg exist for every curated folder (HEAD requests, no API limit).
const FOLDERS = [
  'Pushups', 'Incline_Push-Up', 'Dumbbell_Bench_Press', 'Seated_Cable_Rows',
  'One-Arm_Dumbbell_Row', 'Wide-Grip_Lat_Pulldown', 'Side_Lateral_Raise',
  'Dumbbell_Shoulder_Press', 'Dumbbell_Bicep_Curl', 'Triceps_Pushdown',
  'Dead_Bug', 'Plank', 'Ab_Roller', 'Bodyweight_Squat', 'Goblet_Squat',
  'Romanian_Deadlift', 'Jogging_Treadmill', 'Cat_Stretch',
  'Butt_Lift_Bridge', 'Childs_Pose',
];
async function main() {
  for (const f of FOLDERS) {
    const out = [];
    for (const n of ['0.jpg', '1.jpg']) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${f}/${n}`, { method: 'HEAD' });
        out.push(`${n}:${r.status}${r.ok ? `(${(+r.headers.get('content-length') / 1024).toFixed(0)}kb)` : ''}`);
      } catch (e) { out.push(`${n}:ERR`); }
    }
    console.log((out.every((s) => s.includes(':200')) ? 'OK   ' : 'MISS ') + f + '  ' + out.join(' '));
  }
}
main().catch((e) => console.log('FAILED:', e.message));
