// Verify 0.jpg + 1.jpg for all NEW folders before adding them to the app.
const FOLDERS = [
  'Dips_-_Chest_Version', 'Cable_Chest_Press', 'Band_Assisted_Pull-Up',
  'Elevated_Cable_Rows', 'Standing_Military_Press', 'Arnold_Dumbbell_Press',
  'Face_Pull', 'Hammer_Curls', 'Barbell_Curl', 'Preacher_Curl',
  'Bench_Dips', 'EZ-Bar_Skullcrusher', 'Seated_Triceps_Press',
  'Crunches', 'Reverse_Crunch', 'Russian_Twist', 'Hanging_Leg_Raise',
  'Side_Bridge', 'Dumbbell_Lunges', 'Barbell_Hip_Thrust',
  'Standing_Calf_Raises', 'Rowing_Stationary', 'Freehand_Jump_Squat',
  'Standing_Gastrocnemius_Calf_Stretch', 'Mountain_Climbers',
  'Seated_Glute', 'Lying_Glute', 'Pelvic_Tilt_Into_Bridge',
];
async function main() {
  let ok = 0;
  for (const f of FOLDERS) {
    const out = [];
    for (const n of ['0.jpg', '1.jpg']) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${f}/${n}`, { method: 'HEAD' });
        out.push(`${n}:${r.status}`);
      } catch (e) { out.push(`${n}:ERR`); }
    }
    const good = out.every((s) => s.includes(':200'));
    if (good) ok++;
    console.log((good ? 'OK   ' : 'MISS ') + f + '  ' + out.join(' '));
  }
  console.log(`\n${ok}/${FOLDERS.length} verified`);
}
main().catch((e) => console.log('FAILED:', e.message));
