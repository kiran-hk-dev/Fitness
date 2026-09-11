# App screenshots (for GitHub + stores)

Drop PNGs here with these exact filenames — `../README.md` already links them,
so they appear on GitHub automatically after push.

| File | Screen to capture |
|---|---|
| `01-home.png` | Home tab (move of the day + today card) |
| `02-workouts.png` | Exercise library photo grid |
| `03-exercise-detail.png` | Exercise guide with animated demo |
| `04-nutrition.png` | Nutrition tab (macro donut + foods) |
| `05-yoga.png` | Yoga sessions |
| `06-progress.png` | Progress (activity graph) |
| `07-profile.png` | Profile (theme picker) |
| `08-dark-light.png` | Same screen in Ivory theme (optional) |

## How to capture (2 min, no extra tools)

1. Run the app: `npx expo start` → open in **Expo Go** on your phone.
2. Navigate to each screen above, take a phone screenshot.
3. Crop the status bar if you like; keep portrait 1080px wide.
4. Save/rename into this folder, then:
   ```powershell
   git add screenshots
   git commit -m "docs: app screenshots"
   git push
   ```

Tip: switch Profile → App theme → Ivory for one light-mode shot.
