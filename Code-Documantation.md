## 1. Amaç ve Kapsam

Bu doküman, **E-Ticaret Yönetim ve Satış Platformu**’nun yazılım ekibi tarafından geliştirilebilmesi için gerekli **teknik tasarım detaylarını** ortaya koyar.  
İş gereksinimleri ve kullanıcı hikâyeleri, fonksiyonel gereksinim dokümanında tanımlanmıştır; bu metin ise o gereksinimleri karşılayacak **mimari, modüler yapı, teknoloji kullanımı, veri modeli, entegrasyonlar, test ve DevOps yaklaşımlarını** tarif eder.

---

## 2. Genel Mimari

### 2.1 Yüksek Seviye Bileşenler

- **Storefront (Müşteri SPA)**
  - Teknoloji: `React 19 + Vite`
  - Rendering: Ağırlıklı CSR, kritik sayfalarda SSR’ye uyumlu (ileride Next.js geçişine uygun component yapısı).
  - Kapsam: Ürün keşfi, sepet, checkout, profil, sipariş takibi.

- **Admin Panel (Yönetim SPA)**
  - Teknoloji: `React 19 + Vite`
  - RBAC tabanlı protected routes (Admin / Editör / Görüntüleyici).
  - Kapsam: Ürün, stok, sipariş, kampanya, raporlama yönetimi.

- **Backend API (Monolitik Servis)**
  - Teknoloji: `Node.js 20 + Express 4 + Prisma 5`
  - Katmanlar:
    - API Layer (`Controller/Route`)
    - Service (Business Logic)
    - Repository (Prisma üzerinden DB erişimi)
    - Integration (MinIO, SMTP, Redis, Queue, OAuth, Payment simulation)
  - İletişim: JSON tabanlı REST API, JWT tabanlı kimlik doğrulama.

- **Veritabanı**
  - `PostgreSQL 16`
  - ACID, transaction bazlı sipariş/stok akışları, full‑text search desteği.

- **Cache ve Queue**
  - `Redis 7`
  - Kullanımlar:
    - Cache (ürün listeleri, dashboard metrikleri)
    - Session / Token store (Refresh Token / blacklisting)
    - Bull queue backend’i.

- **Medya Depolama**
  - `MinIO` (S3 uyumlu)
  - Presigned URL ile güvenli upload, çoklu boyut (thumbnail / medium / large).

- **Gerçek Zamanlı İletişim**
  - `Socket.IO 4`
  - Anlık bildirimler, stok güncellemeleri, sipariş durum takibi.

- **CI/CD & Container**
  - `Docker + Docker Compose`
  - `GitHub Actions` ile test, build, deploy pipeline.

---

## 3. Backend Uygulama Mimarisi

### 3.1 Katmanlı Yapı

- **Route / Controller Katmanı**
  - Express router seviyesinde:
    - `/auth`, `/products`, `/orders`, `/stock`, `/notifications`, `/reports`, `/campaigns`, `/profile`, `/admin` vb.
  - **Sorumluluklar:**
    - Request validation (ör. `zod` ile schema tabanlı validasyon)
    - Auth middleware çağrıları
    - Service katmanını orkestre etmek
    - HTTP status & response mapping

- **Service (Business) Katmanı**
  - Modül bazlı servisler:
    - `AuthService`, `ProductService`, `OrderService`, `StockService`, `NotificationService`, `ReportService`, `CampaignService`, `ProfileService`, `UserService`
  - **Sorumluluklar:**
    - İş kuralları (user story ve kabul kriterleri)
    - Transaction orkestrasyonu (Prisma transaction)
    - Domain odaklı hatalar (ör. `InsufficientStockError`)

- **Repository Katmanı**
  - Her ana domain için repository:
    - `UserRepository`, `ProductRepository`, `OrderRepository`, `StockMovementRepository`, `CouponRepository`, `NotificationRepository` vb.
  - **Sorumluluklar:**
    - Sadece DB erişimi (Prisma client)
    - Kompleks sorgular (join, aggregate, full‑text search)
    - Yüksek tekrar eden sorgularda cache ile entegre kullanım

- **Integration Katmanı**
  - Dış/yan servisler:
    - `EmailProvider` (Nodemailer + Gmail SMTP)
    - `FileStorageProvider` (MinIO client)
    - `QueueProvider` (Bull)
    - `OAuthProvider` (Google/Facebook)

### 3.2 API Standartları

