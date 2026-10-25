# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

flower4you is a browser-based bouquet-making experience. A person chooses a wrap and flowers, attaches a personal message and optional media, designs a card, and previews the completed creation locally.

## Operating Context

The application uses React, Vite, Three.js, browser media APIs, and IndexedDB. Its workflow is Wrap → Flowers → Message, followed by local Preview. It currently runs locally; publication is outside the agreed scope.

## Capabilities and Constraints

- Preserve every existing feature during the redesign, including state validation, media limits, error handling, accessibility, local persistence and unfinished designer recovery.
- Keep the existing 3D flower and wrap geometry and all selectable bouquet colors.
- Preserve saved bouquets, message media, custom colors, card artwork, card history and in-progress designer work. No destructive migration or automatic recoloring.
- Select a placed bloom to adjust its height, position and rotation, or remove that stem; the change updates the 3D scene and is saved with the draft.
- Provide a named local bouquet shelf with explicit Save or Update, reopen, duplicate and delete actions. The draft continues to autosave separately.
- Offer Birthday, Anniversary, Thank you and Just because starters that fill the wrap, flowers, colors, card, words and message using existing catalog values.
- Keep browser-only storage. Do not add accounts, server uploads, share links, QR codes, delivery scheduling or unrelated features. The finished bouquet can be exported as a portrait, square or story PNG for native sharing or download.
- Mobile retains the larger approximately half-screen bouquet preview, as explicitly selected by the user.

## Brand Commitments

- Display the brand exactly as `flower4you`.
- Use a distinct stationery workbench visual identity and layout.
- New card defaults adopt the current theme; previously saved artwork retains its appearance.

## Product Principles

- Keep the bouquet and personal message at the center of the experience.
- Change presentation without changing the product's capabilities.
- Protect saved creative work and local media.
- Keep controls understandable, reachable and keyboard-operable.

## Open Decisions

Public positioning, business model and audience beyond the person making a local bouquet have not been specified and must not be invented.
