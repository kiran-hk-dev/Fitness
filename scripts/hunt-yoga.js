// Hunt for real yoga-pose photo folders.
const CANDIDATES = [
  'Superman', 'Hollow_Body_Hold', 'Wall_Sit', 'Bear_Crawl', 'Inchworm',
  'Cobra', 'Cobra_Push-Up', 'Sphinx', 'Locust', 'Bow_Pose',
  'Pigeon_Pose', 'Pigeon', 'Boat_Pose', 'Tree_Pose', 'Warrior',
  'Downward_Dog', 'Down_Dog', 'Upward_Dog', 'Triangle_Pose', 'Chair_Pose',
  'Eagle', 'Camel', 'Fish_Pose', 'Shoulderstand', 'Headstand',
  'Crow_Pose', 'Dolphin', 'Lizard_Pose', 'Happy_Baby', 'Reclined_Twist',
  'Legs_Up_The_Wall', 'Frog_Stretch', 'Sphinx_Push-Up', 'Prone_Cobra',
  'Dolphin_Push-Up', 'Tiger_Pose',
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
