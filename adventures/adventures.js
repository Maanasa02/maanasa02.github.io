/* ============================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT.

   1. Drop video files into  adventures/videos/
   2. Add an entry below for each adventure.
   3. Save, refresh the page. Done.
   ============================================================ */

window.SETTINGS = {
  // The big word on the title card and at the top of the page.
  title: "Adventures",

  // Small line above the title.
  kicker: "A few years of getting into things",

  // Italic line under the title on the opening card.
  subtitle: "for you",

  // Longer dedication under the heading on the main page.
  dedication: "Every stupid, beautiful thing we talked each other into. " +
              "Click anything.",

  // Line at the very bottom.
  colophon: "Made for you. Happy birthday.",

  // "newest" puts the most recent year first. "oldest" starts at the beginning
  // and reads forward like a story.
  order: "newest"
};


/* ------------------------------------------------------------
   Each adventure looks like this. Only `title` is required —
   leave anything else out and the page just skips it.

   {
     id:    "big-sur",                 // used for #deep-links; keep it unique
     title: "Big Sur, in the fog",
     date:  "2019-07-14",              // "2019", "2019-07" or "2019-07-14"
     place: "California",
     tags:  ["road trip", "camping"],  // become the filter chips up top
     note:  "The one where the tent...",
     src:   "videos/big-sur.mp4"       // one clip
     src:   ["videos/a.mp4", "videos/b.mp4"]   // ...or several
     clipTitles: ["The drive", "The tent"],    // optional labels for those
     poster: "posters/big-sur.jpg",    // optional; otherwise a frame is pulled
                                       // from the video itself
     thumbAt: 2.5,                     // optional; which second to grab
     embed: "https://player.vimeo.com/video/123456"  // instead of src, if the
                                       // video is hosted somewhere private
   }

   The four below are examples to show the shape. Delete them.
   ------------------------------------------------------------ */

window.ADVENTURES = [

  /* ---- The three below are demos, using the placeholder clips in videos/.
          Delete these entries and delete videos/example-*.webm once your own
          adventures are in. ---- */

  {
    id: "example-single",
    title: "The one with the flat tire",
    date: "2024-08-03",
    place: "Somewhere off the 5",
    tags: ["road trip"],
    note: "Two hours on the shoulder and you still said it was a good day.",
    src: "videos/example-1.webm"
  },

  {
    id: "example-multi",
    title: "Three days, no plan",
    date: "2023-11-19",
    place: "Big Sur",
    tags: ["road trip", "camping"],
    note: "You packed one fork.",
    src: ["videos/example-2.webm", "videos/example-3.webm"],
    clipTitles: ["Getting there", "The fire"]
  },

  {
    id: "example-vertical",
    title: "That whole summer",
    date: "2022",
    place: "Everywhere",
    tags: ["summer"],
    note: "Shot upright, the way everything on a phone is. It fills the screen\n" +
          "instead of hiding between two black bars.",
    src: "videos/example-4.webm"
  }

];
