# 4. SİSTEMİN GERÇEKLEŞTİRİMİ (UYGULAMA)

Bu bölümde tez kapsamında hayata geçirilen Fuira E-Commerce adlı çok satıcılı platformun uygulama tarafı anlatılmaktadır. Kuramsal çerçevenin ötesinde, sistemin hangi teknolojilerle kurulduğu, verinin nasıl modellendiği, arka uç ve ön yüzün birbirine nasıl bağlandığı ve tipik iş akışlarının kodda nasıl karşılık bulduğu okuyucuya somut biçimde aktarılır.

Ana çözüm, tek bir Node sunucusunda toplanan Express ve Prisma tabanlı storebackend uygulamasıdır. Buna üç ayrı arayüz eşlik eder: müşteri mağazası, platform yönetimi ve satıcı paneli. Bunların tamamı React ekosisteminde, Vite ile paketlenmiştir. Depoda auth-service, product-service ve order-service gibi ayrı servis klasörleri de vardır; ancak bu tez kapsamındaki işlev ve entegrasyon anlatımı esas olarak storebackend üzerinden ilerler.

---

## 4.1. Kapsam ve yaklaşım

Uygulamanın kapsadığı başlıca roller şunlardır: son kullanıcı ürünleri gezer, sepete ekler, adres bilgisiyle siparişi tamamlar ve profilinden geçmiş siparişlere bakar; satıcı kendi ürün ve stoklarını yönetir, kendisine düşen sipariş bileşenlerini panelden izler; yönetici ise kategori ve özellik sözlüğünden ürün ve sipariş yönetimine, satıcı ve kullanıcı listelerinden genel istatistiklere kadar platformu uçtan uca denetleyebilir.

Bu işlevler, REST tarzı HTTP uçları üzerinden PostgreSQL veritabanına yazılır veya oradan okunur. Statik ürün görselleri veritabanı yerine MinIO üzerinde tutulur. Güvenlik tarafında JWT ile kimlik doğrulama, CORS kısıtları, istek hızı sınırlaması ve giriş verilerinin sanitize edilmesi gibi katmanlar devrededir.

[FOTOĞRAF EKLE]*Şekil 4.1 – Sistemin genel bileşen diyagramı: istemciler, API, veritabanı, Redis ve nesne depolama.*

---

## 4.2. Teknoloji yığını ve geliştirme ortamı

### 4.2.1. Ortam ve ön yüz

Geliştirme süreci Windows 10/11 ortamında yürütülmüştür. Node sürümü en az 20 olacak şekilde sınırlandırılmış; kök dizindeki package.json birden fazla uygulamayı npm workspaces aracılığıyla tek çatı altında toplar.

Ön yüz tarafında React 19, TypeScript ve Vite 6 kullanıldı. Sayfa geçişleri React Router ile yönetiliyor; müşteri uygulamasında geleneksel tarayıcı yönlendiricisi, satıcı panelinde ise createBrowserRouter tercih edildi. Stil için Tailwind CSS 4 kullanıldı; kullanıcıya anlık geri bildirim için react-toastify ve SweetAlert2 eklendi. Üç ayrı uygulama — storefront, admin, vendor-panel — frontend monoreposunun apps klasöründe duruyor.

[FOTOĞRAF EKLE]*Şekil 4.2 – frontend/apps altındaki üç uygulama klasörünün görünümü.*

### 4.2.2. Arka uç ve altyapı

storebackend Express 4 üzerinde çalışıyor. Veri erişimi Prisma ORM ile yönetiliyor; üretim veritabanı PostgreSQL’dir. Oturum ve parola işleri için sırasıyla jsonwebtoken ve bcryptjs devrede. Çapraz kaynak istekleri cors ile, çerez ayrıştırma cookie-parser ile yapılıyor. Helmet güvenlik başlıkları eklenmiş; ağır istek yükünü sınırlamak için gövde boyutu tavanı ve express-rate-limit kullanılıyor. Dosya yüklemesi Multer ile alınıyor, görseller gerektiğinde Sharp ile işlenip MinIO’ya yazılıyor. Redis istemcisi olarak ioredis seçilmiş; günlükler Winston üzerinden tutulabiliyor ve Seq ile merkezi görüntüleme düşünülmüş. API dosyaları src/api altında alan alan ayrılmış; her iş için routes ve controller çiftleri var.

