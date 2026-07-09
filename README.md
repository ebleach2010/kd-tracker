# NeuroTrack

A personal, offline, single-page web app for tracking neurological function over time after
autoimmune encephalitis (AE) — and relating it to variables like exertion, sleep, meals,
medication changes, IVIG timing, illness, and childcare load.

**All health data stays on your device** (browser `localStorage`). Nothing is sent anywhere.
The code contains no personal data, which is why this repo can be public.

## Use it on your phone

1. Enable **GitHub Pages** for this repo (Settings → Pages → Deploy from branch → `main` / root).
2. Open the published URL (e.g. `https://<you>.github.io/<repo>/`) in Safari.
3. **Share → Add to Home Screen.** It installs as an app and works offline after first load.

You can also just open `index.html` directly in a browser.

## What it does

- **Daily end-of-day check-in** (~5 min): 18 subjective sliders (fatigue, brain fog, PEM, ice-brain,
  depression, anxiety, overstimulation, sleep quality, nicotine, and more), sleep timing (in-bed /
  onset / wake → total sleep + efficiency), meals (count / quality / signed skip-intent),
  medications & supplements, and glucose / blood pressure.
- **Weekly full assessment** (Thursday evening): everything above plus a **procedural cognitive
  battery** — Stroop, Symbol-Digit, Digit Span, Trail-Making B, Visual Search, and delayed word
  recall (stimuli vary each week to blunt practice effects) — and public-domain questionnaires:
  **DASS-21, PCL-5, DERS-16, and BFI-10** (monthly).
- **Episode toggles** for illness, childcare, and PEM crashes — flip on/off; times are editable.
- **Medication model:** baseline meds are hidden; you log only deviations. Doses are in **mg**
  (`0 mg` = skipped), each log defaults to *acute change/timing* vs *chronic regimen change*.
  The engine detects **streaks** (e.g. Concerta 5 days → stop) and analyzes the **14-day
  post-change window** for rebound/withdrawal effects.
- **Trends chart** (Robinhood-style): **QOL** (blue, higher = better), **Cognitive Ability**
  (green, higher = better), and a **Neuroinflammation Index** (pink, higher = worse).
- **Insights**: a transparent, self-training correlation engine (Spearman + literature priors +
  Bayesian shrinkage), with continuous **25–100% confidence**, multi-lag / after-effect analysis,
  and false-positive safeguards (constant-dose meds aren't spuriously correlated; changes are).
- **History** calendar + list, **Events** log, **CSV / JSON / .ics** export, full backup/restore.

## The Neuroinflammation Index (important)

This is a **symptom-derived proxy, not a biomarker.** It does not measure cytokines, antibodies, or
imaging. It weights the symptoms and cognitive scores that research most consistently links to
inflammation (fatigue, brain fog, slowed processing speed, anhedonia, disrupted sleep), compares
them to *your own* rolling baseline, and floor-anchors the result to 0–100 (≈10 = your calm
baseline, higher = worse). See the in-app **Model Card** (Insights → "How it's built") and the
**Sources** tab for the evidence and its limitations. **Do not use it to self-diagnose a relapse —
contact your neurologist for medical decisions.**

## Maintenance / re-tuning with a future model

This app calls no AI at runtime. To improve it later, hand `index.html` (and/or an exported CSV/JSON)
to a new Claude session and ask it to re-tune the tunable constants, keeping the data schema and UI
stable. The knobs are all named, near the top of the `<script>`:

- `CONFIG.sliders` / `CONFIG.sliderDesc` — subjective items + per-notch descriptors
- `CONFIG.neuroWeights` — neuroinflammation index loadings + orientation
- `CONFIG.scoreMap` — QOL / Cognitive mapping + weights
- `CONFIG.priors` — literature priors for the correlation engine
- `Stats.confidence()` — the 25–100% confidence formula
- `Neuro.compute()` / `Score.compute()` — index math
- `SOURCES` — citations shown in the Sources tab

## Development

`_test/` contains headless Playwright drivers used to validate the single file:

```
npm i -D playwright-core
node _test/full.js      # renders every tab with seeded data, checks exports, asserts no errors
node _test/daily.js     # drives a full daily assessment end-to-end
```

Syntax check the app script after edits:

```
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const m=[...h.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)];require('fs').writeFileSync('/tmp/a.js',m[m.length-1][1])" && node --check /tmp/a.js
```

## Disclaimer

Not a medical device. For personal tracking only. Not a substitute for professional medical care.
