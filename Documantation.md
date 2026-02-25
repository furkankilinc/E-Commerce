# KAPSAM VE DEĞER ÖNERİSİ
### E-Ticaret Platformu — Teknik Proje Dokümantasyonu

## 1. YÖNETİCİ ÖZETİ

Bu belge, kurumun e-ticaret operasyonlarını dijital ortama taşımak ve mevcut süreçlerdeki verimsizlikleri ortadan kaldırmak amacıyla geliştirilen **E-Ticaret Yönetim ve Satış Platformu**'nun kapsam sınırlarını, sunduğu değer önerilerini ve proje çerçevesini tanımlamaktadır.

Söz konusu platform; **Node.js (v20 LTS)** tabanlı bir RESTful backend API katmanı, **React.js (v19)** tabanlı mobil uyumlu bir Single Page Application (SPA) ve **PostgreSQL** ilişkisel veritabanı üzerine inşa edilmektedir. Sistem, **monorepo** mimarisi altında organize edilecek olup CI/CD pipeline entegrasyonu ile sürekli teslimat desteklenecektir. Platform iki ana bileşenden oluşmaktadır:

- **Müşteri Arayüzü (Storefront):** Son kullanıcıların ürünleri keşfettiği, sepete eklediği ve satın alma işlemini tamamladığı; SSR (Server-Side Rendering) veya CSR (Client-Side Rendering) stratejisiyle sunulan, tam responsive web uygulaması. SEO uyumluluğu için meta tag yönetimi ve Open Graph desteği dahildir.
- **Yönetim Paneli (Admin Dashboard):** Yetkili personelin stok, sipariş, müşteri ve raporlama süreçlerini merkezi olarak yönettiği; RBAC (Role-Based Access Control) ile yetkilendirilen kurumsal panel.

---

## 2. NE YAPILACAK?

### 2.1 Geliştirilen Sistem

| Katman | Teknoloji | Versiyon | Açıklama |
|---|---|---|---|
| Backend API | Node.js + Express.js | v20 LTS / v4.x | RESTful API mimarisi, middleware zinciri, route-level validation |
| Kimlik Doğrulama | JWT + bcrypt | RFC 7519 | Access token + Refresh token stratejisi, token rotation |
| Frontend (Storefront) | React.js + Vite | v19 / v5 | CSR tabanlı SPA, lazy loading, code splitting |
| Frontend (Admin) | React.js + Vite | v19 / v5 | RBAC entegreli yönetim paneli, Protected Routes |
| State Yönetimi | Redux Toolkit / Zustand | — | Global state, async thunk, slice mimarisi |
| Veritabanı | PostgreSQL | v16 | ACID uyumlu ilişkisel veri yönetimi, indexing stratejisi |
| Önbellekleme | Redis | v7 | Session yönetimi, sık sorgulanan veriler için cache layer |
| ORM | Prisma | v5 | Type-safe DB erişimi, migration yönetimi, seed desteği |
| Ödeme Altyapısı | Simülasyon Motoru | — | Gerçek ödeme entegrasyonu yok; test/demo amaçlı kart akışı simülasyonu |
| Depolama | MinIO (self-hosted) | — | S3-uyumlu nesne depolama, presigned URL ile güvenli medya yükleme |
| E-posta | Nodemailer + Gmail SMTP | — | Transactional e-posta, şablon motoru (Handlebars), ücretsiz SMTP |
| Gerçek Zamanlı | Socket.IO | v4 | WebSocket tabanlı anlık bildirim ve stok güncellemesi |
| Konteynerizasyon | Docker + Docker Compose | — | Ortam bağımsız çalışma, servis izolasyonu |

### 2.2 Temel Fonksiyonel Alanlar

**Müşteri Tarafı (Storefront)**

Kullanıcılar sisteme e-posta/şifre kombinasyonu ya da OAuth 2.0 tabanlı sosyal medya hesaplarıyla kayıt olabilecek ve giriş yapabilecektir. Kimlik doğrulama JWT Access Token (15 dk. TTL) ve HTTP-only cookie'de saklanan Refresh Token (7 gün TTL) çiftiyle sağlanacaktır. Ürün listeleme sayfasında kategori, fiyat aralığı, marka ve stok durumuna göre dinamik filtreleme ve çok kriterli sıralama sunulacak; sorgular PostgreSQL full-text search ve Redis cache ile optimize edilecektir. Ürün detay sayfasında yüksek çözünürlüklü görsel galerisi, SKU bazlı varyant seçimi (renk, beden, adet), anlık stok bilgisi yer alacaktır.  Ödeme akışı; adres girişi, kargo seçimi ve simüle edilmiş ödeme yöntemi seçiminden oluşan üç adımlı (multi-step form) bir süreçle tamamlanacaktır. Ödeme adımı gerçek bir ödeme altyapısına bağlı olmayıp kart bilgilerinin doğrulanmasını taklit eden bir simülasyon motoru üzerinden çalışacaktır; bu yapı projenin demo ve test senaryolarına tam uyumluluk sağlamaktadır. Sipariş geçmişi ve WebSocket tabanlı canlı sipariş takibi sayfası aracılığıyla kullanıcılar aktif ve geçmiş siparişlerini anlık olarak takip edebilecektir.

**Yönetim Paneli (Admin Dashboard)**

RBAC mimarisiyle yetkilendirilen panel üç kullanıcı rolünü (Admin, Editör, Görüntüleyici) destekleyecektir. Ürün CRUD işlemleri, CSV import ile toplu güncelleme ve Drag & Drop görsel sıralama desteğiyle gerçekleştirilebilecektir. Stok miktarları event-driven mimariyle gerçek zamanlı olarak izlenecek; yapılandırılabilir eşik değerinin altına düşen ürünler için WebSocket bildirimi ve e-posta uyarısı otomatik tetiklenecektir. Müşteri 360 görünümü; kayıt bilgileri, geçmiş siparişler ve segment etiketlerini tek ekranda sunacaktır. Satış raporları Recharts kütüphanesiyle görselleştirilen interaktif grafikler ve Excel/PDF formatında indirilebilir çıktılar olarak sunulacaktır. Kupon ve kampanya motoru; yüzde/sabit indirim, minimum sepet tutarı, kategori kısıtlaması, kullanım limiti ve tarih aralığı parametrelerini destekleyecektir.