### 4.2.3. Mikroservis iskeletleri

services klasöründeki auth-service, product-service ve order-service uygulamaları kendi Prisma şemaları ve Express giriş noktalarıyla ayrı süreçler gibi düşünülebilir. Özellikle sipariş servisinde RabbitMQ’ya mesaj göndermeye yarayan yardımcı kod bulunur. Bu tezde anlattığım canlı senaryo ise tek birleşik API üzerinden gittiği için detaylar storebackend ile sınırlı tutulmuştur.

---

## 4.3. Mimari ve veri modeli

### 4.3.1. Katmanlı yapı

Sistemi üç katmanda özetlemek mümkün. Birincisi sunum katmanı: üç React uygulaması geliştirme sırasında çoğunlukla 5173–5175 gibi portlarda çalışır ve tüm iş mantığı storebackend üzerindeki /api önekli adreslere gider. İkincisi uygulama katmanı: Express, gelen isteği sırayla güvenlik ve doğrulama filtresinden geçirir, controller’da iş kuralını işletir, Prisma ile veri tabanına iner. Üçüncüsü kalıcılık katmanı: ilişkisel veri PostgreSQL’de, dosyalar MinIO’da, sepete yakın bazı kullanıcı verileri ve koleksiyonlar Redis üzerinde tutulabilir.

Tarayıcı ile sunucu arasında çerez taşınması credentials bayrağıyla açıkça tanımlandı; hangi sitelerin çağrı yapabileceği CORS_ORIGINS ortam değişkeniyle üretimde sıkılaştırılabilir.

[FOTOĞRAF EKLE]*Şekil 4.3 – İstemciden API’ye ve oradan veri katmanına örnek istek akışı.*

### 4.3.2. Veritabanı varlıkları

Tüm ilişkisel model storebackend/prisma/schema.prisma dosyasında toplanmıştır. Müşteri için User, satıcı için Merchant, platform yöneticisi için Admin tabloları vardır; admin rolü AdminRole sabit listesiyle ayrılır. Oturum yenileme için kullanıcı, satıcı ve yöneticiye özel refresh token tabloları tanımlıdır.

Katalog tarafında hiyerarşik Category, satıcıya ve kategoriye bağlı Product, çoklu görsel ve varyant tabloları, filtrelenebilir Attribute yapısı ve alıcı yorumları Review ile desteklenir. Kategori kaydında filterValues alanı JSON olarak vitrin filtrelerine ham madde sağlar.

Sipariş Order ve OrderItem üzerinden kurulur. Her kalemde satıcıyı doğrudan gösteren merchantId alanı, raporlama ve satıcı panelinde filtrelemeyi kolaylaştırır. İşlem kayıtları için SystemLog modeli düşünülmüştür.

[FOTOĞRAF EKLE]*Şekil 4.4 – Veri modelinin ER diyagramı veya Prisma Studio ekranı.*

### 4.3.3. Tutarlılık ve normalizasyon

Sipariş oluştuğunda teslimat adresi JSON olarak sipariş kaydına gömülür; kalemlerdeki birim fiyat da o anda geçerli satış fiyatından kopyalanır. Böylece müşteri profilini veya ürün fiyatını sonradan değiştirseniz bile eski sipariş kaydı hukuki ve muhasebe açısından tutarlı kalır. Kategori–ürün ilişkisi normal forma yakın tutulmuş; slug ve sku alanlarına benzersizlik kısıtları konarak çift kayıt riski azaltılmıştır.

---

## 4.4. Sunucu tarafı uygulama

### 4.4.1. HTTP sunucusu ve güvenlik orta katmanları

server.js dosyası uygulamayı başlatır ve ara yazılımları sırayla dizer: Helmet, çerez ayrıştırıcı, CORS, gövde boyutu sınırı, sanitize adımı, ardından /api altında hız sınırlayıcı ve istek günlüğü. Beklenmeyen hatalar tek bir yerde yakalanır; kaynak politikası yüzünden reddedilen isteklerle diğer sunucu hataları kullanıcıya farklı HTTP kodlarıyla dönülür.

[FOTOĞRAF EKLE]*Şekil 4.5 – Sağlık uç noktasının veya kök cevabın Postman ya da tarayıcıda görüntüsü.*

### 4.4.2. API modülleri