- **URL Yapısı**
  - Versiyonlama: `/api/v1/...`
  - Örnekler:
    - `/api/v1/auth/login`
    - `/api/v1/products`
    - `/api/v1/orders/:id`
    - `/api/v1/admin/reports/sales`

- **Hata Yönetimi**
  - Global error handler middleware
  - Standart hata kodları:
    - `VALIDATION_ERROR`, `AUTH_FAILED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`

---

## 4. Güvenlik ve Yetkilendirme Tasarımı

### 4.1 Kimlik Doğrulama

- **JWT (RS256)**
  - Access Token: 15 dk
  - Refresh Token: 7–30 gün, HTTP‑only cookie, Redis’te saklanan token id / blacklist.

- **Şifre Yönetimi**
  - `bcrypt` cost 12  
  - Plaintext şifre loglanmaz, veritabanında sadece hash + salt saklanır.

- **OAuth 2.0**
  - Google, Facebook provider modülleri
  - Callback endpoint’leri: `/api/v1/auth/oauth/google/callback` vb.
  - Hesap birleştirme: e‑posta eşleştirme + kullanıcı onayı.

### 4.2 Yetkilendirme (RBAC)

- Roller: Misafir, Müşteri, Editör, Admin
- Teknik yaklaşım:
  - JWT payload içinde `role` alanı
  - Route‑level middleware:
    - `requireAuth()`
    - `requireRole(['ADMIN', 'EDITOR'])`
- Hassas işlemler:
  - Rol atama, sistem ayarları vb. sadece Admin tarafından yapılabilir.

### 4.3 Diğer Güvenlik Önlemleri

- CSRF koruması (özellikle cookie tabanlı Refresh Token için)
- Login / reset password endpoint’lerinde agresif rate limiting
- Storefront / admin domainleri için CORS whitelist yapılandırması
- `helmet` ile HTTP header sertleştirme (HSTS, XSS protection vb.)

---

## 5. Veri Modeli (Yüksek Seviye)

> Detaylı şema Prisma modeli üzerinden oluşturulacak, burada mantıksal seviye özetlenmiştir.

### 5.1 Kullanıcı ve Rol

- `User`: `id`, `name`, `email`, `passwordHash`, `role`, `status`
- `UserProfile`: `phone`, `avatarUrl`,
- `Address`: `userId` , `title`, `line1`, `city`, `country`, `isDefault`
- `OAuthAccount`: `provider`, `providerUserId`, `userId` 

### 5.2 Ürün ve Katalog

- `Category`: `parentId`, `name`, `slug`
- `Brand`
- `Product`: `categoryId`, `brandId`, `name`, `slug`, `basePrice`, `taxRate`, `status`
- `ProductVariant`: `productId`, `sku`, `attributes(JSON)`, `stockQty`, `priceOverride`
- `ProductImage`: `productId/variantId`, `url`, `sortOrder`
- `ProductReview`: `userId`, `productId`, `rating`, `comment`, `status`

### 5.3 Stok

- `StockMovement`: `variantId`, `type (sale/return/manual/import)`, `qtyChange`, `reason`, `userId`, `previousQty`, `newQty`, `createdAt`
- `StockThreshold`: `variantId`, `thresholdQty`

### 5.4 Sipariş

- `Cart` / `CartItem`: `userId` (nullable), `variantId`, `qty`
- `Order`: `userId`, `totalAmount`, `status`, `paymentStatus`, `shippingAddressId`, `couponId`
- `OrderItem`: `orderId`, `variantId`, `qty`, `unitPrice`, `taxRate`
- `Shipment`: `orderId`, `carrierName`, `trackingNumber`, `status`

### 5.5 Kampanya ve Kupon

- `Coupon`: `code`, `type`, `value`, `minOrderAmount`, `startAt`, `endAt`, `maxUsage`, `maxUsagePerUser`, `constraints(JSON)`
- `CouponUsage`: `couponId`, `userId`, `orderId`

### 5.6 Bildirim ve E‑posta

- `Notification`: `userId`, `type`, `payload(JSON)`, `readAt`
- `EmailLog`: `to`, `subject`, `templateName`, `status`, `retries`, `errorMessage`

### 5.7 Raporlama

- Çoğunlukla aggregate sorgular üzerinden
- Büyük rapor çıktıları için `ReportJob` tablosu: `status`, `fileUrl`, `requestedBy`, `type`

---

## 6. Frontend Mimarisi

### 6.1 Ortak Prensipler

