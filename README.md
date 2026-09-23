# ifs24051-pabwe-p3

Praktik JavaScript (JS) - PABWE P3.

## Identitas
- Nama: Karina Putri Sion
- NIM: 11S24051
- Proyek: PABWE P3

## Fitur
1. Expense Tracker
   - Tambah, ubah, hapus transaksi
   - Pemasukan dan pengeluaran
   - Ringkasan pemasukan, pengeluaran, saldo
   - Pencarian dan filter
   - Sorting
   - localStorage

2. Bookmark / Link Manager
   - Tambah, ubah, hapus bookmark
   - Validasi URL http/https
   - Buka link pada tab baru
   - Pencarian dan sorting
   - localStorage

3. Quiz App
   - 5 soal dari array of object
   - Pilihan ganda
   - Skor
   - High score dengan localStorage
   - Bisa dimainkan kembali

## Struktur
```text
ifs24051-pabwe-p3/
├── index.html
├── assets/
│   └── script.js
└── README.md
```

## Cara menjalankan
1. Buka folder proyek di VS Code.
2. Buka `index.html` menggunakan browser atau Live Server.
3. Pastikan koneksi internet tersedia karena Bootstrap menggunakan CDN.
4. Coba ketiga tab dan lakukan refresh untuk mengecek localStorage.

## Catatan
Proyek tidak menggunakan backend/API. Semua data disimpan pada localStorage browser.


## Perbaikan P3
- Tab aktif sekarang menggunakan query URL `?tab=expense|bookmark|quiz`, bukan localStorage.
- Navigasi tab menggunakan `URLSearchParams`, `history.pushState`, `history.replaceState`, dan `popstate`.
- State Expense, Bookmark, dan Quiz tetap memakai localStorage dengan key terpisah.
- Konfirmasi hapus menggunakan Bootstrap modal, bukan `confirm()`.
- `escapeHtml()` dan `escapeAttribute()` ditempatkan di bagian helper sebelum digunakan.
- Filter/sort merespons event `input` dan `change`.
