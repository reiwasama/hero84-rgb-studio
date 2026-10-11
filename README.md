# HERO84 RGB Studio

An unofficial, local WebHID lighting studio for the **AULA HERO84 HE**. 104 effects, a frame-by-frame effect editor, English/Turkish UI, favorites, profiles and experimental top-bar synchronization.

## Run

1. Download this repository using **Code → Download ZIP** and extract it.
2. Open `HERO84-RGB-Studio.html` in desktop Chrome or Edge. On Windows, use `HERO84-Baslat.cmd` for a separate app window with reduced background timer throttling.
3. Close other keyboard/RGB software. Choose **Connect keyboard**, select your keyboard, then **Start effect**.
4. Use **Stop and restore** before closing. After an unexpected exit, reconnect using the same browser profile and choose **Restore from backup**.

No installation or server is needed for the bundled HTML. The app does not upload data. Profiles, editor projects and lighting backups stay in browser storage. Export your custom effects as JSON to share them.

## Compatibility and limits

Confirmed on HERO84 HE, USB `372E:103E`, model identity `18691697672197`, firmware raw value `534`. Other firmware revisions and operating systems have not been hardware-verified. This is not a universal AULA driver.

Only lighting commands are implemented. Polling rate, Rapid Trigger, actuation, key mapping and macros are not changed. The FPS setting controls RGB updates, not keyboard polling.

Live frames are limited to three packets and up to 21 color groups to avoid observed flicker. Nearby colors may be merged. Top-bar synchronization follows dominant colors; independent RGB control of individual bar segments is **not confirmed**. The bar's built-in modes remain responsible for movement.

The page must remain open. The Windows launcher reduces background throttling but cannot run effects during sleep or after the app closes. Browser storage deletion also deletes recovery backups. Preview and automated tests do not prove compatibility with an untested keyboard.

## How to test your keyboard's compatibility

If you have a HERO84 HE but aren't sure about the firmware version, follow these safe steps to test compatibility:

1. Open `chrome://device-log` in Chrome/Edge and reconnect your keyboard. Check if the USB ID matches **372E:103E**.
2. Open the app, click **Connect keyboard**, and select your device. If it connects without errors, WebHID communication is working.
3. **Safe Light Test:** Go to the Effect Studio, paint just **one single key** (like the Spacebar) with a bright color, and press **Play my effect**. 
   - If the correct key lights up, your layout and firmware are fully compatible.
   - If a wrong key lights up or nothing happens, your firmware version might be different. Please open an Issue and share your firmware raw value.


## Effect Studio

Paint keys by dragging, duplicate frames, adjust durations and enable smooth transitions. Up to 60 frames, 50–5000 ms each. Sample an existing effect to start editing, or import/export an effect JSON file. Press **Play my effect** to preview and **Start effect** to send it to your keyboard.

## Development

Node.js 22 or newer; no package dependencies:

```sh
npm test
npm run build
```

Edit `src/`; the build produces the standalone HTML. See [CONTRIBUTING.md](CONTRIBUTING.md) for effects, translations and new keyboard support. Tests use a simulated USB device; contributors must report physical-device testing separately.

## License and assets

Project code is MIT licensed. Unofficial and not affiliated with AULA, Razer or character rights holders. Character-inspired scenes are stylized fan effects; the code license does not grant rights to third-party names, characters or trademarks. No vendor driver bundle, captured USB logs, or copyrighted animations are distributed in this repository. Contributions must have redistribution permission.

## Disclaimer

This is an independent, open-source project and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with AULA or any of its subsidiaries or its affiliates. The official AULA website can be found at : www.aulastar.com/

The names AULA and AULA HERO84 HE as well as related names, marks, emblems and images are registered trademarks of their respective owners.

## Türkçe

ZIP'i indirip çıkart; `HERO84-RGB-Studio.html` dosyasını Chrome/Edge ile aç. Windows'ta ayrı pencere için `HERO84-Baslat.cmd` kullan. Diğer RGB uygulamalarını kapat, klavyeye bağlan ve efekti başlat. Kapatmadan önce **Durdur ve geri yükle** seç. Sağ üstten Türkçe/English değiştirebilirsin.

Yalnızca ışıkları kontrol eder; Hz, Rapid Trigger ve tuş ayarlarına dokunmaz. Üst bar eşlemesi deneysel ve bölgesel çok renk kontrolü doğrulanmış değil. Farklı klavyeler için ayrı protokol ve tuş haritası gerekir. Stüdyoda kendi efektini oluşturup JSON olarak paylaşabilirsin.
