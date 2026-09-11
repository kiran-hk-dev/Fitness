// Inserts the Screens gallery after the Safety quote in README.
const fs = require('fs');
const f = 'README.md';
const lines = fs.readFileSync(f, 'utf8').split('\n');
const i = lines.findIndex((l) => l.startsWith('> **Safety first:**'));
if (i === -1) { console.log('anchor not found'); process.exit(1); }
const gallery = [
  '',
  '## 📱 Screens',
  '',
  '| Home | Workouts | Exercise guide |',
  '|---|---|---|',
  '| ![Home](screenshots/01-home.png) | ![Workouts](screenshots/02-workouts.png) | ![Exercise guide](screenshots/03-exercise-detail.png) |',
  '| Nutrition | Yoga | Progress |',
  '| ![Nutrition](screenshots/04-nutrition.png) | ![Yoga](screenshots/05-yoga.png) | ![Progress](screenshots/06-progress.png) |',
  '',
  '> Capture guide: [`screenshots/README.md`](screenshots/README.md).',
];
lines.splice(i + 1, 0, ...gallery);
fs.writeFileSync(f, lines.join('\n'));
console.log('gallery inserted after line', i + 1);
