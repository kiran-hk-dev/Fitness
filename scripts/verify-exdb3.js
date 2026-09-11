// Verify 0.jpg + 1.jpg for the NEXT batch of exercise/yoga folders.
const FOLDERS = [
  'Decline_Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'Chin-Up',
  'Inverted_Row', 'Upright_Barbell_Row', 'Front_Dumbbell_Raise',
  'Seated_Side_Lateral_Raise', 'Concentration_Curls', 'Incline_Dumbbell_Curl',
  'Triceps_Pushdown_-_Rope_Attachment', 'Dips_-_Triceps_Version',
  'Cable_Crunch', 'Oblique_Crunches_-_On_The_Floor', 'Pallof_Press',
  'Leg_Press', 'Hack_Squat', 'Split_Squat_with_Dumbbells',
  'Seated_Leg_Curl', 'Glute_Kickback', 'Single_Leg_Glute_Bridge',
  'Kettlebell_Swing', 'Box_Jump', 'Burpee', 'Jump_Rope', 'Battling_Ropes',
  'IT_Band_and_Glute_Stretch', 'Chair_Lower_Back_Stretch',
  'Seated_Hamstring_and_Calf_Stretch', 'Elbow_to_Knee', 'Chin_To_Chest_Stretch',
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
