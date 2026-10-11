# Virtual Lab JST - Universal Dataset

Website Virtual Lab Jaringan Saraf Tiruan (JST) Supervised Learning yang **mendukung semua dataset CSV**. Pengguna cukup upload file CSV, sistem akan otomatis mendeteksi kolom dan tipe data.

## ✨ Fitur Utama

- **Upload Dataset Sendiri** — Tidak terpaku satu dataset, bisa pakai dataset apapun (CSV format)
- **Auto-Detect Kolom** — Sistem otomatis deteksi tipe kolom: numeric, binary, categorical
- **4 Algoritma JST** — Perceptron, Hebb Rule, Delta Rule, Backpropagation
- **Visualisasi Real-time** — Diagram jaringan di canvas + grafik error training
- **Training Interaktif** — Next Step, Fast Train, Auto Run
- **Testing & Prediksi** — Input data baru, langsung prediksi hasil
- **Download Model** — Simpan weights, bias, konfigurasi sebagai JSON
- **Design Bersih** — Base color putih, secondary soft slate blue

## 📦 Struktur Folder

```
virtual_lab_jst_universal/
├── index.html              # Main entry point
├── css/
│   └── style.css          # Stylesheet (white + soft blue theme)
├── js/
│   ├── algorithms.js      # 4 algoritma JST (Hebb, Perceptron, Delta, Backprop)
│   ├── dataloader.js      # CSV parser + auto column detection + normalization
│   ├── visualizer.js      # Canvas network diagram + Chart.js error graph
│   └── app.js             # Controller: upload, config, training, testing
└── README.md              # Dokumentasi
```

## 🚀 Cara Pakai

### 1. Buka Website
- Double-click `index.html` (lokal)
- Atau upload folder ke hosting (Vercel, Netlify, GitHub Pages)

### 2. Upload Dataset CSV
- Klik area upload atau drag-drop file CSV
- Format CSV: baris pertama = header (nama kolom), baris berikutnya = data
- Contoh:
  ```csv
  age,gender,income,heart_attack
  45,M,50000,1
  32,F,65000,0
  ```

### 3. Konfigurasi
- **Pilih Target Kolom** — Kolom yang ingin diprediksi (output/label)
- **Pilih Fitur Input** — Centang minimal 2 kolom sebagai fitur (input)
- **Pilih Algoritma** — Perceptron, Hebb, Delta, atau Backpropagation
- **Atur Parameter:**
  - Learning Rate: 0.1 (stabil), 0.01 (lambat), 0.3 (cepat)
  - Max Epoch: 200-500 (tergantung ukuran dataset)
  - Threshold: 0.5 (batas keputusan binary)

### 4. Training
- Klik **Auto Run** → otomatis reset + training sampai selesai
- Atau **Reset** → **Fast Train** untuk kontrol manual
- Lihat grafik error — harus turun seiring epoch bertambah

### 5. Prediksi
- Setelah training, isi nilai fitur di panel "Uji Model"
- Klik **Prediksi Sekarang**
- Lihat hasil: Positif/Negatif (0/1) + raw score

### 6. Download Model (opsional)
- Klik **Download Model (JSON)** untuk simpan weights + konfigurasi
- File JSON bisa di-load ulang untuk inference tanpa training ulang

## 📊 Format Dataset CSV

**Syarat:**
- Baris pertama = header (nama kolom)
- Minimal 2 kolom: 1+ fitur input + 1 target
- Target kolom harus binary (0/1 atau "Yes"/"No") atau numeric (akan dinormalisasi)

**Contoh Dataset Sederhana:**
```csv
x1,x2,output
0,0,0
0,1,1
1,0,1
1,1,1
```

**Contoh Dataset Real:**
```csv
age,cholesterol,smoking,diabetes,heart_attack
45,220,1,0,1
32,180,0,0,0
58,260,1,1,1
```

## 🧠 Algoritma JST

### 1. Perceptron (Step Function)
- Fungsi aktivasi: step (0/1)
- Cocok untuk: klasifikasi binary sederhana, linearly separable
- Update rule: `W' = W + lr * (target - output) * x`

### 2. Hebb Rule (Bipolar)
- Fungsi aktivasi: sign (-1/1)
- Cocok untuk: pembelajaran asosiatif, pola bipolar
- Update rule: `W' = W + lr * x * y`

### 3. Delta Rule (LMS)
- Fungsi aktivasi: linear
- Cocok untuk: regresi, minimasi error kuadrat
- Update rule: `W' = W + lr * (target - output) * x`

### 4. Backpropagation (Sigmoid)
- Arsitektur: Input → Hidden (sigmoid) → Output (sigmoid)
- Cocok untuk: dataset kompleks, non-linear
- Multi-layer dengan gradient descent

## 🎨 Desain

- **Base Color:** Putih (#ffffff, #f4f6f9)
- **Primary:** Soft Slate Blue (#3b5998)
- **Accent:** Coral (#e8734a)
- **Success:** Green (#2e9e6a)
- **Font:** Plus Jakarta Sans (Google Fonts)
- **Icons:** FontAwesome 6.5.1

## 🛠 Tech Stack

- HTML5 + CSS3 (vanilla)
- JavaScript ES6+ (vanilla, no framework)
- Chart.js (grafik error training)
- Canvas API (visualisasi jaringan)

## 📝 Catatan

- **Normalisasi otomatis** — Kolom numerik dinormalisasi min-max (0-1)
- **Encoding otomatis** — Kolom kategorikal/binary di-encode ke angka
- **Split otomatis** — 80% training, 20% testing (shuffle random)
- **Browser modern** — Tested di Chrome, Edge, Firefox

## 🔗 Deploy ke Hosting

### GitHub Pages
1. Upload folder ke repo GitHub
2. Settings → Pages → Deploy from branch (master / root)
3. Akses di `https://username.github.io/repo-name/`

### Vercel
1. Upload folder ke GitHub
2. Import repo di Vercel
3. Framework preset: **Other** (static HTML)
4. Deploy

### Netlify
1. Drag folder ke https://app.netlify.com/drop
2. Langsung dapat URL live

## 📄 Lisensi

Open source — silakan digunakan untuk keperluan akademik/pembelajaran.

---

**Dibuat untuk:** Praktikum JST Supervised Learning  
**Tanggal:** Oktober 2024  
**Versi:** 1.0 (Universal Dataset Support)