- **UI Kütüphanesi**: Kurumsal tasarımla uyumlu component kütüphanesi (örn. MUI/AntD veya custom design system).
- **State Yönetimi**
  - Global: `Redux Toolkit` (auth, cart, user, config, notifications)
  - Yerel: React `useState`, `useReducer`
- **API Katmanı**
  - `axios` tabanlı ortak `apiClient`
  - Interceptor’lar:
    - Auth header ekleme (Access Token)
    - `401` durumunda Refresh Token akışı
- **Routing**
  - `react-router` ile modül bazlı route’lar
  - Protected route bileşenleri (`RequireAuth`, `RequireRole`)

### 6.2 Storefront Yapısı (Örnek)

- **Klasörler**
  - `pages/`: `Home`, `ProductList`, `ProductDetail`, `Cart`, `Checkout`, `Orders`, `Profile`
  - `features/`: `auth`, `cart`, `product`, `order`, `profile`, `search`
- **UX Noktaları**
  - Debounced search, URL bazlı filtre & sort
  - Responsive grid, mobil‑first tasarım
  - Form validations, inline error gösterimi

### 6.3 Admin Panel Yapısı (Örnek)

- **Klasörler**
  - `pages/`: `Dashboard`, `Products`, `ProductForm`, `Stock`, `Orders`, `Customers`, `Coupons`, `Reports`, `Settings`
  - `features/`: `notifications`, `stock`, `campaign`, `report`, `userManagement`
- **RBAC**
  - Menü item’ları role göre filtrelenir
  - Button/action seviyesinde yetki kontrolü yapılır

---

## 7. Gerçek Zamanlı Özellikler

- **Socket.IO Sunucusu**
  - API sürecine entegre; `io` instance’ı service katmanlarından event publish edebilir.
  - Redis Pub/Sub adapter ile ölçeklenebilirlik.

- **Kullanım Senaryoları**
  - Yeni sipariş: `admin:new-order`
  - Düşük stok: `admin:low-stock`
  - Yeni iade talebi: `admin:new-refund-request`
  - Müşteri sipariş durumu: `customer:order-status-updated:{userId}`

- **Reconnect & Missed Events**
  - Anlık event’lerin yanında, son X event’in DB’den okunabildiği `/notifications` endpoint’i ile “kaçan bildirimler” tamamlanır.

---

## 8. Arka Plan İşlemleri (Queue Tasarımı)

- Queue: **Bull** (Redis tabanlı)
- **Kuyruklar:**
  - `email-queue`: transactional e‑postalar, retry + backoff
  - `report-queue`: büyük XLSX/PDF üretimi
  - `bulk-update-queue`: toplu ürün güncelleme
  - `scheduled-jobs`: kupon süresi, rapor cache yenileme vb.
- Her job tipi için:
  - Maks retry sayısı ve backoff stratejisi
  - Job sonuçlarının loglanması (başarılı / başarısız)

---

## 9. DevOps, Ortamlar ve Sürümleme

### 9.1 Ortamlar

- **local**: Docker Compose ile tüm servisler
- **staging**: Gerçekçi veriyle son kullanıcıdan izole ortam
- **production**: Yatay ölçeklenebilir API + ayrı DB / Redis / MinIO nodları

### 9.2 CI/CD Pipeline (GitHub Actions)

- **Adımlar**
  - `build` (frontend bundle + backend image)
  - `docker image push` (registry)
  - `deploy` (staging / prod environment’e otomatik ya da manuel onaylı)

### 9.3 Loglama ve Gözlemlenebilirlik

- Merkezi loglama (örn. JSON log + ELK veya benzeri stack)
- Önemli event’ler için audit log (özellikle):
  - Rol değişimi
  - Fiyat / stok kritik güncellemeler
  - Login denemeleri, şifre sıfırlama

---

## 10. Geliştirme Süreci ve Kod Standartları

- **Branch Stratejisi**: Git Flow (`main`, `develop`, `feature/*`, `hotfix/*`)

- **Kod Kalitesi**
  - **Backend**: `ESLint + Prettier`
  - **Frontend**: `ESLint + Prettier`

- **Dokümantasyon**
  - API: OpenAPI/Swagger dokümantasyonu (otomatik / yarı otomatik üretim)
  - README: kurulum, env değişkenleri, Docker kullanımı

---

## 11. Kullanılan Ana Paketler ve Amaçları

### 11.1 Backend

