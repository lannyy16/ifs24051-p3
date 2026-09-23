# ifs24051-pabwe-p3

Praktik JavaScript (JS) - PABWE P3.

## Identitas
- Nama: Karina Putri Sion
- NIM: 11S24051
- Proyek: PABWE P3

## Fitur
1. Expense Tracker: CRUD transaksi, ringkasan, pencarian, filter tipe/kategori, sorting, dan localStorage.
2. Bookmark / Link Manager: CRUD bookmark, validasi URL http/https, pencarian, sorting, membuka tautan pada tab baru, dan localStorage.
3. Quiz App: 5 soal dari array of object, skor, high score localStorage, dan tombol main lagi.

## Perbaikan audit
- Tab aktif menggunakan URL query `?tab=expense`, `?tab=bookmark`, atau `?tab=quiz`, bukan localStorage.
- Struktur ARIA tab diperbaiki: tablist berisi tombol role=tab secara langsung dan setiap panel memiliki role=tabpanel.
- Semua select memiliki label yang terhubung.
- Kontras footer diperbaiki agar memenuhi WCAG AA.
- Konfirmasi hapus memakai dialog modal, bukan `confirm()` browser.
- `escapeHtml()` didefinisikan sebelum digunakan.
- Bootstrap, Tabler Icons, dan Google Fonts eksternal dihapus sehingga tidak ada dependency network untuk render awal.
- Script eksternal dimuat dengan `defer`.
- Ditambahkan `assets/index.html` agar path `/assets` tidak menghasilkan 404 pada static deployment.
- Tersedia skip link dan nama dialog yang lebih aksesibel.

## Struktur
```text
ifs24051-pabwe-p3/
├── index.html
├── assets/
│   ├── index.html
│   └── script.js
└── README.md
```

## Menjalankan
Buka folder proyek di VS Code lalu jalankan `index.html` dengan Live Server atau browser.

Contoh URL tab:
- `index.html?tab=expense`
- `index.html?tab=bookmark`
- `index.html?tab=quiz`

Data transaksi, bookmark, dan high score disimpan pada key localStorage yang berbeda.