---

## 3. HANGİ SORUNU ÇÖZÜYOR?

### 3.1 Mevcut Sorunlar ve Çözüm Önerileri

Aşağıdaki tablo, projenin doğrudan hedeflediği operasyonel sorunları ve bu sorunlara getirilen teknik çözümleri özetlemektedir:

| # | Mevcut Sorun | Oluşturduğu Zarar | Çözüm |
|---|---|---|---|
| 1 | Stok takibinin Excel dosyaları üzerinden manuel yapılması | Stok hataları, müşteri mağduriyeti, iade maliyetleri | Gerçek zamanlı stok yönetim modülü ile anlık güncelleme ve otomatik düşme |
| 2 | Sipariş alımının WhatsApp / telefon gibi kanallardan yapılması | Sipariş kaybı, takip güçlüğü, personel iş yükü | Merkezi sipariş yönetimi, otomatik bildirim ve durum takibi |
| 3 | Ödeme tahsilatının nakit veya banka havalesiyle yapılması | Gecikmiş ödemeler, takip zorluğu, muhasebe hataları | Anlık online ödeme entegrasyonu ve otomatik muhasebe kaydı |
| 4 | Ürün güncellemelerinin web sitesine manuel kodlama ile yansıtılması | Zaman kaybı, insan hatası, bağımlılık | İçerik yönetim modülü ile kod gerektirmeden ürün güncelleme |
| 5 | Müşteri verilerinin farklı sistemlerde dağınık tutulması | Kişiselleştirme eksikliği, tekrarlayan veri girişi | Merkezi müşteri veri tabanı ve birleşik profil yönetimi |
| 6 | Satış performansına dair raporların haftalık manuel hazırlanması | Yavaş karar alma, gecikmeli müdahale | Anlık dashboard ve otomatik rapor üretimi |

---

## 5. MİMARİ GENEL BAKIŞ

Sistem, katmanlı (layered) bir mimari anlayışıyla kurgulanmaktadır. İstemci (React SPA), HTTPS üzerinden Node.js API Gateway'e bağlanır. API katmanı; kimlik doğrulama middleware'i, iş mantığı servisleri (business logic layer) ve Prisma ORM aracılığıyla PostgreSQL'e ulaşan veri erişim katmanından (DAL) oluşur. Yatay ölçeklenebilirlik için stateless API tasarımı benimsenmiş, oturum bilgisi Redis'te tutulmaktadır. Medya dosyaları self-hosted MinIO nesne depolama ünitesine presigned URL mekanizmasıyla yüklenmektedir. Gerçek zamanlı özellikler Socket.IO ile WebSocket bağlantısı üzerinden iletilmekte, bağlantı yükü Redis Pub/Sub ile dağıtılmaktadır. Ödeme akışı gerçek bir ödeme sağlayıcısına bağlı olmayıp sunucu taraflı simülasyon motoru üzerinden işlenmektedir.

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│         React SPA (Storefront + Admin Panel)        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────┐
│                    API GATEWAY                      │
│   Node.js + Express.js │ JWT Auth │ Rate Limiting   │
│   REST Endpoints       │ Socket.IO WebSocket Server │
└───────┬───────────────┬──────────────────┬──────────┘
        │               │                  │
