# Split Bill Chibi — Patungan dengan Nimiq

Aplikasi patungan (split bill) bergaya anime chibi hewan lucu, dengan login dompet Nimiq dan pembayaran NIM.

## Tampilan & gaya

- Tema pastel ceria ala kartu stiker: warna soft peach/mint/lavender, sudut sangat membulat, garis tebal lucu, bayangan empuk.
- Font bulat-playful untuk judul, font bersih untuk angka. Tidak memakai gaya "AI ungu-putih" generik.
- Maskot chibi hewan (kucing, panda, kelinci, rubah, penguin, dll) sebagai avatar tiap orang, dengan reaksi animasi: melambai saat ditambahkan, mata berbinar saat lunas, pusing saat masih berhutang.
- Semua warna dipasang sebagai token desain agar konsisten di mode terang & gelap.

## Halaman

1. **Beranda (/)** — sambutan maskot, tombol "Masuk dengan Nimiq", ringkasan tagihan aktif, dan tombol buat patungan baru.
2. **Buat / detail tagihan** — tambah teman (pilih maskot hewan), tambah item, pilih mode bagi rata atau per item, pajak & tip, ringkasan "siapa bayar berapa" dalam USD dan NIM.
3. **Roda keberuntungan** — putar roda berisi maskot peserta; hasilnya bisa dipakai untuk menentukan siapa traktir/dapat diskon, lalu diterapkan ke perhitungan.
4. **Papan skor & lencana** — peringkat pembayar tercepat, streak, lencana seperti "Raja Traktir", "Kilat Bayar", "Si Lupa".

## Fitur perhitungan

- **Bagi rata**: total dibagi jumlah orang.
- **Per item**: tiap item bisa ditandai dimakan siapa saja (termasuk patungan satu item berdua/bertiga), pembagian otomatis proporsional.
- Pajak dan tip dibagi proporsional terhadap porsi masing-masing.
- Nilai ditampilkan ganda: USD dan NIM, dengan kurs yang bisa diatur/diambil saat konversi.

## Nimiq

- **Login dompet**: `@nimiq/hub-api` untuk memilih alamat. Hanya alamat publik yang disimpan; kunci privat tidak pernah disentuh aplikasi.
- **Bayar**: `@nimiq/mini-app-sdk` (Nimiq Pay checkout) untuk mengirim NIM ke alamat penerima tagihan, dengan jumlah sesuai porsi. Status "lunas" ditandai setelah checkout berhasil.
- Semua di jaringan uji dulu supaya aman dicoba, gampang dipindah ke jaringan utama nanti.

## Penyimpanan data

Sesuai permintaan: **belum pakai database**. Data tagihan disimpan sementara di perangkat (browser) dan kodenya ditulis lewat satu lapisan penyimpanan tunggal, sehingga nanti tinggal ditukar ke Lovable Cloud atau backend lain tanpa membongkar tampilan. Belum ada data contoh — mulai kosong.

## Catatan teknis

- TanStack Start + Tailwind v4 token di `src/styles.css`; rute: `/` (beranda, mengganti placeholder), `/bill/$billId`, `/wheel`, `/leaderboard`.
- Paket: `@nimiq/hub-api`, `@nimiq/mini-app-sdk`, `motion` untuk animasi maskot.
- Hub API hanya boleh dimuat di sisi browser (dynamic import setelah hidrasi) supaya render server tidak error.
- Lapisan data: `src/lib/store.ts` dengan antarmuka `BillsStore` (localStorage sekarang, Cloud nanti).
- Perhitungan split murni di `src/lib/split.ts` agar mudah diuji dan dipakai ulang.
- Maskot chibi dibuat sebagai aset gambar dan animasi CSS/Motion.
- Tiap halaman punya judul & deskripsi sendiri untuk pratinjau tautan.