Kimlik uçları üç ayrı önek altında toplanır: müşteri /api/auth/user, satıcı /api/auth/merchant, yönetici /api/auth/admin. Ürün ve kategori için /api/products, /api/products-meta, /api/categories ve /api/attributes kullanılır. Sepet /api/cart altında olup giriş yapılmış ve yapılmamış duruma göre esnek davranacak şekilde kurgulanabilir. İstek listesi ve koleksiyonlar sırasıyla /api/wishlist ve /api/collections üzerinden gidilir. Sipariş ve yorum /api/orders ile /api/reviews ile ayrılır. Satıcıya özel yollar /api/merchant altında, yöneticiye özel olanlar /api/admin altında birleşir. Dosya yükleme /api/upload ile sonlanır.

[FOTOĞRAF EKLE]*Şekil 4.6 – Bir API istemcisinde örnek isteklerin listesi.*

### 4.4.3. Kimlik doğrulama ve yetkilendirme

Parolalar veritabanında asla düz metin tutulmaz; bcrypt ile özetlenir. Kısa ömürlü erişim jetonu ve yenileme jetonu birlikte düşünülmüştür. authenticate ara yazılımı önce Authorization başlığındaki Bearer jetonuna bakar; yoksa rollere göre adlandırılmış HttpOnly çerezlere düşer. Doğrulama verifyAccessToken ile yapılır; başarılı yük req.user içine aktarılır. Satıcının yalnızca kendi ürününü güncellemesi gibi kurallar controller içinde merchantId karşılaştırmasıyla tamamlanır.

Müşteri arayüzünde authStore sınıfı profil bilgisini tarayıcıda localStorage içinde tutar; erişim jetonu ise HttpOnly çerezde varsayıldığı için istemci kodu jetonu okuyacak şekilde yazılmamıştır. Çıkışta yerel profil silinir. Oturumu sunucu tarafında tam kapatmak için ayrı bir çıkış uç noktası ve refresh iptali kullanılıyorsa bunu tez metninde kaynakla birlikte belirtmek gerekir.

[FOTOĞRAF EKLE]*Şekil 4.7 – Giriş ekranı veya başarılı oturumdan sonra görülen korumalı sayfa.*

### 4.4.4. Sipariş oluşturma ve atomik işlem

Sipariş oluşturma işlemi Prisma’nın $transaction bloğu içinde yürür. İstek gövdesi doğrulanır; her satır için ürün veritabından tekrar okunur ve toplam tutar istemcinin gönderdiği fiyata değil, sunucudaki güncel satış fiyatına göre hesaplanır. Aynı blok içinde sipariş ve kalemler yazılır, stok sayacı düşürülür. Böylece sipariş yazılıp stokun güncellenmemesi gibi yarım kalmış durumlar en aza iner. Geliştirme sırasında ödeme tarafı bazen doğrudan “ödendi” kabul edilebilir; canlı ortamda gerçek ödeme sağlayıcısı bu alanı güncellemelidir. Yoğun eş zamanlı satışta stok çakışması yaşanırsa veritabanı yalıtım düzeyi veya kilit stratejisi gözden geçirilmelidir.

[FOTOĞRAF EKLE]*Şekil 4.8 – Sipariş oluşturma isteğinin başarılı yanıtı.*

### 4.4.5. Redis, koleksiyonlar ve kategori filtreleri

Kullanıcıya özel koleksiyon listeleri Redis’te anahtar–değer biçiminde tutulur; anahtar deseni kullanıcı kimliğine göre üretilir ve kayıtlara yaklaşık doksan günlük süre sınırı konur. Vitrin filtreleri için /api/products-meta uçları devreye girer: seçilen kategori slug değerinden yola çıkılarak alt dallardaki tüm kategori kimlikleri bellek içinde gezilir; kök kategorinin filterValues alanı arayüzdeki filtre seçeneklerini besler.

[FOTOĞRAF EKLE]*Şekil 4.9 – Redis içeriği veya mağazadaki kategori ve filtre görünümü.*

### 4.4.6. Dosya yükleme ve medya

Yükleme Multer ile karşılanır, görüntü işleme için Sharp kullanılabilir, sonuç MinIO’ya yazılır. Veritabanında yalnızca nesnenin adresi veya anahtarı tutulur; büyük ikili dosyalar ilişkisel tabloda biriktirilmez.

