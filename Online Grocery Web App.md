# **Online Grocery Web App**

---

The following document is the main guide and instructions for final project development. Each feature listed should be further developed and researched by looking at similar projects. Critical thinking is essential in analyzing and developing the features mentioned in this document.  
---

# **Description**

Project ini akan dikerjakan oleh satu grup beranggotakan tiga orang. Pembagian fitur untuk setiap anggotanya sesuai dengan fitur utama yang dipilih. Total poin yang dapat diterima oleh masing masing student adalah 100 poin, yang mana akan dibagi secara merata bobotnya pada setiap fitur yang dikerjakan. Semua fitur wajib untuk dikerjakan untuk bisa mendapatkan nilai yang maksimal.

## **Main Features**

**Online Grocery Web App** adalah sebuah aplikasi *e-commerce* yang memiliki fungsi untuk berbelanja secara *online*, dimana si pembeli dapat memilih lokasi toko tersebut. Adapun toko yang menjual barang memiliki beberapa cabang yang terletak di lokasi berbeda. Setiap toko menjual produk yang sama (toko di lokasi lain merupakan cabang). 

Pada aplikasi ini ada dua jenis pengguna, diantaranya user sebagai pembeli, dan admin sebagai pengelola toko. Adapun kelebihan dari toko online ini, terdapat pada fitur diskon yang dapat dikustomisasi berdasarkan kondisi tertentu dan di implementasikan pada saat proses pembelian suatu barang.

* Fitur utama yang harus dikerjakan pada **Online Grocery Web App** ini adalah memberikan rekomendasi kepada pembeli untuk mendapatkan pelayanan dari toko dengan lokasi terdekat dengan si pembeli  
* Saat landing page di akses, user akan diminta untuk memberikan ijin mendapatkan lokasi (longitude dan latitude) pada saat pertama kali mengakses web.  
* Setiap kali landing page diakses, data produk yang dimunculkan harus berdasarkan toko terdekat dari posisi yang didapatkan dari user.  
* Pesanan yang masuk, akan diteruskan ke masing masing admin pada lokasi yang terpilih. Admin pada lokasi tersebut bertanggung jawab untuk memproses pesanan hingga selesai.  
* Stok yang terlihat oleh user adalah stok dari toko cabang tersebut.  
* Terdapat fitur diskon atau promo, dimana akses tersebut didapatkan dengan beberapa cara diantaranya:  
  * Pembelian barang tertentu berupa beli satu gratis satu  
  * Pembelian barang dengan minimal total pembelanjaan tertentu akan diberikan voucher yang dapat disimpan dan digunakan pada transaksi selanjutnya.  
  * Diskon dapat ditentukan secara langsung pada produk produk tertentu  
  * Pemberian diskon yang terdapat pada voucher memiliki beberapa jenis, diantaranya:  
    * Voucher yang dapat digunakan hanya pada satu produk tertentu  
    * Voucher yang dapat digunakan untuk total pembelanjaan dengan ketentuan maksimal potongan yang sudah ditentukan  
    * Potongan harga bisa berupa presentasi dan nominal  
    * Terdapat expired date pada voucher yang diterbitkan  
    * Penggunaan voucher dibagi jadi dua yaitu untuk perbelanjaan dan untuk ongkos kirim  
    * Gratis ongkos kirim diberikan jika pembeli telah melakukan beberapa transaksi sebelumnya  
    * Terdapat referral code yang bisa didapatkan dari user lain saat melakukan pendaftaran, dan akan dihadiahkan sebuah voucher potongan belanja.  
* **Key points :**  
  * Tentukan batas maksimal suatu toko dapat melayani pembelian user  
  * Jika user berada diluar dari jangkauan toko terdekat, berikan pesan kepada user bahwa layanan tidak dapat digunakan dan sarankan menggunakan lokasi lain  
  * Tampilan harus mobile first

## **User**

* User berperan sebagai pembeli  
* Jika ingin melakukan pembelian suatu produk, user diwajibkan sudah memiliki akun pada aplikasi. Jika user belum memiliki akun, maka diwajibkan untuk mendaftar terlebih dahulu.  
* User dapat melihat barang apa saja yang dijual oleh toko tersebut  
* User dapat melihat ketersediaan stok barang dari tiap toko  
* Produk yang muncul di landing page merupakan produk yang berasal dari toko terdekat dari lokasi yang dipilih oleh user

