# MDRRMO Floridablanca — Advisory Poster Generator

Web app (installable on iPhone, Android and desktop) for making advisory posters for the Municipality of Floridablanca, Pampanga. No login, no server: everything runs in the browser.

Posters: Heat Index · Rainfall Advisory · Thunderstorm Advisory · Heavy Rainfall Warning · Tropical Cyclone Bulletin

## Structure

```
index.html              launcher (poster menu)
manifest.webmanifest    app name, icons, shortcuts
sw.js                   offline cache (service worker, must stay in the root)
pages/                  the five poster generators
assets/css/app.css      launcher styles
assets/js/app.js        install button, iPhone hint, online status, update toast
assets/js/tools.js      shared poster tools (see Features)
assets/img/             logos and advisory icons
assets/icons/           app icons (192, 512, maskable, apple-touch)
```

## Features

- **Remember inputs:** every poster form keeps its last values on the device. *Clear form* empties the text fields.
- **Presets:** *Save preset* stores the current form under a name; pick it from the *Presets* list to fill the form again. Per poster, per device.
- **Recent posters:** the last 10 downloaded or shared posters (thumbnail + text). *Edit* reopens the text, *Download again* re-creates the poster. Map and satellite images are not stored, so add them again if needed.
- **Share:** sends the poster image (both slides for the cyclone bulletin) through the phone's share sheet and copies the Facebook caption to the clipboard. Where sharing is not supported, it downloads the image instead.
- **Check before download/share:** warns about empty fields, unusual heat-index values, a date that is not today, an old cyclone bulletin time, a level/message mismatch on the heavy rainfall warning, and a missing map. Warnings never block; staff can continue anyway.

All data stays in the browser (localStorage). Nothing is sent to a server.

## Publish on GitHub Pages

1. Push this folder's contents to the repository root.
2. Repository → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. Open the `https://<user>.github.io/<repo>/` link. HTTPS is what enables install and offline use.

## Releasing an update

1. Edit the files.
2. Change `VERSION` in `sw.js` (e.g. `mdrrmo-posters-v1.1.1`) and the version text in `index.html`.
3. Push. Open apps show a **Refresh** prompt on their next visit.

Current version: **1.2.0**