[FOTOĞRAF EKLE]*Şekil 4.10 – Nesne depoda oluşan yol veya örnek görsel URL’si.*

---

## 4.5. İstemci uygulamaları

### 4.5.1. Mağaza

Müşteri uygulamasında ana rota ve vitrin varyantları /, /shop, /new ve /sale adreslerinde açılır. Ürün detayı kimlik parametresiyle gelir. Sepet, ödeme öncesi adımı, profil ve geçmiş sipariş detayı, istek listesi ve koleksiyonlar için ayrı yollar tanımlıdır; oturum açma ve kayıt sayfaları düzenin dışında tutulmuştur. Sayfa iskeleti MainLayout ile ortaklaştırıldı. Form ve işlem sonuçları toast ve modal diyaloglarla bildirilir.

[FOTOĞRAF EKLE]*Şekil 4.11 – Ana sayfa ile ürün detay sayfası.*

### 4.5.2. Yönetici paneli

Yönetim arayüzünde pano, kategori ve özellik yönetimi, ürün ve sipariş listeleri, satıcılar, kullanıcılar ve analitik ekranına giden rotalar vardır. Hepsi tek tip düzen içinde, giriş gerektiren kapalı bir alanda çalışır.

[FOTOĞRAF EKLE]*Şekil 4.12 – Yönetici panosu.*

### 4.5.3. Satıcı paneli

Satıcı uygulaması pano, ürün listesi, oluşturma ve düzenleme, taslakların ayrı listesi, siparişler, stok ekranı ve ayarlar sayfalarından oluşur. Oturum yoksa yönlendirme ProtectedRoute ile yapılır. Bağlantı kesildiğinde kullanıcıyı uyaran OfflineDetector bileşeni eklenmiştir. Ürünün taslak, yayında veya arşivde olduğu ProductStatus değerleriyle izlenir.

[FOTOĞRAF EKLE]*Şekil 4.13 – Satıcı tarafında ürün veya sipariş ekranı.*

### 4.5.4. Kullanıcı deneyimi notları

Bir vitrin bileşeninin birden fazla URL’ye bağlanması kod tekrarını azaltır; arama motoru ve paylaşım açısından hangi adresin ne anlama geldiğini dokümante etmek faydalı olur.

---

## 4.6. İş kuralları ve senaryolar

### 4.6.1. Sepet

Sepet uçları, kullanıcı girişi isteğe bağlı olacak şekilde kurgulanabilir. Misafirken oluşan sepet ile hesap açıldıktan sonraki sepetin birleştirilmesi iş kuralı olarak netleştirilmelidir; aksi halde kullanıcı ürünlerini “kaybetti” hissine kapılabilir.

### 4.6.2. Çok satıcılı pazar yeri

Her satıcı yalnızca kendi verisini görmelidir; bunun temel mekanizması sorgularda merchantId ile süzmedir. Tek sipariş altında birden fazla satıcıdan kalem bulunabilir; dağıtım ve komisyon gibi ticari konular ayrı modüllerle derinleştirilebilir.

### 4.6.3. Aktör ve senaryo özeti

| Aktör | Örnek senaryo | Ön yüz | Arka uç |
|--------|----------------|--------|---------|
| Misafir | Gezinme | Storefront | Ürün ve kategori |
| Müşteri | Kayıt, sepet, sipariş | Kayıt, sepet, ödeme öncesi | Kullanıcı, işlem |
| Satıcı | Ürün ve sipariş | Satıcı paneli | Satıcı uçları |
| Yönetici | Kategori, istatistik | Yönetim | Yönetici uçları |

[FOTOĞRAF EKLE]*Şekil 4.14 – Önceki tabloyu görselleştiren use-case diyagramı.*

### 4.6.4. Uçtan uca akış

Tipik yol şöyledir: vitrinde gezinme, hesap oluşturma veya giriş, sepete ekleme, teslimat bilgisi girip siparişi gönderme; sunucuda tek veritabanı işleminde sipariş ve stok güncellemesi; ardından müşteri profilinden takip, satıcı panelinden kalem bazlı izleme, gerektiğinde yönetici müdahalesi.

[FOTOĞRAF EKLE]*Şekil 4.15 – Basitleştirilmiş aktivite diyagramı.*

---

## 4.7. Güvenlik, günlük ve hata yönetimi

