# Adventures

An offline, clickable scrapbook of someone's videos. Open `index.html` in a
browser — no server, no build, no internet.

## Putting your own videos in

**1. Copy the videos off your phone into `videos/`.**

iPhone: plug into a Mac, open Photos → select the clips → File → Export →
*Export Unmodified Original*. Or AirDrop them to the desktop and drag them in.
Android: plug in and copy from `DCIM/Camera`.

**2. Generate a starter list.**

```bash
python3 import-videos.py
```

It scans `videos/`, groups clips shot on the same day into one adventure,
guesses each date, and writes `adventures.generated.js`. It never touches
`adventures.js`, so you can run it as many times as you like.

**3. Move those entries into `adventures.js` and write the real bits** — the
titles, the places, the notes. That file is the only one you need to edit;
everything else reads from it.

**4. Open `index.html`.**

## What an entry looks like

```js
{
  id:    "big-sur",                    // unique; also the #deep-link
  title: "Big Sur, in the fog",
  date:  "2019-07-14",                 // "2019", "2019-07", or "2019-07-14"
  place: "California",
  tags:  ["road trip", "camping"],     // become the filter buttons up top
  note:  "The one where the tent...",
  src:   "videos/big-sur.mp4"          // or ["videos/a.mp4", "videos/b.mp4"]
}
```

Only `title` is required. Leave anything else out and the page skips it.

Other optional keys: `clipTitles` (labels for a multi-clip adventure),
`poster` (a still image for the card — otherwise a frame is pulled from the
video itself), `thumbAt` (which second to pull that frame from), and `embed`
(an iframe URL, if a video is hosted somewhere private instead of sitting in
this folder).

The wording on the title card and the dedication live in `SETTINGS` at the top
of `adventures.js`. `order: "oldest"` makes it read forward from the beginning
like a story instead of newest-first.

## If a video doesn't play

Chrome and Firefox won't play **HEVC `.mov`**, which is what an iPhone records
by default. `import-videos.py` flags those and prints the fix. Short version:

```bash
cd videos
for f in *.MOV *.mov; do
  ffmpeg -i "$f" -c:v libx264 -crf 22 -c:a aac -movflags +faststart "${f%.*}.mp4"
done
```

Originals are left alone. To avoid the problem entirely, set the phone to
*Settings → Camera → Formats → Most Compatible* before exporting.

You can also sidestep it by setting the phone to export as MP4, or by using
`embed:` with an unlisted Vimeo/YouTube link instead of a local file.

## Giving it to him

Zip the whole `adventures/` folder and AirDrop it, put it on a USB stick, or
drop it in a shared Drive folder. He unzips and opens `index.html`. It works
with the wifi off, and it keeps working in ten years.

**Don't commit the videos to this repo.** It's the public GitHub Pages site —
anything pushed here is world-readable at a guessable URL. `.gitignore` is set
up so `videos/` stays local by default; only the demo clips are tracked.

## Housekeeping

- Delete the three example entries in `adventures.js` and the
  `videos/example-*.webm` files once your own are in.
- `adventures.generated.js` is scratch output. It's gitignored and the page
  never loads it.
- Keyboard: `←` `→` move between adventures, `Esc` closes.