┌───────▼──────┐ ┌──────▼──────┐  ┌───────▼───────┐
│  PostgreSQL  │ │    Redis    │  │     MinIO     │
│  (Primary DB)│ │ Cache/PubSub│  │ (Media Store) │
└──────────────┘ └─────────────┘  └───────────────┘
```

---

## 6. PROJE SINIR VE VARSAYIMLARI

### 6.1 Teknik Varsayımlar

Projenin planlandığı şekilde ilerleyebilmesi için aşağıdaki koşulların müşteri tarafınca sağlanacağı varsayılmaktadır:

- Alan adı (domain) ve SSL/TLS sertifikasının (Let's Encrypt veya ticari CA) müşteri adına mevcut olduğu veya temin edileceği,
- MinIO için yeterli disk alanının sunucu üzerinde ayrılacağı (minimum önerilen: **50 GB**),
- Node.js v20 LTS ve PostgreSQL v16'nın hedef sunucu ortamında çalıştırılabileceği,
- Ürün görsellerinin (min. 800×800 px, JPEG/WEBP), kategori yapısının ve temel içeriklerin proje başlangıcından itibaren temin edileceği.

### 6.2 Proje Yönetim Sınırları

- Kaynak kod teslimi Git repository (GitHub) üzerinden yapılacak olup commit history, branch stratejisi (Git Flow) ve README dokümantasyonu teslimata dahildir.

---

## 1. KULLANICI ROLLERİ VE YETKİLENDİRME MODELİ

### 1.1 Rol Tanımları

Sistem, **RBAC (Role-Based Access Control)** mimarisi üzerine kurgulanmış olup üç ana kullanıcı tipi ve iki yönetici rolünü desteklemektedir. Her rolün erişim sınırları aşağıda tanımlanmıştır.

| Rol | Tanım | Erişim Kapsamı |
|---|---|---|
| **Admin** | Sistemi tam yetkiyle yöneten kişi (CTO, Genel Müdür, Sistem Yöneticisi) | Tüm modüller — okuma, yazma, silme, yapılandırma |
| **Editör** | İçerik ve operasyon yönetiminden sorumlu personel (pazarlama, depo) | Ürün, stok, sipariş — okuma ve yazma; kullanıcı yönetimi — yok |
| **Müşteri** | Alışveriş yapan son kullanıcı | Yalnızca kendi profili, sepeti ve siparişleri |
| **Misafir** | Kayıt olmamış ziyaretçi | Ürün listeleme ve detay sayfaları — salt okunur |

### 1.2 Yetki Matrisi

| Eylem | Misafir | Müşteri | Editör | Admin |
|---|---|---|---|---|
| Ürün listeleme / görüntüleme | ✅ | ✅ | ✅ | ✅ |
| Sepete ekleme / satın alma | ❌ | ✅ | ❌ | ❌ |
| Ürün ekleme / düzenleme | ❌ | ❌ | ✅ | ✅ |
| Ürün silme | ❌ | ❌ | ❌ | ✅ |
| Sipariş durumu güncelleme | ❌ | ❌ | ✅ | ✅ |
| Müşteri verilerini görüntüleme | ❌ | ❌ | ✅ (kısıtlı) | ✅ |
| Kullanıcı rolü atama | ❌ | ❌ | ❌ | ✅ |
| Sistem yapılandırması | ❌ | ❌ | ❌ | ✅ |
| Raporlara erişim | ❌ | ❌ | ✅ (kısıtlı) | ✅ |
| Kupon / kampanya yönetimi | ❌ | ❌ | ✅ | ✅ |

---

## 2. KİMLİK DOĞRULAMA VE YETKİLENDİRME (Authentication & Authorization)

**Teknik Referans:** JWT (RS256 algoritması), bcrypt (cost factor 12), OAuth 2.0, Redis session store, HTTP-only cookie

---

### US-AUTH-001 — Standart Kayıt

**Kapsam:** Misafir → Müşteri | **Öncelik:** 🔴 Kritik

> *"Sisteme yeni gelen bir ziyaretçi olarak, e-posta adresim ve şifremi kullanarak hesap açmak istiyorum; böylece sipariş verebilir ve alışveriş geçmişime ulaşabilirim."*

**Kabul Kriterleri:**
- Kullanıcı ad, soyad, e-posta ve şifre bilgilerini girerek kayıt formunu gönderebilmelidir.
- Şifre en az 8 karakter uzunluğunda, en az bir büyük harf, bir rakam ve bir özel karakter içermelidir; bu kural form seviyesinde anlık olarak gösterilmelidir.
- Kayıt sonrası kullanıcıya doğrulama e-postası gönderilmeli; e-posta doğrulanmadan satın alma işlemi başlatılamamalıdır.
- Aynı e-posta adresiyle tekrar kayıt girişiminde açıklayıcı bir hata mesajı gösterilmeli, ancak hesabın varlığı üçüncü şahıslara açık şekilde ifşa edilmemelidir (güvenlik gereği).
- Kayıt formu CSRF token ile korunmalıdır.
- Şifre, veritabanında bcrypt ile hash'lenmiş olarak saklanmalı; düz metin (plaintext) hiçbir zaman loglanmamalıdır.

---

### US-AUTH-002 — E-posta / Şifre ile Giriş

**Kapsam:** Tüm roller | **Öncelik:** 🔴 Kritik

> *"Kayıtlı bir kullanıcı olarak, e-posta ve şifremi girerek sisteme giriş yapmak istiyorum; böylece kaldığım yerden alışverişe devam edebilir, sipariş geçmişimi görebilirim."*

**Kabul Kriterleri:**
- Geçerli kimlik bilgileriyle giriş yapıldığında kullanıcı ilgili rolüne göre yönlendirilmelidir (Müşteri → Storefront, Admin/Editör → Admin Panel).
- Başarılı girişte Access Token (JWT, 15 dk. TTL) ve Refresh Token (7 gün TTL, HTTP-only cookie) üretilmelidir.
- Yanlış şifre girişiminde 5 başarısız denemeden sonra ilgili hesap 15 dakika süreyle kilitlenmelidir; kullanıcı bu durumdan e-posta ile bilgilendirilmelidir.
- Giriş sayfasında "Beni Hatırla" seçeneği sunulmalı; seçilmesi durumunda Refresh Token TTL 30 güne uzatılmalıdır.
- Tüm giriş girişimleri (başarılı / başarısız) IP adresi ile birlikte audit log'a kaydedilmelidir.

---

### US-AUTH-003 — Sosyal Medya ile Giriş (OAuth 2.0)

**Kapsam:** Müşteri | **Öncelik:** 🟡 Orta

> *"Bir müşteri olarak, ayrı bir hesap oluşturmak zorunda kalmadan Google veya Facebook hesabımla hızlıca giriş yapabilmek istiyorum."*

**Kabul Kriterleri:**
- Google ve Facebook OAuth 2.0 akışı desteklenmelidir.
- İlk OAuth girişinde kullanıcı profil bilgileri (ad, soyad, e-posta, profil resmi) otomatik olarak sisteme aktarılmalı ve onay ekranı gösterilmelidir.
- Aynı e-posta adresiyle hem OAuth hem standart hesap mevcutsa, kullanıcı hesap birleştirme seçeneği sunulmalıdır.
- OAuth ile giriş yapan kullanıcıların sistemde şifre alanı boş bırakılmalı; isterler ise sonradan şifre oluşturabilmelidirler.

---

### US-AUTH-004 — Şifre Sıfırlama

**Kapsam:** Müşteri, Editör, Admin | **Öncelik:** 🔴 Kritik

> *"Şifremi unuttuğumda, e-posta adresime gelen güvenli bir bağlantıyla şifremi sıfırlayabilmek istiyorum."*

**Kabul Kriterleri:**
- Kullanıcı "Şifremi Unuttum" sayfasına e-posta adresini girerek sıfırlama talebi oluşturabilmelidir.
- Sıfırlama bağlantısı yalnızca **15 dakika** geçerli olmalı; tek kullanımlık (one-time) token içermelidir.
- Bağlantı kullanıldıktan sonra geçersiz hale gelmeli ve ilgili kullanıcının tüm aktif oturumları sonlandırılmalıdır (session invalidation).
- E-posta adresi sistemde kayıtlı olmasa bile "e-posta gönderildi" mesajı gösterilmeli; böylece kayıtlı e-posta adresleri ifşa edilmemelidir.

---

### US-AUTH-005 — Rol Atama ve Yönetim

**Kapsam:** Admin | **Öncelik:** 🔴 Kritik

> *"Sistem yöneticisi olarak, personelime uygun rolleri atayabilmek ve gerektiğinde bu rolleri değiştirebilmek istiyorum; böylece her çalışan yalnızca yetkili olduğu alanlara erişebilsin."*

**Kabul Kriterleri:**
- Admin, kullanıcı listesinden herhangi bir kullanıcının rolünü Editör veya Admin olarak atayabilmeli ya da değiştirebilmelidir.
- Rol değişikliği anında aktif oturumları etkilemeli; kullanıcı bir sonraki API isteğinde yeni yetki setiyle karşılaşmalıdır (token revocation veya yenileme mekanizmasıyla).
- Admin, kendi Admin rolünü kaldıramamalıdır (son Admin koruması).
- Her rol değişikliği işlemi audit log'a kaydedilmelidir: kim değiştirdi, kimin rolü değişti, ne zaman, önceki rol, yeni rol.

---

### US-AUTH-006 — Güvenli Çıkış (Logout)

**Kapsam:** Tüm roller | **Öncelik:** 🔴 Kritik

> *"Oturumumu kapattığımda, başka birinin aynı cihazdan hesabıma erişemeyeceğinden emin olmak istiyorum."*

**Kabul Kriterleri:**
- Çıkış işleminde sunucu tarafında Refresh Token Redis'ten silinmelidir (token blacklisting).
- HTTP-only cookie temizlenmelidir.
- Kullanıcı giriş sayfasına yönlendirilmeli; tarayıcı geri tuşuyla korumalı sayfalara dönülememesi için cache-control header'ları ayarlanmalıdır.
- "Tüm cihazlardan çıkış yap" seçeneği sunulmalı; bu seçenek ilgili kullanıcıya ait tüm Refresh Token'ları geçersiz kılmalıdır.

---

## 3. ÜRÜN YÖNETİMİ

**Teknik Referans:** Prisma ORM, PostgreSQL full-text search (tsvector/tsquery), MinIO presigned URL, Redis cache (TTL: 5 dk.)

---

### US-PROD-001 — Ürün Listeleme ve Keşif

**Kapsam:** Misafir, Müşteri | **Öncelik:** 🔴 Kritik

> *"Siteye giren herhangi bir kullanıcı olarak, ürünleri kolayca bulabilmek için kategorilere göre gezebilmek, filtreler uygulayabilmek ve sıralama yapabilmek istiyorum."*

**Kabul Kriterleri:**
- Ürünler kategori hiyerarşisinde (ana kategori → alt kategori) gezilerek listelenebilmelidir.
- Aynı anda birden fazla filtre uygulanabilmelidir: kategori, fiyat aralığı (min-max slider), marka, renk, beden, stok durumu.
- Sıralama seçenekleri sunulmalıdır: en yeniler, en çok satanlar, fiyat artan, fiyat azalan, en yüksek puan.
- Filtre ve sıralama seçimleri URL query parametrelerine yansıtılmalı; kullanıcı sayfayı yenilediğinde veya bağlantıyı paylaştığında aynı filtre durumu korunmalıdır.
- Sayfa başına ürün sayısı varsayılan 24 olmalı; kullanıcı 12, 24 veya 48 arasında seçim yapabilmelidir.
- Stokta olmayan ürünler listede "Tükendi" etiketi ile gösterilmeli, sepete eklenememeli ve sıralamada en sona itilmelidir.

---

### US-PROD-002 — Ürün Arama

**Kapsam:** Misafir, Müşteri | **Öncelik:** 🔴 Kritik

> *"Aradığım ürünün adını ya da markasını yazdığımda, hızlıca ve doğru sonuçlara ulaşabilmek istiyorum."*

**Kabul Kriterleri:**
- Arama çubuğu header bileşeninde her sayfada görünür olmalıdır.
- Kullanıcı yazmaya başladıktan 300ms (debounce) sonra anlık öneri listesi (autocomplete dropdown) gösterilmeli; liste en fazla 8 öneri içermelidir.
- Arama; ürün adı, açıklama, marka ve SKU kodu üzerinde çalışmalıdır.
- Türkçe karakter duyarsız arama desteklenmelidir (örn. "kazak" araması "Kazak", "KAZAK" sonuçlarını getirmelidir).
- Sonuç bulunamadığında açıklayıcı mesaj ve alternatif öneriler gösterilmelidir.
- Popüler aramalar ve son aramalar (localStorage'da saklanarak) arama kutusuna tıklandığında önerilmelidir.

---

### US-PROD-003 — Ürün Detay Sayfası

**Kapsam:** Misafir, Müşteri | **Öncelik:** 🔴 Kritik

> *"Bir ürünü satın almadan önce tüm detaylarını görmek istiyorum: görseller, özellikler, fiyat, stok durumu ve diğer müşterilerin yorumları."*

**Kabul Kriterleri:**
- Ürün sayfasında yüksek çözünürlüklü görsel galerisi (büyütme/zoom desteği, thumbnail navigasyonu, en az 5 görsel kapasitesi) sunulmalıdır.
- SKU bazlı varyantlar (renk, beden, materyal vb.) seçilebilir butonlar olarak gösterilmeli; seçilen kombinasyona göre fiyat, stok ve görsel dinamik olarak güncellenmelidir.
- Stok miktarı gösterilmeli; "Son X ürün kaldı" uyarısı, stok eşik değeri (yapılandırılabilir, varsayılan 5 adet) altındayken tetiklenmelidir.
- Ürün açıklaması zengin metin (rich text / HTML) olarak render edilmelidir.
- Teknik özellikler tablosu ayrı bir sekme veya accordion bileşeninde gösterilmelidir.
- Müşteri yorumları sayfalı olarak listelenmeli; ortalama puan ve puan dağılımı grafik olarak sunulmalıdır.
- "Benzer Ürünler" bölümü aynı kategori ve markadan ürünleri göstermelidir.
- Sayfa URL'si SEO uyumlu slug formatında olmalıdır (`/urunler/kadin-kazak-yun-kirmizi`).
- Sayfa meta title, meta description ve Open Graph etiketlerini dinamik olarak içermelidir.

---

### US-PROD-004 — Ürün Ekleme (Admin / Editör)

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Editör olarak, yeni bir ürünü sisteme ekleyebilmek ve tüm detaylarını girebilmek istiyorum; böylece müşteriler ürünü hemen görüp satın alabilsin."*

**Kabul Kriterleri:**
- Ürün formu şu alanları içermelidir: ürün adı, slug (otomatik üretilir, düzenlenebilir), kategori seçimi (çok seviyeli), marka, kısa açıklama, fiyat, indirimli fiyat, KDV oranı, ağırlık, boyut bilgileri, etiketler.
- Varyant tanımlaması çok boyutlu olarak yapılabilmelidir: önce varyant tipleri (renk, beden) oluşturulur, ardından her kombinasyon için ayrı SKU, stok miktarı ve görsel atanabilir.
- Görseller sürükle-bırak veya dosya seçme dialogu ile yüklenebilmeli; yüklenen görseller sunucu tarafında WebP formatına dönüştürülmeli ve birden fazla çözünürlükte (thumbnail, medium, large) kaydedilmelidir.
- Ürün kaydedilmeden önce "Taslak" statüsünde oluşturulabilmeli; yayınlama için ayrı "Yayınla" butonu bulunmalıdır.
- Tüm zorunlu alanlar doldurulmadan yayınlama başlatılamamalıdır; eksik alanlar görsel olarak vurgulanmalıdır.
- Ürün kaydedildikten sonra ilgili önbellek (Redis) otomatik olarak temizlenmelidir (cache invalidation).

---

### US-PROD-005 — Toplu Ürün Güncelleme (Admin / Editör)

**Kapsam:** Admin, Editör | **Öncelik:** 🟡 Orta

> *"Editör olarak, çok sayıda ürünün fiyatını, stok miktarını veya kategorisini tek tek değiştirmek yerine bir Excel dosyasıyla toplu olarak güncelleyebilmek istiyorum."*

**Kabul Kriterleri:**
- Sistem CSV/XLSX formatında şablon dosyası indirilebilir olarak sunmalıdır.
- Yüklenen dosyada SKU kodu eşleştirme anahtarı olarak kullanılmalıdır.
- Dosya yüklenmeden önce sistem doğrulama (validation) çalıştırmalı; hatalı satırlar raporlanmalı, hatasız satırlar işlenebilmelidir (kısmi güncelleme desteği).
- Güncelleme işlemi arka planda (background job / Bull queue) çalışmalı; tamamlandığında kullanıcıya bildirim gönderilmelidir.
- İşlem sonucu raporu (başarılı: X, hatalı: Y, atlanan: Z) indirilebilir formatta sunulmalıdır.
- Editör fiyat ve stok güncelleyebilir; kategori ve marka güncellemesi yalnızca Admin yetkisindedir.

---

## 4. STOK YÖNETİMİ

**Teknik Referans:** PostgreSQL transaction (SELECT FOR UPDATE), Socket.IO, Bull queue (Redis tabanlı), Nodemailer

---

### US-STOCK-001 — Gerçek Zamanlı Stok Takibi

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Depo sorumlusu olarak, anlık stok miktarlarını görebilmek istiyorum; böylece hangi ürünlerin tükenmek üzere olduğunu fark edip önlem alabilirim."*

**Kabul Kriterleri:**
- Admin panelindeki stok listesi, sayfa yenilenmeden WebSocket üzerinden anlık güncellenmelidir.
- Her ürün/varyant için stok miktarı, son güncelleme zamanı ve hareket geçmişi (stok in/out) görüntülenebilmelidir.
- Stok listesi, ürün adı, kategori ve stok durumuna göre filtrelenebilmelidir.
- Bir müşteri sipariş tamamladığında stok düşme işlemi veritabanı transaction içinde atomik olarak gerçekleşmelidir; race condition önlenmelidir (SELECT FOR UPDATE).
- Stok hareket kaydı; işlem tipi (satış, iade, manuel güncelleme, toplu import), miktar, önceki değer, yeni değer ve işlemi yapan kullanıcı bilgilerini içermelidir.

---

### US-STOCK-002 — Düşük Stok Uyarı Sistemi

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Ürün sorumlusu olarak, bir ürünün stoğu belirlediğim eşik değerinin altına düştüğünde anında haberdar olmak istiyorum; böylece tedarik sürecini zamanında başlatabileyim."*

**Kabul Kriterleri:**
- Her ürün/varyant için bağımsız stok uyarı eşiği (threshold) tanımlanabilmelidir; varsayılan değer sistem genelinde yapılandırılabilir olmalıdır.
- Stok eşiğin altına düştüğünde şu kanallardan bildirim gönderilmelidir: Admin paneli içi anlık bildirim (WebSocket) ve yetkili kullanıcıların e-posta adresleri.
- Aynı ürün için uyarı bildirimi, stok tekrar eşiğin üzerine çıkmadan maksimum 1 kez gönderilmelidir (duplicate notification önlenmesi).
- Düşük stoklu ürünler Admin panelinde ayrı bir filtre ile listelenebilmelidir.
- Uyarı e-postası; ürün adı, mevcut stok miktarı, eşik değeri ve admin paneli bağlantısı içermelidir.

---

### US-STOCK-003 — Manuel Stok Güncelleme

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Depo sorumlusu olarak, iade, zarar gören ürün veya yeni gelen stok gibi durumlarda stok miktarını manuel olarak güncelleyebilmek ve neden güncellediğimi kayıt altına alabilmek istiyorum."*

**Kabul Kriterleri:**
- Stok güncelleme formunda miktar (artış veya azalış olarak) ve zorunlu açıklama alanları bulunmalıdır.
- Her manuel güncelleme; kimin yaptığı, ne zaman yapıldığı ve gerekçesiyle birlikte stok hareket günlüğüne kaydedilmelidir.
- Stok miktarı negatif değere düşürülememeli; bu durumda işlem reddedilmeli ve uyarı gösterilmelidir.

---

## 5. SİPARİŞ YÖNETİMİ

**Teknik Referans:** State Machine pattern, PostgreSQL transaction, Simülasyon Motoru, Bull queue

---

### US-ORDER-001 — Sepet Yönetimi

**Kapsam:** Müşteri | **Öncelik:** 🔴 Kritik

> *"Alışveriş yaparken, istediğim ürünleri sepetime ekleyebilmek, miktarlarını değiştirebilmek ve sepetimi istediğim zaman görebilmek istiyorum; oturumu kapattığımda sepetim kaybolmamalı."*

**Kabul Kriterleri:**
- Ürün detay sayfasından ve listeleme sayfasından (hızlı ekle) sepete ürün eklenebilmelidir.
- Aynı varyant birden fazla kez eklendiğinde miktar artırılmalı, yeni satır oluşturulmamalıdır.
- Sepet içeriği; oturum açık kullanıcılarda veritabanında, misafir kullanıcılarda localStorage'da saklanmalıdır.
- Sepette ürün miktarı artırılırken mevcut stok miktarı aşılamamalıdır; stok yetersizse kullanıcı bilgilendirilmelidir.
- Sepete ürün eklendiğinde header'daki sepet ikonu anlık güncellenmelidir.
- Fiyat değişikliği olan ürünler sepette eski ve yeni fiyatla gösterilmeli; kullanıcı onaylayana kadar ödemeye geçilememeli.

---

### US-ORDER-002 — Ödeme Akışı (Checkout)

**Kapsam:** Müşteri | **Öncelik:** 🔴 Kritik

> *"Alışverişimi tamamlamak istediğimde, hızlı ve güvenli bir şekilde adresimi seçip ödeme yapabilmek istiyorum; işlem tamamlandığında onay e-postası almak istiyorum."*

**Kabul Kriterleri:**
- Checkout 3 adımlı wizard akışıyla tasarlanmalıdır: (1) Teslimat adresi seçimi / eklenmesi, (2) Kargo seçimi, (3) Ödeme.
- Kullanıcı birden fazla adres kaydedebilmeli ve varsayılan adres belirleyebilmelidir.
- Kayıtlı kart seçimi veya yeni kart girişi desteklenmelidir; sistem gerçek bir ödeme altyapısına bağlı değildir — kart bilgileri yalnızca format doğrulamasından geçirilir ve simülasyon motoru tarafından işlenir; hiçbir kart verisi veritabanında saklanmaz.
- Simülasyon motoru; başarılı ödeme, yetersiz bakiye ve geçersiz kart senaryolarını test edilebilir biçimde desteklemelidir (test kart numaralarıyla tetiklenir).
- Kupon kodu alanı sunulmalı; geçerli kupon uygulandığında indirim tutarı ve toplam anlık olarak güncellenmelidir.
- Ödeme tamamlandığında: sipariş veritabanına işlenmeli, stok düşülmeli, kullanıcıya onay e-postası gönderilmeli ve sipariş onay sayfasına yönlendirilmelidir. Bu işlemlerin tamamı tek bir veritabanı transaction'ı içinde atomik olarak gerçekleşmelidir.
- Ödeme başarısız olursa rezerv edilen stok serbest bırakılmalı ve kullanıcıya açıklayıcı hata mesajı gösterilmelidir.

---

### US-ORDER-003 — Sipariş Durum Yönetimi (Admin / Editör)

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Sipariş takibinden sorumlu personel olarak, siparişlerin durumunu güncelleyebilmek, filtreleyebilmek ve müşteriyi otomatik olarak bilgilendirebilmek istiyorum."*

**Kabul Kriterleri:**
- Sipariş durumları şu state machine akışını izlemelidir: `Beklemede → Onaylandı → Hazırlanıyor → Kargoya Verildi → Teslim Edildi`. Yan dallar: `Beklemede/Onaylandı/Hazırlanıyor → İptal Edildi` ve `Teslim Edildi → İade Talep Edildi → İade Onaylandı`.
- Geriye dönük durum geçişi yapılamamalıdır.
- Her durum değişikliği müşteriye otomatik e-posta bildirimi göndermelidir.
- "Kargoya Verildi" durumuna geçişte kargo firması adı ve takip numarası zorunlu alan olmalıdır.
- Sipariş listesi şu kriterlere göre filtrelenebilmelidir: durum, tarih aralığı, ödeme yöntemi, sipariş tutarı ve müşteri adı/e-postası.
- Siparişler CSV formatında dışa aktarılabilmelidir.

---

### US-ORDER-004 — Müşteri Sipariş Takibi

**Kapsam:** Müşteri | **Öncelik:** 🔴 Kritik

> *"Sipariş verdikten sonra, siparişimin nerede olduğunu ve ne zaman geleceğini takip edebilmek istiyorum."*

**Kabul Kriterleri:**
- Kullanıcı "Siparişlerim" sayfasında tüm sipariş geçmişini görebilmelidir.
- Her siparişin detay sayfasında sipariş özeti, durum zaman çizelgesi (timeline), kargo takip numarası ve iade/iptal seçenekleri sunulmalıdır.
- Sipariş durumu değiştiğinde kullanıcıya anlık bildirim (WebSocket) ve e-posta gönderilmelidir.
- Kargo takip numarasına tıklandığında ilgili kargo firmasının takip sayfası yeni sekmede açılmalıdır.

---

## 6. ANLIK BİLDİRİM SİSTEMİ

**Teknik Referans:** Socket.IO v4, Redis Pub/Sub, Nodemailer, Bull queue (delayed jobs)

---

### US-NOTIF-001 — Yönetici Panel İçi Anlık Bildirimler

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Admin panelini kullanırken, sayfa yenilemeden anlık olarak önemli olayları (yeni sipariş, düşük stok, yeni iade talebi) görebilmek istiyorum."*

**Kabul Kriterleri:**
- Panel header'ında bildirim zili ikonu ve okunmamış bildirim sayacı (badge) bulunmalıdır.
- Aşağıdaki olaylar WebSocket üzerinden anlık bildirim tetiklemelidir: yeni sipariş oluşturulması, ödeme başarısız olan sipariş, stok eşiğinin altına düşen ürün, yeni iade talebi, başarısız toplu güncelleme işlemi.
- Bildirim paneli açıldığında son 50 bildirim listelenmeli; her bildirimde olay tipi, özet metin, ilgili kayda bağlantı ve zaman damgası yer almalıdır.
- Bildirimler "Okundu" ve "Tümünü okundu işaretle" seçenekleriyle yönetilebilmelidir.
- Bildirimler kullanıcı rolüne göre filtrelenmelidir: Editör yalnızca stok ve sipariş bildirimlerini almalıdır.
- Kullanıcı oturum açmadığında veya bağlantı kesildiğinde biriken bildirimler, yeniden bağlanıldığında teslim edilmelidir (missed event recovery).

---

### US-NOTIF-002 — Müşteri E-posta Bildirimleri

**Kapsam:** Müşteri | **Öncelik:** 🔴 Kritik

> *"Sipariş sürecinin her adımında otomatik e-posta almak istiyorum; böylece siparişimin durumunu takip edebilir, gerekirse müşteri hizmetlerine başvurabilirim."*

**Kabul Kriterleri:**
- Aşağıdaki olaylar müşteriye otomatik e-posta tetiklemelidir: kayıt onayı, şifre sıfırlama, sipariş alındı onayı (sipariş özeti ve tutarıyla), ödeme onayı, sipariş hazırlanıyor, kargoya verildi (takip numarasıyla), teslim edildi, iade onaylandı.
- E-postalar HTML şablon motoruyla (Handlebars) oluşturulmalı; kurumsal marka kimliğine uygun tasarımda olmalıdır.
- E-postalar Bull queue aracılığıyla kuyruğa alınmalı; geçici hata durumunda 3 kez yeniden denenmeli (exponential backoff), başarısız denemeler loglanmalıdır.
- Kullanıcı hesap ayarlarından e-posta bildirim tercihlerini yönetebilmelidir; yasal zorunlu e-postalar (şifre sıfırlama, güvenlik uyarısı) devre dışı bırakılamamalıdır.

---

### US-NOTIF-003 — Stok Gelince Haber Ver

**Kapsam:** Müşteri | **Öncelik:** 🟡 Orta

> *"Beğendiğim ürün şu an stokta yoksa, tekrar stoğa girdiğinde bana haber verilmesini istiyorum."*

**Kabul Kriterleri:**
- Tükenen ürün sayfasında "Stoka Gelince Haber Ver" butonu görünmelidir; kayıtlı kullanıcılar için tek tıkla abonelik oluşturulabilmelidir.
- Misafir kullanıcılar e-posta adresi girerek bu özelliği kullanabilmelidir.
- Aynı ürün/varyant için aynı kullanıcıdan birden fazla abonelik oluşturulmamalıdır.
- Ürün stoğa girdiğinde bekleyen tüm abonelere e-posta gönderilmeli; abonelik otomatik olarak sonlandırılmalıdır.

---

## 7. RAPORLAMA VE VERİ ÇIKTI SİSTEMİ

**Teknik Referans:** ExcelJS (XLSX üretimi), Puppeteer/PDFKit (PDF üretimi), Recharts (grafik), PostgreSQL aggregate sorguları, Bull queue

---

### US-REPORT-001 — Satış Dashboard'u

**Kapsam:** Admin, Editör (kısıtlı) | **Öncelik:** 🔴 Kritik

> *"Yönetici olarak, satış performansını tek bakışta anlayabilmek istiyorum: günlük/haftalık/aylık gelir, sipariş adedi, ortalama sepet tutarı ve en çok satan ürünler."*

**Kabul Kriterleri:**
- Dashboard açılış sayfasında şu metrikler KPI kart formatında gösterilmelidir: bugünkü gelir ve önceki güne göre değişim (%), bu ayki sipariş adedi, ortalama sipariş değeri, aktif müşteri sayısı.
- Gelir grafiği günlük, haftalık, aylık ve yıllık periyotlarda seçilebilir olmalıdır; Recharts ile çizgi grafik veya çubuk grafik olarak gösterilmelidir.
- En çok satanlar tablosunda ürün adı, kategori, satış adedi, toplam gelir ve stok durumu yer almalıdır; varsayılan olarak son 30 gün gösterilmeli, tarih aralığı seçilebilmelidir.
- Sipariş durum dağılımı pasta grafik olarak gösterilmelidir.
- Dashboard verileri önbellekten sunulmalı; önbellek her 5 dakikada bir veya yeni sipariş geldiğinde yenilenmelidir.

---

### US-REPORT-002 — Excel (XLSX) Rapor Çıktısı

**Kapsam:** Admin, Editör | **Öncelik:** 🔴 Kritik

> *"Muhasebe ve yönetim için, satış verilerini ve sipariş listelerini Excel formatında indirip kendi tablolarımda analiz edebilmek istiyorum."*

**Kabul Kriterleri:**
- Aşağıdaki raporlar XLSX formatında indirilebilir olmalıdır: Sipariş Listesi Raporu, Ürün Satış Raporu, Stok Durum Raporu, Müşteri Listesi Raporu.
- Her rapor için tarih aralığı, kategori ve durum filtreleri uygulanabilmeli; yalnızca filtrelenmiş veri çıktıya alınmalıdır.
- XLSX çıktısı kurumsal görünümde olmalıdır: başlık satırı kalın ve renkli, sayısal kolonlar sağa hizalı, tarih formatı `GG.AA.YYYY`, para birimi kolonları `TL` sembollü.
- 10.000 satırı aşan raporlar Bull queue'ya alınmalı; arka planda üretilmeli ve hazır olduğunda kullanıcıya bildirim gönderilmelidir.
- Üretilen rapor dosyaları MinIO'da 7 gün süreyle saklanmalı; bu süreden sonra otomatik olarak silinmelidir.

---

### US-REPORT-003 — PDF Rapor Çıktısı

**Kapsam:** Admin | **Öncelik:** 🟡 Orta

> *"Yönetim sunumları ve muhasebe arşivi için, raporları PDF formatında, kurumsal görünümde ve imzalanabilir biçimde indirebilmek istiyorum."*

**Kabul Kriterleri:**
- Aşağıdaki belgeler PDF formatında üretilebilmelidir: Fatura / sipariş özeti (müşteri başına), Aylık satış özet raporu, Stok durum raporu.
- PDF'ler Puppeteer ile HTML şablonlardan headless render edilerek üretilmelidir.
- Tüm PDF belgeleri şu ortak öğeleri içermelidir: şirket logo alanı, belge başlığı ve numarası, oluşturma tarihi ve saati, sayfa numarası (X/Y), Gizli watermark (yapılandırılabilir).
- Fatura PDF'i müşteriye e-posta eki olarak da gönderilebilmelidir.
- PDF üretimi 5 saniyeyi aşarsa işlem Bull queue'ya alınmalı ve kullanıcıya bildirim gönderilmelidir.

---

### US-REPORT-004 — Müşteri Analitik Raporu

**Kapsam:** Admin | **Öncelik:** 🟢 Düşük

> *"Pazarlama stratejimi belirlemek için, müşterilerimi satın alma sıklığına ve harcama miktarına göre segmentleyebilmek istiyorum."*

**Kabul Kriterleri:**
- Müşteri listesinde şu metriklere göre sıralama yapılabilmelidir: toplam harcama (LTV), sipariş adedi, son sipariş tarihi, ortalama sepet değeri.
- RFM (Recency, Frequency, Monetary) bazlı otomatik segment etiketleri hesaplanmalı ve müşteri profilinde gösterilmelidir: "Sadık Müşteri", "Risk Altında", "Yeni Müşteri", "Kayıp Müşteri".
- Segment bazlı müşteri listesi CSV olarak dışa aktarılabilmelidir.

---

## 8. KAMPANYA VE KUPON YÖNETİMİ

**Teknik Referans:** PostgreSQL constraint, transaction, coupon validation middleware

---

### US-CAMP-001 — Kupon Tanımlama

**Kapsam:** Admin, Editör | **Öncelik:** 🟡 Orta

> *"Pazarlama sorumlusu olarak, promosyon kampanyaları için kupon kodları oluşturabilmek ve bunları detaylı kurallarla yapılandırabilmek istiyorum."*

**Kabul Kriterleri:**
- Kupon oluşturma formunda şu parametreler tanımlanabilmelidir: kupon kodu (manuel veya otomatik üretim), indirim tipi (yüzde veya sabit tutar), indirim değeri, minimum sepet tutarı, geçerli kategoriler/ürünler (kısıtlama — opsiyonel), maksimum kullanım sayısı, kullanıcı başına maksimum kullanım, geçerlilik tarihi aralığı.
- Aynı sepette birden fazla kupon kullanılamamalıdır.
- Kupon kullanımı stok güncelleme gibi atomik işlemlerle aynı transaction içinde işlenmelidir.
- Admin, aktif kuponların kullanım istatistiklerini (kaç kez kullanıldı, toplam sağlanan indirim) görüntüleyebilmelidir.
- Süresi dolan kuponlar otomatik olarak devre dışı bırakılmalıdır (scheduled job).

---

## 9. KULLANICI PROFİLİ VE HESAP YÖNETİMİ


### US-PROFILE-001 — Profil Yönetimi

**Kapsam:** Müşteri | **Öncelik:** 🟡 Orta

> *"Hesabıma girdikten sonra, kişisel bilgilerimi, adreslerimi ve şifremi yönetebilmek istiyorum."*

**Kabul Kriterleri:**
- Kullanıcı adını, soyadını, telefon numarasını ve profil resmini güncelleyebilmelidir.
- Birden fazla teslimat adresi eklenebilmeli, düzenlenebilmeli ve silinebilmelidir; varsayılan adres belirlenebilmelidir.
- Şifre değiştirme işlemi için mevcut şifre doğrulaması zorunlu olmalıdır.
- E-posta adresi değiştirilmek istendiğinde yeni adrese doğrulama e-postası gönderilmeli; doğrulanana kadar eski adres aktif kalmalıdır.
- Kullanıcı hesabını silme talebinde bulunabilmelidir; kişisel veriler KVKK uygunluğunda anonimleştirilmeli, sipariş kayıtları korunmalıdır.

---

## 10. GEREKSİNİM ÖNCELİK ÖZETİ

| Modül | Kritik 🔴 | Orta 🟡 | Düşük 🟢 | Toplam |
|---|---|---|---|---|
| Kimlik Doğrulama | 5 | 1 | 0 | 6 |
| Ürün Yönetimi | 4 | 1 | 0 | 5 |
| Stok Yönetimi | 3 | 0 | 0 | 3 |
| Sipariş Yönetimi | 4 | 0 | 0 | 4 |
| Bildirim Sistemi | 2 | 1 | 0 | 3 |
| Raporlama | 2 | 1 | 1 | 4 |
| Kampanya / Kupon | 0 | 1 | 0 | 1 |
| Profil Yönetimi | 0 | 1 | 0 | 1 |
| **Toplam** | **20** | **6** | **1** | **27** |

---