## **Admin**

* Admin berperan sebagai pengelola toko  
* Admin dibagi menjadi dua jenis: super admin, store admin  
* Super admin bertugas untuk mengatur pembuatan data store admin dan dapat melihat keseluruhan data dari semua toko  
* Store admin bertugas untuk mengelola barang masuk dan keluar dari suatu toko

## **Order Statuses**

Berikut ini beberapa status pesanan yang ada pada aplikasi. Tidak menutup kemungkinan untuk menyesuaikan status pesanannya masing masing.

* *Menunggu Pembayaran*  
  * Status ketika user pertama kali membuat pesanan. Pada tahap ini user harus melakukan pembayaran dan mengupload bukti bayar terlebih dahulu.  
* *Menunggu Konfirmasi Pembayaran*  
  * Admin bertanggung jawab untuk mengecek dan mengkonfirmasi pembayaran yang dilakukan oleh user, kemudian mengubah statusnya menjadi “Diproses”  
* *Diproses*  
  * Status ketika sedang memproses pesanan, termasuk jika memang terjadi mutasi barang antar gudang. Admin bertanggung jawab untuk mengubah statusnya menjadi “Dikirim” ketika semua barang sudah siap untuk dikirim.  
* *Dikirim*  
  * Status yang akan muncul ketika pesanan sudah dikirimkan.  
* *Pesanan Dikonfirmasi*  
  * Status ketika pesanan sudah diterima oleh user. Apabila user tidak mengubah status pesanan dalam kurun waktu 7 hari setelah pengiriman, maka status akan berubah secara otomatis.  
* *Dibatalkan*  
  * Status ini akan muncul ketika user membatalkan pesanan (hanya boleh sebelum pembayaran) atau ketika admin membatalkan pesanan (untuk pembayaran yang sudah diterima, akan dikembalikan di luar sistem)

# **Features**

## **Feature 1**

### **Homepage / Landing Page (20 Point)**

Homepage / landing page ini adalah halaman awal yang akan muncul ketika aplikasi diakses. Menampilkan informasi ketersediaan produk, kategori hingga promo yang ada pada toko. User akan diminta untuk memberikan izin akses lokasi perangkat supaya informasi yang ditampilkan sesuai dengan toko terdekat. Pada fitur ini student diminta untuk membuat :

* **Homepage / Landing Page**  
  * Navigation bar : berisikan menu-menu utama dari aplikasi yang akan dibuat.  
  * Hero section : berisikan informasi umum atau promosi dalam bentuk carousel  
  * Product list : menampilkan daftar produk yang ada di toko terdekat  
  * Footer : berisikan informasi tambahan dari aplikasi yang dibuat.  
* **Location-based store selection**  
  * User yang telah memberikan akses lokasi perangkat akan mendapatkan informasi berdasarkan toko yang terdekat. Data lokasi akan dijadikan parameter untuk mengambil data ke API. Jika user tidak memberikan akses lokasi maka secara otomatis diarahkan ke data toko utama.

### **User Authentication and Profiles (35 Point)**

Fitur ini berfokus pada proses autentikasi user, mulai dari registrasi hingga update profile. Student diminta untuk membuat :

* **User Authorization**  
  * User yang belum terdaftar dan terverifikasi, akan di-redirect ke homepage ketika akses halaman yang seharusnya tidak diperbolehkan untuk diakses (misalnya halaman profil atau cart)  
  * Untuk fitur tertentu yang tidak bisa digunakan (misal add to cart), makan akan disabled  
  * Muncul keterangan atau notifikasi bahwa user belum terdaftar atau belum terverifikasi  
* **User Registration**  
  * User dapat melakukan registrasi pada aplikasi  
  * Proses registrasi bisa menggunakan email dan menggunakan social login (google / fb / twitter dll)  
  * User tidak dapat menggunakan email yang sudah terdaftar  
  * Untuk registrasi menggunakan email, tidak perlu untuk memasukan password pada tahap ini  
  * Untuk registrasi menggunakan email, user akan dikirimkan email untuk dapat memverifikasi data dan juga memasukan password  
