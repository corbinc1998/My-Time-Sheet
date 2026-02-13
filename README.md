# Mario Kart World - Time Trial Tracker

A local-first React application for logging and analyzing Mario Kart World time trial runs. Track your lap splits, compare personal bests across tracks, and export your data.

---

## Requirements

- Node.js v22.15.0 or higher
- npm (install via Node Package Manager if not already available)

## Getting Started

```
nvm use 22.15.0
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## Features

### Add Time Trials

Enter a track, character, vehicle, and your lap splits. Lap 3 is calculated automatically from the finished time minus Lap 1 and Lap 2. All three dropdowns (track, character, vehicle) are searchable -- start typing to filter the list, or scroll through all available options.

### Searchable Dropdowns

Track, character, and vehicle fields function as combo inputs. You can type to search and filter the list or click to browse. The full roster of 50 characters and 40 vehicles from Mario Kart World is included.

### Lap 3 Auto-Calculation

Only Lap 1, Lap 2, and the finished time need to be entered. Lap 3 is derived automatically as the difference between the finish and the sum of the first two laps.

### Track Filtering

Once you have runs logged, a filter dropdown appears above the trial list. Select a specific track to view only runs on that course, or choose "All Tracks" to see everything.

### Personal Bests

A summary section at the bottom displays the best individual lap split for each track, along with which character and vehicle achieved it. A combined "split sum" shows the theoretical best time if all three best laps were combined in a single run.

### Export to Spreadsheet (.xlsx)

The XLSX export creates a workbook with two types of sheets. The first sheet is a summary table listing every track you have data for, the number of runs, best lap splits, best split sum, and best finish time. Each track then gets its own sheet containing the full run history with dates, characters, vehicles, and all lap times.

### Export to JSON and CSV

Standard flat exports of all trial data for backup or use in other tools.

### Import from JSON and CSV

Load previously exported data back into the app. Imported data replaces the current session and is saved to local storage.

### Local Storage Persistence

All trial data is saved to the browser's localStorage automatically. Your data persists between sessions without needing a server or account.

---

## Data Format

Time values can be entered as `SS.mmm` (e.g., `32.115`) or `M:SS.mmm` (e.g., `1:41.834`). The app normalizes and displays all times consistently.

---

## Project Structure

```
src/
  TimeSheet.js    Main React component
  styles.css      Application styles
```

---

## Notes

- All data is stored locally in the browser. Clearing browser data will remove saved trials.
- The import function expects the same CSV format produced by the export. Column order: track, character, vehicle, lap1, lap2, lap3, finishedTime, date.