Helmet ve CORS birlikte yüzeyi daraltır; gövde boyutu ve hız sınırı kaynak tüketimini kontrol altında tutar; JWT ve yenileme jetonu oturumu taşır. Winston ve isteğe bağlı Seq merkezi günlük görüntüleme sunar; SystemLog kritik işlemlerin izini bırakmak için kullanılabilir. Öngörülmeyen sunucu hataları tek yerde yakalanır; istemci tarafında success ve hata kodu alanları tutarlı tutulursa arayüz kodu sade kalır. Ürün yorumlarında isVerified gibi bayraklar güveni artırmak için vardır; moderasyon ihtiyacı platform büyüdükçe artar.

[FOTOĞRAF EKLE]*Şekil 4.16 – Geliştirici araçlarında güvenlik başlıkları.*

---

## 4.8. Monorepo, kod yapısı ve mimari perspektif

Arka uçta her iş alanı src/api altında kendi klasöründe durur; ön yüzde işlevler features, ortak parçalar shared içinde toplanır. Üç uygulama aynı REST sözleşmesini paylaştığı için gelecekte /api/v1 gibi sürüm önekleri gündeme gelebilir. Tek parça storebackend geliştirmesi basit başlar; ayrık servisler ise dağıtım ve tutarlılık açısından daha ağır ama ölçekte esnek olabilir. RabbitMQ ile sipariş sonrası bildirim gibi işleri API cevabından ayırmak mümkündür.

[FOTOĞRAF EKLE]*Şekil 4.17 – IDE’de src/api ağacı.*

---

## 4.9. Performans, ölçek, risk ve test

Sık filtrelenecek alanlarda veritabanı indeksleri, listelerde sayfalama, statik dosyalar için CDN ve görsellerde WebP gibi hafif formatlar performansı iyileştirir. Okuma replikası ve Redis stratejisi trafik arttıkça değerlendirilebilir. Başlıca riskler arasında jeton sızıntısı, stok yarışı, Redis kesintisi ve sınırsız dosya yüklemesi sayılabilir; her biri için kod ve altyapı tarafında karşı önlem alınabilir. Otomatik test kaplaması sınırlıysa en azından kritik sipariş akışı ve yetkilendirme için entegrasyon testleri eklemek ileride teknik borcu azaltır; Prisma tabanlı testler, supertest ile HTTP testleri ve React Testing Library ile arayüz testleri bu iş için uygundur.

---

## 4.10. Derleme, Docker ve dağıtım

### 4.10.1. Üretim derlemesi

Vite build komutu ön yüz varlıklarını paketler; API adresi gibi değerler VITE_ ile başlayan ortam değişkenleriyle ortam bazlı ayrılır.

[FOTOĞRAF EKLE]*Şekil 4.18 – Derleme çıktısı veya dist klasörü.*

### 4.10.2. Docker Compose

Kökteki docker-compose.yml veritabanını, Redis’i, Seq’ü, MinIO’yu, storebackend’i ve üç ön yüz geliştirme konteynerini bir arada ayağa kaldırmak için kullanılabilir. Üretim ve mikroservis varyantları ayrı dosyalarda tanımlıdır.

[FOTOĞRAF EKLE]*Şekil 4.19 – Çalışan konteynerlerin listesi.*

### 4.10.3. Ortam değişkenleri ve üretim güvenliği

Örnek şifre ve JWT sırları yalnızca yerel denemeye yöneliktir; canlı ortamda güçlü sırlar ve kasa yazılımı kullanılmalı, CORS listesi gerçek alan adlarıyla sınırlandırılmalı, Seq gibi yönetim arayüzleri dış dünyadan korunmalıdır.

---

## 4.11. REST ve örnek sözleşme

Kaynak adresleri çoğul isimle düzenlenmiştir. İstemci hatası, yetkisizlik, bulunamadı ve başarılı oluşturma durumları uygun HTTP kodlarıyla ayrılır. Sipariş isteğinde ürün listesi ve teslimat adresi beklenir; başarılı yanıtta sipariş nesnesi döner. İleride OpenAPI şeması ile uçların dokümante edilmesi bakımı kolaylaştırır.

---

## 4.12. Sürüm kontrol

Kaynak kod Git ile izlenir; özellik dalları ve birleştirme geçmişi tez ekinde özetlenebilir.

