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

## Mekanik jagoan

**Curi mobil apa pun, kabur dari kejaran polisi 3 bintang sebelum waktu habis.**
Setiap mobil yang terparkir bisa dicuri (tombol E) — dan setiap pencurian
menaikkan wanted level. Polisi mengejar dengan mobil patroli dan jalan kaki,
menabrak dan menangkapmu kalau lengah.

## Yang bisa dimainkan

- **Jalan kaki** (WASD + mouse, third person, lari dengan Shift) dan **nyetir**
  mobil apa pun — masuk dengan E, keluar dengan E.
- **Lalu lintas hidup**: 12 mobil AI mengikuti jalan + 22 pejalan kaki yang
  lari ketakutan kalau ada tembakan atau mobil ngebut.
- **Wanted level 0–5 bintang**: naik saat mencuri mobil, menabrak pejalan
  kaki, memukul warga, atau menembak. Polisi mengejar, menabrak mobilmu, dan
  menangkapmu kalau kamu jalan kaki. Wanted memudar kalau kamu bersembunyi.
- **8 misi cerita "Tiga Hari di Velamar"** (Mara & Rico): antar paket, taksi
  kilat, balapan jalanan 4 gerbang, curi Cometa GT, kabur dari polisi 3
  bintang, paket panas di bawah kejaran, tembak balik 3 preman dermaga, dan
  pelarian terakhir ke kapal dengan 4 bintang. Tiap misi: objektif, timer,
  hadiah uang, layar selesai/gagal.
- **Aktivitas sampingan**: taksi dadakan (tombol T — jemput penumpang, antar,
  dibayar $80).
- **Combat**: pukul (F) + pistol (tombol 2, klik untuk tembak) dengan amunisi.
- **Progresi**: uang dari misi & taksi — beli pistol ($150) + amunisi ($40) di
  Toko Senjata "El Gatillo", beli Cometa GT ($1200) di dealer Cometa Motors.
  Progres tersimpan otomatis di localStorage (lanjutkan dari layar start).
- **HUD lengkap**: health, uang, wanted stars, objektif + timer misi,
  kecepatan saat nyetir, minimap live (pemain, polisi, target misi, mobil),
  crosshair, prompt tombol, dan layar start / jeda / misi selesai / gagal /
  tertangkap / tumbang.
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
| `game/src/config.js` | Dunia, distrik, kendaraan, misi, angka game |
| `game/src/city.js` | Membangun kota: jalan, gedung, pantai, Faro Vela |
| `game/src/vehicles.js` | Pabrik mobil 3D + fisika mengemudi arcade |
| `game/src/traffic.js` | Mobil lalu lintas AI + pejalan kaki |
| `game/src/police.js` | Polisi + wanted level 0–5 |
| `game/src/missions.js` | Rantai 8 misi + aktivitas sampingan |
| `game/src/combat.js` | Pukul, pistol, musuh dermaga |
| `game/src/hud.js` | HUD + layar start/pause/misi |
| `game/src/minimap.js` | Minimap canvas live |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/audio.js` | Suara sintetis WebAudio |
| `game/src/save.js` | Save/load localStorage |
| `game/src/shots.js` | Mode screenshot deterministik (`?shot=...`) |
| `game/src/random.js` | RNG deterministik (seeded) |

## Screenshot

Empat screenshot deterministik diambil dari game yang benar-benar jalan
(`shots.json`): kejar-kejaran polisi, nyetir di jalan utama, jalan kaki di
dermaga, dan layar misi selesai.
