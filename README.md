# VELAMAR — Kota Pelabuhan Matahari

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![rank](https://make.fun/badge/gta6-01/BGBug22/gta6-01-entry/rank.svg)](https://make.fun/c/gta6-01)
[![reward](https://make.fun/badge/gta6-01/BGBug22/gta6-01-entry/reward.svg)](https://make.fun/c/gta6-01)

Game open-world kriminal 3D untuk bounty **gta6-01 "Make GTA 6"** di make.fun.
Kota orisinal yang cerah di tepi laut — bukan tiruan game mana pun.

## Kota

**VELAMAR** — kota pelabuhan bermatahari di tepi laut biru. Landmark-nya
**Faro Vela**, mercusuar merah-putih di ujung dermaga, terlihat dari mana pun
di kota. Lima distrik dengan papan nama besar: Pelabuhan Vela, Kota Tua
(Plaza Mercado), Pantai Azul, Distrik Kaca, dan jalan utama VELAMAR.
Nama distrik juga dicat di jalan (decal tanah) supaya terbaca dari kamera atas.
Gedung ber-grid jendela menyala dengan atap genteng hangat, zebra cross di
semua persimpangan, pantai dengan payung warna-warni dan menara penjaga.

## Mekanik jagoan

**Curi mobil apa pun, kabur dari kejaran polisi 3 bintang sebelum waktu habis.**
Setiap mobil yang terparkir bisa dicuri (tombol E) — dan setiap pencurian
menaikkan wanted level. Polisi mengejar dengan mobil patroli dan jalan kaki,
menabrak dan menangkapmu kalau lengah. Wanted 4 bintang ke atas: helikopter
polisi mengorbit di atasmu.

## Yang bisa dimainkan

- **Jalan kaki** (WASD + mouse, third person, lari dengan Shift) dan **nyetir**
  mobil apa pun — masuk dengan E, keluar dengan E.
- **Lalu lintas hidup**: 26 mobil AI mengikuti jalan + 44 pejalan kaki
  berdetail (topi, warna kulit dan tinggi bervariasi, sebagian bawa ransel)
  yang lari ketakutan kalau ada tembakan atau mobil ngebut.
- **Wanted level 0–5 bintang**: naik saat mencuri mobil, menabrak pejalan
  kaki, memukul warga, atau menembak. Polisi mengejar, menabrak mobilmu, dan
  menangkapmu kalau kamu jalan kaki. Wanted 4+ = helikopter patroli.
  Wanted memudar kalau kamu bersembunyi.
- **Armour**: menyerap damage duluan sebelum health, pulih saat kamu aman
  (wanted 0). **Respect**: naik 1 level tiap misi selesai (mentok LV 5).
- **8 misi cerita "Tiga Hari di Velamar"** (Mara & Rico): antar paket, taksi
  kilat, balapan jalanan 4 gerbang, curi Cometa GT, kabur dari polisi 3
  bintang, **RAMPOK BANK VELA (heist — masuk bank, ambil rampasan, kabur ke
  dermaga di bawah kejaran 2 bintang)**, tembak balik 3 preman dermaga, dan
  pelarian terakhir ke kapal dengan 4 bintang. Tiap misi: objektif, timer,
  hadiah uang, dialog karakter, layar selesai/gagal.
- **Toko (tombol B, dekat toko)**: menu beli asli — pistol ($150), amunisi
  +12 ($40), isi armour penuh ($100) di Toko Senjata "El Gatillo"; beli
  Cometa GT ($1200) di dealer Cometa Motors. Beli pakai tombol 1/2/3 atau klik.
- **Garasi Vela — upgrade (tombol B, dekat garasi)**: Mesin Turbo +10%
  kecepatan per level (maks LV 3, $300), Armour Maks +25 per level (maks
  LV 2, $250), isi armour penuh ($100). Upgrade tersimpan di save dan
  berlaku untuk semua mobil milikmu.
- **Aktivitas sampingan**: taksi dadakan (tombol T — jemput penumpang, antar,
  dibayar $80).
- **Combat**: pukul (F) + pistol (tombol 2, klik untuk tembak) dengan amunisi.
- **Progresi**: uang dari misi & taksi — beli pistol ($150) + amunisi ($40) di
  Toko Senjata "El Gatillo", beli Cometa GT ($1200) di dealer Cometa Motors,
  upgrade mesin & armour di Garasi Vela. Progres tersimpan otomatis di
  localStorage (lanjutkan dari layar start).
- **HUD lengkap**: health, armour, respect, uang, senjata + amunisi, wanted
  stars + label (DICARI POLISI / BURONAN / PALING DICARI), objektif + jarak
  tujuan + timer misi, jam kota (DAY 1 18:24, maju saat main), dialog misi,
  distrik, radio (SOL FM 95.4), kecepatan + nama mobil saat nyetir, minimap
  live (pemain, polisi, target misi, mobil), crosshair, prompt tombol, dan
  layar start / jeda / misi selesai / gagal / tertangkap / tumbang.
- **Suara sintetis** (WebAudio, tanpa file): mesin, sirene polisi, tembakan,
  koin misi.

## Kontrol

| Tombol | Aksi |
|---|---|
| WASD / panah | Jalan / nyetir |
| Mouse (drag) | Putar kamera |
| Shift | Lari |
| E | Masuk / keluar mobil |
| F | Pukul |
| Klik kiri | Tembak (pistol) |
| 1 / 2 | Tangan kosong / pistol |
| M | Mulai misi berikutnya |
| T | Taksi dadakan |
| B | Beli (di dekat toko) |
| H | Klakson |
| P / Esc | Jeda |

## Cara main

Buka `game/index.html` lewat server statis apa pun (mis. `node serve.ts`,
lalu http://localhost:8080). Game berjalan offline sepenuhnya — three.js
di-vendor lokal di `game/vendor/three.module.min.js`, tanpa network request.

## Struktur source

| File | Tugas |
|---|---|
| `game/src/main.js` | Loop utama, kontrol pemain, kamera, toko, save |
| `game/src/config.js` | Dunia, distrik, kendaraan, misi, dialog, angka game |
| `game/src/city.js` | Membangun kota: jalan, gedung, pantai, Faro Vela |
| `game/src/vehicles.js` | Pabrik mobil 3D + fisika mengemudi arcade |
| `game/src/traffic.js` | Mobil lalu lintas AI + pejalan kaki berdetail |
| `game/src/police-chase.js` | Polisi + wanted level 0–5 + helikopter |
| `game/src/wanted-level.js` | Aturan wanted murni (jumlah unit, label, armour) |
| `game/src/story-campaign.js` | Rantai 8 misi (termasuk heist) + dialog + aktivitas sampingan |
| `game/src/textures.js` | Tekstur prosedural (aspal, fasad Art Deco, neon, kontainer, pasir, laut, matahari, awan) |
| `game/src/human.js` | Karakter manusia 3D berartikulasi (jalan, aim, idle, senjata) |
| `game/src/combat.js` | Pukul, pistol, musuh dermaga |
| `game/src/hud.js` | HUD + menu beli + layar start/pause/misi |
| `game/src/minimap.js` | Minimap canvas live |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/audio.js` | Suara sintetis WebAudio |
| `game/src/save.js` | Save/load localStorage (termasuk upgrade garasi) |
| `game/src/screenshot-staging.js` | Mode screenshot chase-camera deterministik (`?shot=...`) |
| `game/src/random.js` | RNG deterministik (seeded) |

## Screenshot

Empat screenshot deterministik diambil dari game yang benar-benar jalan
(`shots.json`), semuanya kamera chase 3D street-level: kejar-kejaran golden-hour
di boulevard pantai dengan Cometa GT + helikopter + mercusuar Faro Vela,
kabur heist malam dari Bank Vela dengan sorot searchlight helikopter,
tembak-menembak jalan kaki di Dermaga Puerto Vela (kontainer + crane + kapal),
dan siang cerah di Plaza Mercado dengan banner "MISSION PASSED! +$5,000".
