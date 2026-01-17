# Seed Product Variants

Script untuk generate product variants dengan data sembako dan minuman.

## 📦 Data yang Di-generate

**8 Products dengan 3 variants each = 24 total variants**

### Products:
1. **Beras Premium** (Sembako)
   - 5kg - Rp 65,000 (Stock: 50)
   - 10kg - Rp 125,000 (Stock: 30)
   - 25kg - Rp 300,000 (Stock: 20)

2. **Minyak Goreng** (Sembako)
   - 1L - Rp 18,000 (Stock: 100)
   - 2L - Rp 35,000 (Stock: 80)
   - 5L - Rp 85,000 (Stock: 40)

3. **Gula Pasir** (Sembako)
   - 1kg - Rp 15,000 (Stock: 150)
   - 5kg - Rp 72,000 (Stock: 60)
   - 10kg - Rp 140,000 (Stock: 30)

4. **Tepung Terigu** (Sembako)
   - 1kg - Rp 12,000 (Stock: 120)
   - 5kg - Rp 58,000 (Stock: 50)
   - 10kg - Rp 110,000 (Stock: 25)

5. **Kopi Bubuk** (Minuman)
   - 100g - Rp 25,000 (Stock: 80)
   - 250g - Rp 60,000 (Stock: 50)
   - 500g - Rp 115,000 (Stock: 30)

6. **Teh Celup** (Minuman)
   - 25 sachet - Rp 15,000 (Stock: 100)
   - 50 sachet - Rp 28,000 (Stock: 70)
   - 100 sachet - Rp 52,000 (Stock: 40)

7. **Susu UHT** (Minuman)
   - 200ml - Rp 5,000 (Stock: 200)
   - 1L - Rp 18,000 (Stock: 100)
   - 1L (6 pack) - Rp 100,000 (Stock: 50)

8. **Mie Instan** (Makanan)
   - 1 pcs - Rp 3,000 (Stock: 500)
   - 5 pcs - Rp 14,000 (Stock: 200)
   - 1 dus (40 pcs) - Rp 110,000 (Stock: 50)

## 🚀 Cara Menjalankan

```bash
# Di folder backend
npm run seed:variants
```

## ✅ Yang Akan Di-create

1. **Categories** (jika belum ada):
   - Sembako
   - Minuman
   - Makanan

2. **Store** (jika belum ada):
   - Toko Pusat (Jakarta)

3. **Products**: 8 products

4. **Product Variants**: 24 variants (3 per product)

5. **Inventory**: 24 inventory records (1 per variant)

## 📝 Notes

- Script menggunakan `upsert` untuk categories, jadi aman dijalankan multiple times
- SKU auto-generated dengan format: `{PRODUCT_CODE}-{SIZE_CODE}-{NUMBER}`
- Contoh SKU: `BER-5KG-001`, `MIN-1L-001`, `KOP-100-001`
- Semua inventory assigned ke store pertama yang ditemukan
- Jika tidak ada store, akan create "Toko Pusat" otomatis

## 🔧 Customization

Edit file `prisma/seed-variants.ts` untuk:
- Tambah/ubah products
- Ubah harga dan stock
- Tambah variants
- Ubah kategori
