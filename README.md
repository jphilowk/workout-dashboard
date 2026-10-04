# My workouts

A simple phone-friendly workout dashboard with Arms and Chest routines, editable exercises, new workouts, a rest timer, and JSON backup/restore.

Workout changes are stored in localStorage on the current device and browser. There is no server-side workout storage or account. Clearing website data removes saved changes; use Save backup to export them first.

On iPhone, open the site in Safari and add it to the Home Screen before entering changes. Use that same Home Screen app consistently. The timer is silent and displays Rest complete at zero. The countdown catches up when returning from the background.

Served as plain static files on GitHub Pages. No build step or dependencies.

## Progress

Tap Log workout to save a dated snapshot of completed exercises. Adjust session values and uncheck skipped exercises before saving. Routine edits do not rewrite past sessions. Progress is a separate page with per-exercise weight, total reps, and sets charts that update when new sessions are saved. Existing workouts are preserved; no historical sessions are invented. Bodyweight entries can be compared by reps or sets. Weight charts convert lb/kg for comparison; assisted-machine weights represent assistance, not load lifted.

Session history is stored with the workouts under the existing localStorage key and included in exported backups. Older backups without history still work; restoring any backup replaces both routines and history. Reps are a whole number per set, or a comma-separated number for each set. For example, 3 sets of 8 total 24 reps, while 2 sets of 7, 4 total 11 reps.
