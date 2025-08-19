# 📋 ALIRAN KERJA ANTARA PENGGUNA EXCO DAN KEWANGAN MMK

## 🎯 **Gambaran Keseluruhan Sistem**

Sistem Pengurusan Peruntukan EXCO adalah platform digital yang menguruskan aliran kerja program-program EXCO dari peringkat draf sehingga pembayaran selesai. Dokumen ini menerangkan aliran kerja terperinci antara pengguna EXCO dan pegawai Kewangan MMK.

---

## 👥 **Peranan Pengguna dalam Sistem**

### **1. Pengguna EXCO (`exco_user`)**
- **Tanggungjawab**: Mencipta dan menguruskan program-program EXCO
- **Kebolehan**: 
  - Cipta program baharu
  - Muat naik dokumen yang diperlukan
  - Jejaki status program
  - Jawab pertanyaan dari Kewangan MMK
  - Lihat bajet dan peruntukan

### **2. Kewangan MMK (`finance_mmk`)**
- **Tanggungjawab**: Semak, lulus, dan urus program-program EXCO
- **Kebolehan**:
  - Semak semua program yang dihantar
  - Lulus atau tolak program
  - Hantar pertanyaan kepada pengguna EXCO
  - Urus status program
  - Kawal bajet pengguna EXCO

---

## 🔄 **Aliran Kerja Program Lengkap**

### **Peringkat 1: Penciptaan Program (EXCO User)**
```
📝 Draf → 📤 Hantar untuk Semakan
```

**Aktiviti EXCO User:**
1. **Cipta Program Baharu**
   - Isi maklumat program (nama, bajet, penerima)
   - Muat naik dokumen yang diperlukan:
     - Surat Akuan Pusat Khidmat
     - Surat Kelulusan PKN
     - Surat Program
     - Surat EXCO
     - Penyata Akaun Bank
     - Borang Daftar Kod
     - Dokumen tambahan (jika ada)

2. **Hantar untuk Semakan**
   - Klik butang "Submit" untuk hantar program
   - Status berubah dari "Draft" kepada "Under Review"

**Notifikasi:**
- ✅ Admin menerima notifikasi "Program Baharu Dicipta"
- ✅ Kewangan MMK menerima notifikasi "Program Di Bawah Semakan"

---

### **Peringkat 2: Semakan Awal (Finance MMK)**
```
👀 Di Bawah Semakan → ❓ Pertanyaan (jika perlu) → ✅ Lulus / ❌ Tolak
```

**Aktiviti Finance MMK:**
1. **Semak Program**
   - Lihat maklumat program lengkap
   - Semak dokumen yang dimuat naik
   - Tentukan sama ada program memenuhi keperluan

2. **Tindakan yang Boleh Diambil:**
   - **Lulus Program**: Status berubah kepada "Complete can send to MMK"
   - **Tolak Program**: Status berubah kepada "Rejected"
   - **Hantar Pertanyaan**: Status berubah kepada "Query"

**Butang Tindakan yang Tersedia:**
- 👁️ **Lihat Dokumen**: Semak semua dokumen program
- 💬 **Tambah Ulasan**: Beri komen atau arahan
- ❓ **Hantar Pertanyaan**: Tanya soalan kepada pengguna EXCO
- ✅ **Lulus**: Luluskan program
- ❌ **Tolak**: Tolak program

---

### **Peringkat 3: Pengendalian Pertanyaan (jika ada)**
```
❓ Pertanyaan → 📝 Jawapan EXCO → 🔄 Semakan Semula
```

**Jika Finance MMK Hantar Pertanyaan:**

1. **Finance MMK:**
   - Hantar pertanyaan melalui butang "Query"
   - Program status berubah kepada "Query"
   - Notifikasi dihantar kepada pengguna EXCO

2. **EXCO User:**
   - Terima notifikasi pertanyaan baharu
   - Jawab pertanyaan melalui sistem
   - Muat naik dokumen tambahan jika diperlukan
   - Status berubah kepada "Query Answered"

3. **Finance MMK:**
   - Terima notifikasi jawapan
   - Semak jawapan dan dokumen tambahan
   - Buat keputusan: Lulus atau Tolak

---

### **Peringkat 4: Penghantaran ke Pejabat MMK**
```
📋 Lengkap → 🏢 Semakan MMK → ✅ Dokumen Diterima
```

**Aktiviti Finance MMK:**
1. **Semak untuk MMK**
   - Semak semula program dan dokumen
   - Luluskan untuk MMK
   - Status berubah kepada "Document Accepted by MMK"

---

### **Peringkat 5: Pemprosesan Pembayaran**
```
💰 Pembayaran Sedang Diproses → ✅ Pembayaran Selesai
```

**Aktiviti Finance MMK:**
1. **Mulakan Pembayaran**
   - Klik butang "Start Payment"
   - Status berubah kepada "Payment in Progress"

2. **Lengkapkan Pembayaran**
   - Masukkan nombor Voucher
   - Masukkan nombor EFT
   - Klik butang "Complete Payment"
   - Status berubah kepada "Payment Completed"

**Notifikasi:**
- ✅ Pengguna EXCO menerima notifikasi "Pembayaran Selesai"
- ✅ Finance Officer menerima notifikasi
- ✅ Super Admin menerima notifikasi

---

## 📊 **Pengurusan Bajet**

### **Kawalan Bajet oleh Finance MMK:**
1. **Lihat Bajet Pengguna EXCO**
   - Jumlah bajet keseluruhan
   - Bajet yang telah digunakan
   - Bajet yang masih ada

