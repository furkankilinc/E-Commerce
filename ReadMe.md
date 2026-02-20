E-Ticaret Yönetim ve Satış Platformu
Bu proje, kurumun e-ticaret operasyonlarını dijital ortama taşımak ve manuel süreçlerdeki verimsizliği bitirmek için geliştirilmiş uçtan uca bir platformdur. Node.js 20 tabanlı bir backend, React 19 tabanlı Storefront ve Admin paneli ile PostgreSQL veritabanı üzerine inşa edilmiştir. Proje monorepo mimarisiyle yönetilmektedir.

Teknik Mimari ve Özellikler
Backend Servisleri: Node.js 20 ve Express 4 kullanılarak monolitik servis yapısında geliştirilmiştir. Prisma 5 ORM üzerinden PostgreSQL 16 ile veri yönetimi sağlanır.

Arayüzler: Hem müşteri tarafı hem de yönetim paneli React 19 ve Vite kullanılarak SPA (Single Page Application) olarak tasarlanmıştır.

Gerçek Zamanlı İletişim: Socket.IO 4 üzerinden anlık stok güncellemeleri ve sipariş bildirimleri yönetilir.

Arka Plan İşleri: E-posta gönderimi, rapor üretimi ve toplu güncellemeler Redis tabanlı Bull queue ile asenkron yürütülür.

Dosya Depolama: Görsel ve döküman yönetimi için S3 uyumlu MinIO kullanılmaktadır.

Güvenlik: Kimlik doğrulama JWT (RS256) ile sağlanır. Şifreler bcrypt ile hashlenir ve hassas veriler Redis üzerinde saklanan blacklist mekanizmasıyla korunur.

Bağımlılıkları Yükle:
npm install

Altyapıyı Başlat:
Docker Compose üzerinden veritabanı ve cache servislerini ayağa kaldır:
docker-compose up -d

Veritabanı Yapılandırması:
apps/backend dizininde migrationları çalıştır:
npx prisma migrate dev

Geliştirme Modunda Başlat:
Kök dizinden tüm uygulamaları aynı anda çalıştır:
npm run dev

Temel Fonksiyonlar
RBAC: Admin, Editör ve Müşteri rolleriyle yetkilendirme kontrolü yapılır.

Checkout: Çok adımlı ödeme akışı ve sunucu taraflı ödeme simülasyon motoru mevcuttur.

Stok Yönetimi: Eşik değer kontrolü ve düşük stok durumlarında otomatik WebSocket/E-posta bildirimleri gönderilir.

Raporlama: Satış ve stok verileri Excel (XLSX) ve PDF formatında dışa aktarılabilir.