- **express**: HTTP sunucusu, REST endpoint yönetimi.
- **jsonwebtoken**: JWT üretimi ve doğrulaması (Access / Refresh token).
- **bcrypt**: Kullanıcı şifrelerini güvenli şekilde hashlemek için.
- **prisma**: Type‑safe ORM; PostgreSQL ile veri erişimi, migration ve schema yönetimi.
- **pg**: PostgreSQL sürücüsü (Prisma alt katmanda da kullanır).
- **redis**: Cache, session/token store, Bull queue için altyapı.
- **ioredis** veya **redis client**: Node.js içinden Redis’e bağlanmak için.
- **bull**: Kuyruk yapısı; e‑posta, rapor üretimi, toplu güncelleme gibi arka plan işler.
- **socket.io**: Gerçek zamanlı bildirimler ve canlı güncellemeler için WebSocket abstraction.
- **nodemailer**: SMTP üzerinden transactional e‑posta göndermek için.
- **handlebars**: E‑posta şablonlarını HTML olarak üretmek için template engine.
- **minio**: MinIO (S3 uyumlu) object storage ile dosya yükleme/indirme işlemleri.
- **multer** (veya benzeri): HTTP üzerinden dosya upload desteği (varsa).
- **joi / zod / yup**: Request body/param validation için (schema bazlı validasyon).
- **helmet**: HTTP security header’larını ayarlamak için.
- **cors**: CORS politika yönetimi.
- **morgan** veya **pino**: HTTP loglama ve uygulama logları için.

### 11.2 Frontend (Storefront & Admin)

- **react / react-dom**: SPA katmanı.
- **vite**: Hızlı development server ve build tool.
- **react-router-dom**: Sayfa yönlendirme, protected route yapısı.
- **axios**: Backend API çağrıları için HTTP client.
- **@reduxjs/toolkit + react-redux**: Global state yönetimi.
- **zustand** (opsiyonel): Daha hafif local/global state senaryoları için.
- **socket.io-client**: Frontend’den Socket.IO sunucusuna bağlanmak için.
- **recharts**: Admin dashboard’ta grafik ve chart bileşenleri.
- **@mui/material** veya **antd** (örnek): Formlar, tablolar, modal’lar için UI componentleri.
- **react-hook-form**: Form yönetimi ve validasyon.

---

## 12. API Endpoint Tasarımı (Basic)

> Not: Aşağıdaki path’ler örnek **basic** halidir. Detaylı DTO ve response şemaları Swagger/OpenAPI ile ayrıca dokümante edilecektir.  
> Tüm endpointler `api/v1` prefix’i ile versiyonlanır: `/api/v1/...`

### 12.1 Auth ve Kullanıcı

| HTTP | Path                                   | Açıklama                                      |
|------|----------------------------------------|-----------------------------------------------|
| POST | `/api/v1/auth/register`                | Standart kayıt (US-AUTH-001)                  |
| POST | `/api/v1/auth/login`                   | E‑posta/şifre ile giriş (US-AUTH-002)         |
| POST | `/api/v1/auth/logout`                  | Güvenli çıkış (Refresh token revoke)          |
| POST | `/api/v1/auth/refresh`                 | Access token yenileme                          |
| POST | `/api/v1/auth/forgot`                  | Şifre sıfırlama isteği (US-AUTH-004)          |
| POST | `/api/v1/auth/reset`                   | Token ile yeni şifre belirleme                |
| GET  | `/api/v1/auth/me`                      | Oturum açmış kullanıcının profil bilgisi      |
| GET  | `/api/v1/auth/oauth/:prov`             | OAuth yönlendirme (Google/Facebook)           |
| GET  | `/api/v1/auth/oauth/:prov/callback`    | OAuth callback                                |

**Admin kullanıcı yönetimi**

| HTTP | Path                                   | Açıklama                                      |
|------|----------------------------------------|-----------------------------------------------|
| GET  | `/api/v1/admin/users`                  | Kullanıcı listesi (Admin)                     |
| PATCH| `/api/v1/admin/users/:id/role`         | Rol atama/değiştirme (US-AUTH-005)            |

### 12.2 Ürün ve Katalog

| HTTP | Path                                   | Açıklama                                              |
|------|----------------------------------------|-------------------------------------------------------|
| GET  | `/api/v1/products`                     | Ürün listeleme + filtre/sort (US-PROD-001)           |
| GET  | `/api/v1/products/search`              | Arama endpoint’i (query param ile) (US-PROD-002)     |
| GET  | `/api/v1/products/:slug`               | Ürün detay (US-PROD-003)                             |
| GET  | `/api/v1/products/:slug/reviews`       | Yorum listesi                                        |
| POST | `/api/v1/admin/products`               | Ürün oluşturma (US-PROD-004)                         |
| PUT  | `/api/v1/admin/products/:id`           | Ürün güncelleme                                      |
| DELETE | `/api/v1/admin/products/:id`         | Ürün silme                                           |
| POST | `/api/v1/admin/products/bulk-import`   | Toplu ürün güncelleme (CSV/XLSX) (US-PROD-005)       |