2. **Edit Bajet Pengguna EXCO**
   - Klik butang edit (✏️) pada jadual bajet
   - Masukkan jumlah bajet baharu
   - Klik butang "Save" untuk simpan

3. **Jadual Bajet Menunjukkan:**
   - Nama pengguna EXCO
   - Jumlah program
   - Program yang sedang menunggu
   - Jumlah bajet keseluruhan
   - Bajet yang masih ada

---

## 🔔 **Sistem Notifikasi**

### **Notifikasi untuk EXCO User:**
- 📝 Program status berubah
- ❓ Pertanyaan baharu dari Finance MMK
- ✅ Dokumen diterima oleh MMK
- 💰 Pembayaran selesai
- 💬 Ulasan baharu ditambah

### **Notifikasi untuk Finance MMK:**
- 📝 Program baharu di bawah semakan
- ✅ Pertanyaan dijawab oleh EXCO User
- 💬 Ulasan baharu ditambah
- 🔄 Status program berubah

---

## 📁 **Pengurusan Dokumen**

### **Jenis Dokumen yang Diurus:**
1. **Dokumen Asal** (dimuat naik oleh EXCO User)
3. **Dokumen Tambahan** (jika diperlukan)

### **Fungsi Dokumen:**
- 👁️ **Lihat Dokumen**: Semak kandungan dokumen
- 📥 **Muat Turun**: Muat turun dokumen untuk simpanan
- 📤 **Muat Naik**: Tambah dokumen baharu
- 🔄 **Ganti Dokumen**: Tukar dokumen sedia ada
- 📚 **Sejarah Dokumen**: Lihat semua versi dokumen

---

## ⚡ **Tindakan Pantas**

### **Untuk EXCO User:**
1. **Cipta Program**: Dashboard → Program Management → Create New Program
2. **Jawab Pertanyaan**: Query → Cari program → Klik "Answer Query"
3. **Jejaki Status**: Status Tracking → Lihat kemajuan program

### **Untuk Finance MMK:**
1. **Semak Program**: Program Management → Lihat semua program
2. **Urus Pertanyaan**: Query → Semak pertanyaan dan jawapan
3. **Kawal Bajet**: Dashboard → EXCO Users Budgets → Edit bajet

---

## 🚨 **Status Program dan Makna**

| Status | Makna | Tindakan yang Diperlukan |
|--------|-------|---------------------------|
| **Draft** | Program dalam draf | EXCO User boleh edit dan hantar |
| **Under Review** | Sedang disemak | Finance MMK perlu semak dan buat keputusan |
| **Query** | Ada pertanyaan | EXCO User perlu jawab pertanyaan |
| **Query Answered** | Pertanyaan dijawab | Finance MMK perlu semak jawapan |
| **Complete** | Sedia untuk MMK | EXCO User boleh hantar ke MMK |
| **Under Review by MMK** | Sedang disemak MMK | Finance MMK perlu luluskan |
| **Document Accepted** | Diterima MMK | Finance MMK boleh mulakan pembayaran |
| **Payment in Progress** | Pembayaran diproses | Finance MMK perlu lengkapkan |
| **Payment Completed** | Pembayaran selesai | Program selesai |
| **Rejected** | Ditolak | EXCO User boleh buat semula |

---

## 📋 **Senarai Semak Tindakan**

### **EXCO User Perlu:**
- [ ] Cipta program dengan maklumat lengkap
- [ ] Muat naik semua dokumen yang diperlukan
- [ ] Hantar program untuk semakan
- [ ] Jawab pertanyaan dari Finance MMK (jika ada)
- [ ] Hantar program ke MMK (jika diluluskan)
- [ ] Jejaki status program secara berkala

### **Finance MMK Perlu:**
- [ ] Semak program yang dihantar
- [ ] Buat keputusan: Lulus, Tolak, atau Hantar Pertanyaan
- [ ] Urus pertanyaan dan jawapan
- [ ] Luluskan program untuk MMK
- [ ] Mulakan dan lengkapkan pembayaran
- [ ] Kawal bajet pengguna EXCO

---

## 🔧 **Penyelesaian Masalah**

### **Masalah Biasa dan Penyelesaian:**

1. **Program Tidak Boleh Dihantar**
   - Pastikan semua dokumen dimuat naik
   - Semak maklumat program lengkap
   - Pastikan status program adalah "Draft"

2. **Pertanyaan Tidak Dijawab**
   - Semak tab "Query" dalam sistem
   - Pastikan jawapan dihantar dengan lengkap
   - Muat naik dokumen tambahan jika diperlukan

3. **Bajet Tidak Boleh Diedit**
   - Pastikan anda log masuk sebagai Finance MMK
   - Semak bahawa pengguna adalah EXCO User
   - Cuba refresh halaman dan cuba lagi

4. **Dokumen Tidak Boleh Dimuat Turun**
   - Semak bahawa dokumen wujud dalam sistem
   - Cuba muat turun semula
   - Hubungi admin jika masalah berterusan

---

## 📞 **Bantuan dan Sokongan**

### **Jika Perlu Bantuan:**
1. **Semak dokumentasi sistem** terlebih dahulu
2. **Gunakan sistem notifikasi** untuk komunikasi
3. **Hubungi admin sistem** untuk masalah teknikal
4. **Rujuk manual pengguna** untuk panduan terperinci

### **Maklumat Penting:**
- Sistem berfungsi 24/7
- Semua tindakan direkod dalam sistem
- Notifikasi dihantar secara automatik
- Backup data dibuat secara berkala

---

*Dokumen ini dikemas kini pada: [Tarikh Semasa]*
*Versi: 1.0*
*Dihasilkan untuk: Sistem Pengurusan Peruntukan EXCO*
