// Batch 2: stretch & mobility folders that read as yoga poses.
const CANDIDATES = [
  'Hip_Flexor_Stretch', 'Quadriceps_Stretch', 'Hamstring_Stretch',
  'Standing_Quadriceps_Stretch', 'Chest_Stretch', 'Shoulder_Stretch',
  'Triceps_Stretch', 'Side_Stretch', 'Oblique_Stretch', 'Lower_Back_Stretch',
  'Upper_Back_Stretch', 'Back_Stretch', 'Butterfly_Stretch', 'Groin_Stretch',
  'Lunge_Stretch', 'Kneeling_Hip_Flexor', 'Scorpion_Stretch', 'Thread_the_Needle',
  'Bird_Dog', 'Fire_Hydrant', 'Donkey_Kick', 'Clamshell',
  'Worlds_Greatest_Stretch', 'Seated_Calf_Stretch',
  'Standing_Hamstring_and_Calf_Stretch', 'Chair_Leg_Extended_Stretch',
  'Chair_Upper_Body_Stretch', 'Elbow_Circles',
];
async function main() {
  let ok = 0;
  for (const f of CANDIDATES) {
    const out = [];
    for (const n of ['0.jpg', '1.jpg']) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${f}/${n}`, { method: 'HEAD' });
        out.push(`${n}:${r.status}`);
      } catch (e) { out.push(`${n}:ERR`); }
    }
    const good = out.every((s) => s.includes(':200'));
    if (good) ok++;
    console.log((good ? 'OK   ' : 'miss ') + f + '  ' + out.join(' '));
  }
  console.log(`\n${ok}/${CANDIDATES.length} usable`);
}
main().catch((e) => console.log('FAILED:', e.message));