* **Email Verification and Set Password**  
  * Setelah proses registrasi, terdapat proses verifikasi user yang dikirimkan melalui email  
  * Verifikasi hanya boleh dilakukan sekali dan memiliki batas waktu maksimal satu jam setelah email dikirim. Jika sudah lewat dari satu jam,   
  * Pada halaman verifikasi, disediakan juga sebuah form untuk memasukan password  
  * Proses verifikasi dilakukan bersamaan dengan memasukan password  
  * Password harus di enkripsi di database  
  * User akan diminta untuk login kembali setelah proses verifikasi selesai  
  * User yang belum terverifikasi tidak bisa membuat pesanan  
  * User dapat memverifikasi ulang email, jika statusnya belum terverifikasi  
* **User Login**  
  * User dapat login ke dalam aplikasi menggunakan email dan password atau social login  
  * Setelah login, user akan di redirect ke halaman terakhir sebelum login  
* **Reset Password**  
  * User dapat mereset password mereka melalui fitur reset password  
  * Pada saat di-submit, akan dikirimkan email untuk memproses reset password  
  * Reset password hanya boleh dilakukan sekali per request  
  * Terdapat dua halaman :  
    * Reset Password → untuk mengisi data email yang akan direset dan proses pengiriman link reset password ke email yang sesuai  
    * Confirm Reset Password → untuk mengkonfirmasi reset password serta memasukan password yang baru  
  * Fitur ini hanya dapat digunakan untuk user yang melakukan registrasi menggunakan email dan password (bukan social login)  
* **User Profile**  
  * User dapat melihat detail profil mereka.  
  * User dapat memperbarui data personal, termasuk password dan juga foto profil.  
  * Validasi terhadap foto yang diupload, ekstensi yang diperbolehkan hanya .jpg, .jpeg, .png dan .gif dan juga maksimum ukurannya adalah 1MB.  
  * User dapat memperbarui email, tetapi wajib untuk diverifikasi ulang  
  * User dapat memverifikasi ulang email, jika statusnya belum terverifikasi

### **User Address, Location Determination and Shipping Cost Calculation (20 Point)**

Student akan membuat fitur untuk penentuan lokasi, dimana penentuan lokasi akan menentukan harga pengiriman yang akan dibayarkan oleh seorang user dalam melakukan transaksi dan melakukan pengecekan jarak maksimal dari lokasi user ke lokasi toko yang dituju.

* **Manage User Address**  
  * User dapat memiliki lebih dari satu alamat  
  * User dapat menghapus dan memperbarui alamat yang sudah disimpan sebelumnya  
  * User dapat mengatur sebuah alamat menjadi alamat utama pada aplikasi  
* **Set Shipping Address in Checkout Page**  
  * Fitur ini akan berhubungan dengan fitur checkout  
  * Pada saat masuk ke halaman checkout, user bisa memilih alamat pengiriman  
  * Jika user belum memiliki alamat, maka user diwajibkan untuk membuat alamat baru  
  * User dapat mengganti alamat yang telah dipilih  