[FOTOĞRAF EKLE]*Şekil 4.20 – Git istemcisi veya uzak depo görünümü.*

---

## 4.13. Bölüm özeti

Bu bölümde Fuira E-Commerce’in uygulama gerçekliği, seçilen yığın, veri modeli, storebackend mimarisi, üç istemci ve tipik ticari akışlar bağlamında özetlendi. Bir sonraki bölümde çalışmanın sonuçları ve ileriye dönük öneriler yer almaktadır.

---

# 5. SONUÇ VE ÖNERİLER

## 5.1. Genel değerlendirme

Çalışma kapsamında çok satıcılı bir e-ticaret deneyimi üç ayrı web arayüzü ve tek REST API çatısı altında toplanmıştır. Ön yüzde React ve TypeScript ile Vite kullanımı geliştirme hızı ve bakım kolaylığı açısından uygun görülmüştür. Arka uçta Express ve Prisma birlikteliği, şemanın kodla birlikte ilerlemesine ve veri tutarlılığının korunmasına katkı sağlamıştır.

[FOTOĞRAF EKLE]*Şekil 5.1 – Üç uygulamayı bir arada gösteren özet görsel.*

## 5.2. Hedeflere ulaşma düzeyi

| Hedef | Gerçekleşme |
|--------|----------------|
| Çok satıcılı katalog ve sipariş | Merchant, ürün ve kalemlerde satıcı bağlantısı |
| Rol ayrımı | Müşteri, satıcı ve yönetici kimlik yolları |
| Medya | MinIO ve görüntü işleme hattı |
| Güvenlik | Başlık, CORS, hız limiti, jeton, sanitize |
| Katalog | Kategori, özellik ve filtre meta verisi |

Gerçek ödeme ağ geçidi veya kargo entegrasyonu bu tez prototipinde yer almayabilir; varsa veya yoksa bunu sonuç kısmında dürüstçe yazmak gerekir.

## 5.3. Karşılaşılabilecek zorluklar

Aynı ürüne eşzamanlı talep geldiğinde stok tutarlılığı özel ilgi ister. Redis, veritabanı ve dosya sunucusunu birlikte taşımak operasyon becerisi ister. Liste uçları büyüdükçe indeks ve önbellek planı yapılmalıdır.

## 5.4. Kısıtlılıklar

Anlatım tek monolit API etrafında döner; services klasöründeki ayrı süreçler tüm özellikler için birebir paralel çalışmayabilir. Test otomasyonu sınırlı kalırsa bu bir sonraki dönemin borcu olarak kayda geçmelidir. Ödeme ve kişisel veri mevzuatı canlı ürün için hukuk ve düzenlemelerle birlikte ele alınmalıdır.

## 5.5. Gelecek çalışmalar

Gerçek ödeme kurumu bağlantısı ve webhook ile durum senkronu; e-posta veya SMS ile sipariş bildirimi ve RabbitMQ tüketicileri; gelişmiş arama; mobil uygulama; API ağ geçidiyle servis ayrımı; sürekli entegrasyon ve canlı izleme altyapısı öne çıkan başlıklardır.

## 5.6. Etik ve yasal hususlar

Kişisel veriler KVKK çerçevesinde işlenmelidir; kart verisi mümkünse doğrudan saklanmamalı, yetkili sağlayıcı ve tokenization kullanılmalıdır. Kullanım koşulları ve çerez bilgilendirmesi platformun hukuki zemini için gereklidir.

[FOTOĞRAF EKLE]*Şekil 5.2 – Örnek gizlilik veya çerez bildirimi.*

## 5.7. Sonuç

Fuira E-Commerce, modern web teknolojileriyle çok paydaşlı bir pazar yerinin nasıl inşa edilebileceğini somutlaştırır. Mevcut yapı hem geliştirme hem öğrenme için anlamlı bir çıpa sunar; önerilen adımlar izlendiğinde ticari kullanıma yaklaşmak mümkündür.

---

## Ek notlar

Başlıklar en fazla üç seviyededir: bölüm başlığı, alt bölüm ve gerektiğinde 4.x.y biçiminde üçüncü düzey. Word’e aktarırken şekil numaralarını kurum şablonunuza göre düzenleyin. [FOTOĞRAF EKLE] satırlarını kaldırıp yerine gerçek görselleri ve şekil adını koyun.