### 12.3 Sepet ve Sipariş

| HTTP | Path                                   | Açıklama                                             |
|------|----------------------------------------|------------------------------------------------------|
| GET  | `/api/v1/cart`                         | Aktif sepet görüntüleme (user veya guest)           |
| POST | `/api/v1/cart/items`                   | Sepete ürün ekleme (US-ORDER-001)                   |
| PATCH| `/api/v1/cart/items/:id`               | Sepet ürün miktarı güncelleme                       |
| DELETE | `/api/v1/cart/items/:id`             | Sepetten ürün çıkarma                               |
| POST | `/api/v1/orders/checkout`              | Checkout başlatma (adres/kargo/ödeme) (US-ORDER-002)|
| GET  | `/api/v1/orders`                       | Kullanıcı sipariş listesi (US-ORDER-004)            |
| GET  | `/api/v1/orders/:id`                   | Sipariş detay                                       |

**Admin sipariş yönetimi**

| HTTP | Path                                   | Açıklama                                             |
|------|----------------------------------------|------------------------------------------------------|
| GET  | `/api/v1/admin/orders`                 | Sipariş listesi (filtreli) (US-ORDER-003)           |
| PATCH| `/api/v1/admin/orders/:id/status`      | Sipariş durum güncelleme (state machine)            |
| GET  | `/api/v1/admin/orders/export`          | Sipariş CSV/XLSX export (US-REPORT-002)             |

### 12.4 Stok Yönetimi

| HTTP | Path                                             | Açıklama                                   |
|------|--------------------------------------------------|--------------------------------------------|
| GET  | `/api/v1/admin/stock`                            | Varyant bazlı stok listesi (US-STOCK-001) |
| POST | `/api/v1/admin/stock/:variantId/manual`          | Manuel stok güncelleme (US-STOCK-003)     |
| GET  | `/api/v1/admin/stock/low`                        | Düşük stoklu ürün listesi (US-STOCK-002)  |

### 12.5 Bildirim ve E‑posta

| HTTP | Path                                             | Açıklama                                               |
|------|--------------------------------------------------|--------------------------------------------------------|
| GET  | `/api/v1/notifications`                          | Kullanıcıya ait bildirim listesi (US-NOTIF-001)       |
| PATCH| `/api/v1/notifications/:id`                      | Bildirimi okundu işaretleme                           |
| POST | `/api/v1/products/:id/notify-when-in-stock`      | Stok gelince haber ver (US-NOTIF-003)                 |

### 12.6 Raporlama

| HTTP | Path                                   | Açıklama                                             |
|------|----------------------------------------|------------------------------------------------------|
| GET  | `/api/v1/admin/dashboard/summary`      | Dashboard KPI ve grafik verileri (US-REPORT-001)    |
| GET  | `/api/v1/admin/reports/xlsx`           | XLSX rapor üretimi (tip param ile) (US-REPORT-002)  |
| GET  | `/api/v1/admin/reports/pdf`            | PDF rapor üretimi (US-REPORT-003)                   |

### 12.7 Kampanya ve Kupon

| HTTP | Path                                   | Açıklama                                     |
|------|----------------------------------------|----------------------------------------------|
| POST | `/api/v1/admin/coupons`               | Kupon oluşturma (US-CAMP-001)               |
| GET  | `/api/v1/admin/coupons`               | Kupon listesi                               |
| POST | `/api/v1/orders/apply-coupon`         | Kupon uygulama (checkout sırasında)         |

### 12.8 Kullanıcı Profili

| HTTP | Path                                   | Açıklama                                     |
|------|----------------------------------------|----------------------------------------------|
| GET  | `/api/v1/profile`                      | Profil bilgileri                             |
| PATCH| `/api/v1/profile`                      | Profil güncelleme (US-PROFILE-001)          |
| GET  | `/api/v1/profile/addresses`            | Adres listesi                                |
| POST | `/api/v1/profile/addresses`            | Adres ekleme                                 |
| PATCH| `/api/v1/profile/addresses/:id`        | Adres güncelleme                             |
| DELETE | `/api/v1/profile/addresses/:id`      | Adres silme                                  |

