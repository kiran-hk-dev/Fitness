// Verify: every EXERCISES id + every YOGA pose id used in sessions has photos.
const fs = require('fs');
const exSrc = fs.readFileSync('src/data/exercises.ts', 'utf8');
const exIds = [...exSrc.matchAll(/id:\s*'([\w-]+)'/g)].map((m) => m[1]);
const media = fs.readFileSync('src/data/exerciseMedia.ts', 'utf8');
const photoBlock = media.split('YOGA_PHOTOS')[0];
const photoIds = new Set([...photoBlock.matchAll(/['"]?([\w-]+)['"]?:\s*F\(/g)].map((m) => m[1]));
const missingEx = exIds.filter((id) => !photoIds.has(id));
console.log('exercises:', exIds.length, '| missing photos:', missingEx.length ? missingEx.join(', ') : 'none');

const yogaSrc = fs.readFileSync('src/data/yoga.ts', 'utf8');
const poseIds = [...yogaSrc.matchAll(/id:\s*'([\w-]+)'/g)].map((m) => m[1]);
const yogaBlock = media.split('YOGA_PHOTOS')[1] || '';
const yogaPhotoIds = new Set([...yogaBlock.matchAll(/['"]?([\w-]+)['"]?:\s*F\(/g)].map((m) => m[1]));
const missingYoga = poseIds.filter((id) => !yogaPhotoIds.has(id));
console.log('yoga poses:', poseIds.length, '| with photos:', poseIds.length - missingYoga.length, '| illustrated fallback:', missingYoga.join(', '));
