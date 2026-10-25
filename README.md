# flower4you

A local React and Three.js bouquet studio. Choose a wrap and flowers, write a message, design a card, and preview or export the finished bouquet.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Use `npm test` for logic checks and `npm run build` for production output in `dist/`.

## Included

- Segment and Bow wraps, paper patterns, accent/backdrop colors, 10/16/20-stem capacities, spread controls.
- Birthday, Anniversary, Thank you and Just because starters that fill the wrap, flowers, colors, card, words and message.
- Original 3D flower and foliage variants, meanings, six pairings, Surprise, Clear, Arrange, rotation and zoom. Select a placed bloom to adjust its height, position and rotation, or remove that stem.
- A named local bouquet shelf: save or update explicitly, then reopen, duplicate or delete bouquets. Starting a new bouquet does not remove shelf entries.
- A 70-character message, YouTube song selection, voice recording up to 60 seconds, four memory photos and a backdrop photo.
- Floating bouquet text and date, six-template card designer with text/photos/stickers/backgrounds, movement, resizing, rotation, touch pinch, undo and redo.
- IndexedDB recovery of the bouquet, media and unfinished designer. The final preview can share or download a lossless PNG in portrait 2160×2700, square 2160×2160 or story 2160×3840.

Photos accept JPEG, PNG, WebP and GIF up to 10 MB each. Microphone access requires localhost or HTTPS and browser permission. YouTube playback uses the external YouTube embed only when activated; embedding depends on the video's restrictions and network access. Fonts and model assets otherwise load locally.

Drafts belong to one browser and origin. Changing the localhost port creates a separate draft. My bouquets shelf entries live in that same local database and change only when you choose Save or Update. Clearing site data removes local bouquets and media. Failed reads pause saving to protect the existing draft; quota failures preserve the current in-memory edit and show a warning.

Recipient links, QR codes, scheduling, accounts, server uploads, payments and publishing are excluded. The original source assets retain their owners' rights; this repository has no license grant for redistribution.