* **Choose and Calculate Shipping Cost**  
  * Setelah alamat dipilih, user dapat memilih metode pengiriman yang tersedia  
  * Dapat menggunakan [API RajaOngkir](https://rajaongkir.com/dokumentasi/starter) atau free API lainnya untuk menentukan biaya pengiriman  
  * Sebaiknya data harga pengiriman di duplikat ke database sendiri agar lebih dapat diandalkan

### **Store Management (15 Point)**

Super admin dapat mengatur toko, detail lokasi serta akses kepada toko tersebut. Data toko ini juga akan terhubung dengan data inventori produk dan promo. Pada fitur ini student diminta untuk membuat :

* **Store Management**  
  * Super Admin dapat melihat, membuat, memperbarui dan menghapus data toko  
  * Super Admin dapat menentukan titik lokasi toko secara detail  
  * Store admin tidak dapat mengakses fitur ini  
* **Assign Store Admin**  
  * Super Admin dapat menempatkan store admin user pada toko tertentu tertentu  
  * Store admin tidak dapat mengakses fitur ini

### **Mentor Evaluation (10 Point)**

Mentor akan menilai secara keseluruhan mulai dari proses development hingga hasil akhirnya. Detail penilaian akan dijelaskan dibawah.

## **Feature 2**

### **Admin Account Management (10 Point)**

Untuk bisa masuk ke dalam admin dashboard, data user dengan role admin harus dibuat terlebih dahulu. Terdiri dari dua jenis yaitu Super Admin dan Store Admin, dimana Super Admin mempunyai hak akses yang lebih tinggi dibandingkan dengan Store Admin. Pada fitur ini student diminta untuk membuat :

* **Admin Authorization**  
  * Hanya user dengan role admin yang dapat masuk ke dalam admin dashboard  
* **Manage User Data**  
  * Admin dapat melihat, membuat, memperbarui dan menghapus data user dengan role store admin  
  * Admin dapat melihat semua data user yang telah teregistrasi (bukan hanya admin)  
  * Hanya super admin yang bisa mengakses menu ini

### **Product Management (25 Point)**

Student diminta membuat fitur untuk dapat mengatur dan menampilkan data produk yang tersedia.

* **Product Catalog and Product Search**  
  * User dapat melihat daftar produk yang ada pada aplikasi  
  * User dapat mencari produk sesuai dengan yang diinput  
  * Untuk produk yang sudah tidak ada stoknya, tetap akan muncul namun tidak bisa ditambahkan ke cart  
  * Stok dari produk akan dilihat dari masing masing toko  
* **Product Detail**  
  * User dapat melihat halaman informasi yang mendetail tentang sebuah product  
  * Pada halaman ini, nantinya user dapat memasukan barang ke keranjang  
* **Product Management**  
  * Admin dapat melihat daftar produk yang mereka jual  
  * Admin dapat melihat, membuat, memperbarui dan menghapus data product  
  * User dapat menambahkan foto produk lebih dari satu  
  * Validasi data produk, tidak boleh ada produk dengan nama yang sama  
  * Validasi terhadap foto yang diupload, ekstensi yang diperbolehkan hanya .jpg, .jpeg, .png dan .gif dan juga maksimum ukurannya adalah 1MB.  
  * Store admin hanya dapat melihat datanya saja (read only)  
* **Product Category Management**  
  * Admin dapat melihat, membuat, memperbarui dan menghapus data product category  
  * Validasi data category, tidak boleh ada category dengan nama yang sama  
  * Store admin hanya dapat melihat datanya saja (read only)

### **Inventory Management (20 Point)**

Untuk fitur inventory management ini, mencakup bagaimana stok dari sebuah produk akan dikelola. Admin nantinya akan dapat melakukan perubahan stok hingga mencatat perubahan stoknya.

* **Stock Management**  
  * Stok barang akan berbeda setiap toko  
  * Admin dapat membuat, memperbarui dan menghapus data stok dari sebuah product  
  * Untuk admin utama, dapat memilih toko terlebih dahulu sebelum memperbarui stok  
  * Untuk store admin, toko akan otomatis terpilih dan tidak bisa diganti  
  * Proses pembaruan stok bukan hanya langsung mengubah jumlah barang saja. Sebelum jumlah barang diperbarui, akan dibuatkan jurnal terkait perubahan stok (pengurangan atau penambahan) yang akan menjadi history perubahan stok. Stok akan diperbarui berdasarkan jurnal yang dibuat tersebut.

### **Discount Management (20 Point)**

Admin pada setiap toko dapat mengatur diskonnya masing masing. Pada fitur ini, student diminta untuk membuat :

* **Discount Management**  
  * Admin store dapat membuat ketentuan diskon pada suatu produk, diantaranya:  
    * Diskon tanpa ketentuan yang di pasangkan secara manual pada suatu produk  
    * Diskon yang penggunaannya berdasarkan syarat minimal pembelanjaan mencapai suatu nilai yang telah ditentukan dengan memberikan limitasi nilai diskon  
    * Beberapa pembelian produk yang memiliki ketentuan beli satu gratis satu  
  * Untuk diskon yang diberikan harus dicatat sehingga dapat digunakan ke dalam bentuk laporan  
  * Diskon dapat berupa prosentase atau pun nominal   
  * Buat satu page tersendiri untuk membuat diskon management  
* Apply Discount

### **Report & Analysis (15 Point)**

* **Sales Report**  
  * Admin dapat melihat laporan penjualan untuk semua toko, dan dapat memfilter data berdasarkan toko  
  * Store admin hanya dapat melihat laporan pada toko masing masing  
  * Laporan yang perlu disediakan :  
    * Laporan penjualan perbulan  
    * Laporan penjualan per bulan berdasarkan kategori produk  
    * Laporan penjualan per bulan berdasarkan produk  
* **Stock Report**  
  * Admin dapat melihat history perubahan stok untuk semua toko, dan dapat memfilter data berdasarkan toko  
  * Store admin hanya dapat melihat laporan pada toko masing masing  
  * Laporan yang perlu disediakan :  
    * Ringkasan laporan stok semua produk perbulan (total penambahan, total pengurangan dan stok akhir)  
    * Detail laporan stok per produk per bulan (semua history stok selama satu bulan)

### **Mentor Evaluation (10 Point)**

Mentor akan menilai secara keseluruhan mulai dari proses development hingga hasil akhirnya. Detail penilaian akan dijelaskan dibawah.

## **Feature 3**

### **Shopping Cart (20 Point)**

Di fitur ini akan berfokus pada bagaimana user melakukan transaksi, mulai dari proses memasukan produk ke dalam keranjang. Disini student akan diminta untuk membuat :

* **Add to Cart**  
  * User dapat memasukan barang yang dia inginkan ke dalam cart  
  * Apabila sudah ada barang yang sama dalam cart, maka hanya akan menambah jumlahnya saja  
  * Apabila stok tidak tersedia, maka tidak dapat menambahkan barang ke cart  
  * User yang belum teregistrasi maupun terverifikasi, tidak dalam menambahkan barang ke cart  
  * Pada navbar, wajib menampilkan jumlah product yang sudah ditaruh pada cart.  
* **Update Cart**  
  * User dapat memperbarui jumlah produk  
  * User dapat menghapus data produk dari cart

### **Checkout Process & Order Tracking (35 Point)**

Pada proses checkout, user dapat membuat pesanan baru dan melihat total yang harus dibayarkan. Disini juga dapat diimplementasikan pembayaran menggunakan payment gateway. Pada fitur ini student akan diminta untuk membuat :

* **Creating New Order**  
  * User dapat melanjutkan pembuatan pesanan baru berdasarkan produk dan alamat yang dipilih saat checkout  
  * Pesanan akan dikirimkan pada gudang terdekat dari alamat tujuan pengiriman pesanan  
  * Proses pencarian gudang terdekat berdasarkan titik koordinat antara alamat pengiriman dan gudang gudang yang ada  
  * Sebelum pesanan dibuat, wajib untuk mengecek ketersediaan stok terlebih dahulu. Stok yang dimaksud disini adalah stok dari keseluruhan gudang  
  * Pesanan yang baru dibuat, belum bisa diproses oleh admin sebelum dilakukan upload bukti pembayaran  
  * Pesanan yang baru dibuat, bisa diproses secara otomatis jika pembayaran dilakukan melalui payment gateway  
* **Upload Payment Proof**  
  * Untuk metode pembayaran secara transfer manual, user dapat mengupload bukti bayar untuk dapat melanjutkan proses  
  * Terdapat batasan waktu untuk melakukan upload bukti pembayaran yaitu sekitar 1 jam. Jika user belum upload bukti pembayaran, maka pesanan akan secara otomatis dibatalkan.   
  * Validasi terhadap foto yang diupload, ekstensi yang diperbolehkan hanya .jpg, .jpeg, dan .png dan juga maksimum ukurannya adalah 1MB.  
* **Order List**  
  * User dapat melihat daftar pesanan yang sedang berlangsung maupun yang sudah selesai (sesuai dengan status pesanan yang tersedia)  
  * User dapat mencari pesanan berdasarkan tanggal dan no order  
* **Cancel Order**  
  * User hanya dapat membatalkan pesanan sebelum user melakukan upload bukti bayar  
  * Proses cancel order dapat terjadi apabila user tidak melakukan pembayaran sesuai tenggat waktu yang diberikan secara otomatis  
* **Order Confirmation**   
  * User dapat mengkonfirmasi penerimaan pesanan  
  * Pesanan akan otomatis di konfirmasi ketika user tidak mengubah statusnya selama 2 x 24 jam setelah barang dikirimkan

### **Order Management (35 Point)**

Admin dapat melihat dan mengatur pesanan yang telah dibuat oleh user.

* **Show all Order**  
  * Admin dapat melihat semua pesanan user untuk semua gudang, dan dapat memfilter pesanan berdasarkan gudang yang dipilih  
  * Store admin hanya dapat melihat pesanan pada gudang masing masing  
* **Confirm Payment (Manual Transfer)**  
  * Admin dapat mengkonfirmasi bukti pembayaran user  
  * Apabila ditolak, maka status pesanan akan kembali ke Menunggu Pembayaran  
  * Apabila diterima, maka status pesanan akan berubah menjadi Diproses  
  * Ada konfirmasi ke user sebelum proses dilanjutkan  
* **Send User Orders**  
  * Admin dapat mengubah status pesanan menjadi Dikirim  
  * Admin bertanggung jawab untuk memastikan kesiapan barang  
  * Untuk kasus stok kurang dan harus melakukan mutasi stok, walaupun dilihat dari data pada aplikasi stoknya sudah berpindah, admin harus tetap menunggu sampai barang benar benar tiba di gudang sebelum mengirimkan barang  
  * Pesanan dengan status Dikirim nantinya akan menunggu approval dari user, baru kemudian pesanan dianggap selesai  
  * Apabila user tidak mengubah status pesanan dalam kurun waktu 7 hari setelah pengiriman, maka status akan berubah secara otomatis menjadi Pesanan Dikonfirmasi  
* **Cancel User Orders**  
  * Admin hanya dapat membatalkan pesanan, sampai status pesanannya sebelum Dikirim  
  * Ketika pesanan dibatalkan, maka stok akan kembali dan harus ada jurnal untuk mencatat history perubahan stok

### **Mentor Evaluation (10 Point)**

Mentor akan menilai secara keseluruhan mulai dari proses development hingga hasil akhirnya. Detail penilaian akan dijelaskan dibawah.

# **Mentor Evaluation**

Mentor memiliki hak untuk memberikan penilaian secara subjective terhadap hasil kerja student pada final project development. Bobot nilai dari mentor adalah 10 poin. Penilaiannya akan mencakup :

* Kerapian tampilan UI  
* Komunikasi dengan anggota team  
* Inisiatif  
* Pengembangan fitur

# **References**

Student dapat menggunakan tools di bawah ini untuk membantu menentukan lokasi dan menentukan harga pengiriman.

* Dapat menggunakan [API RajaOngkir](https://rajaongkir.com/dokumentasi/starter) atau free API lainnya untuk menentukan provinsi, kota dan kecamatan  
* Dapat menggunakan [OpenCage](https://opencagedata.com/tutorials/geocode-in-nodejs) atau free API lainnya untuk mendapatkan posisi geolocation berdasarkan provinsi dan kota

# **Standardization**

**Harap perhatikan poin poin dibawah ini, dan wajib untuk di implementasi. Akan ada pengecekan dan penilaian oleh juri untuk poin poin disini.**

## **Validation**

* Semua input dari user harus divalidasi (client dan server)  
* Untuk input yang berupa file (bisa juga gambar), harus divalidasi extensionnya dan juga ukuran file yang bisa diterima  
* Semua proses yang krusial, harus ada approval dari user terlebih dahulu sebelum di proses (misalkan hapus data tertentu)

## **Pagination, Filtering and Sorting**

* Semua tampilan dalam bentuk list (misalnya product list, order list atau user list) harus menggunakan pagination, filter dan sort. Semuanya diproses di server (tidak diperbolehkan untuk diproses di client)

## **Frontend**

* Wajib responsive minimal ukuran mobile dan web  
* Design yang digunakan dapat dimengerti oleh penguji maupun user umum yang akan menggunakan web app tersebut  
* Tampilan dibuat semenarik mungkin, bukan sesederhana nya  
* Penamaan file harus jelas, merepresentasikan kegunaannya  
* Perhatikan penggunaan ekstensi file (jsx di gunakan ketika ada unsur html di dalam js)  
* Title dan favicon disesuaikan dengan project yang dikerjakan

## **Backend**

* Penggunaan method rest api yang sesuai dengan kaidah nya merujuk [ke sini](https://restfulapi.net/resource-naming/)  
* Terapkan authorization pada api yang hanya bisa diakses oleh user tertentu

## **Clean Code**

* Dalam setiap file, maksimal baris code adalah 200 baris. Jika lebih harus di-refactor terlebih dahulu  
* Penggunaan log yang tidak terpakai harus dibersihkan sebelum masuk ke production  
* Penggunaan code yang tidak terpakai harus dibersihkan  
* Penulisan function maksimal 15 baris, jika lebih harus di re-factor

