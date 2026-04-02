# 4. ARAŞTIRMA SONUÇLARI VE TARTIŞMA

Bu bölümde geliştirilen Fuira E-Commerce platformunun performansına ilişkin gözlemler, Docker tabanlı dağıtım ortamında kaynak kullanımı, önbellekleme ve günlükleme altyapısı bağlamında tartışılmaktadır. Sistem, üretimde birincil olarak tek birleşik Node.js API sunucusu olan storebackend üzerinden işler; depoda ayrıca auth, ürün ve sipariş için mikroservis iskeletleri bulunmakla birlikte bu tez kapsamındaki ölçümler ve gözlemler esas olarak geliştirme ortamında çalıştırılan docker-compose yapılandırması ve storebackend üzerinden yürütülmüştür. Aşağıdaki alt başlıklarda yanıt süreleri, veri katmanının rolü, Redis önbelleği, konteyner kaynakları ve Compose orkestrasyonunun katkıları ile merkezi günlük izleme ele alınmaktadır.

---

## 4.1. Performans analizi ve metrik değerlendirmesi

Dağıtık veya katmanlı mimarilerde sistemin algılanan hızı, yalnızca uygulama kodunun verimliliğiyle değil, ağ gecikmesi, veritabanı bağlantısı ve ilk istekte soğuk başlatma gibi dış etkilerle de şekillenir. Bu çalışmada Fuira platformunun uçtan uca davranışı, geliştirme makinesinde Postman veya benzeri HTTP istemcileri ile gönderilen istekler üzerinden gözlemlenmiş; yanıt süreleri milisaniye bazında yorumlanmıştır. Temel performans göstergeleri olarak uçtan uca gecikme, yanıt gövdesinin indirilmesi ve mümkün olduğunda ilk bayta kadar geçen süre dikkate alınmıştır. Elde edilen değerler kesin üretim SLA’sı yerine, prototip ve geliştirme ortamı için tipik bir tablo sunar; canlı ortamda aynı testlerin yük altında tekrarlanması önerilir.

### 4.1.1. API ve servis bazlı yanıt süreleri

storebackend Express uygulaması olarak çalışır; istemciden gelen talepler önce güvenlik ve gövde sınırlaması gibi ara katmanlardan geçer, ardından ilgili controller ve Prisma sorgularına ulaşır. Kimlik doğrulama uçları JWT üretimi ve bcrypt ile parola doğrulaması içerdiğinden, giriş istekleri saf liste okuma işlemlerine göre daha uzun sürebilir. Postman zaman çizelgesinde görülen toplam sürenin büyük kısmı genellikle ilk bayta kadar beklenen süreye denk gelir; bu süre konteynerin o anki yükü, veritabanı bağlantı havuzunun durumu ve sorgunun karmaşıklığı ile ölçeklenir. İndirme aşaması ise küçük JSON yanıtlarında birkaç milisaniye düzeyinde kalır, bu da üretilen erişim jetonunun gövde boyutunun makul olduğunu gösterir. Soğuk başlatma sonrası ilk istekte sürenin belirgin şekilde uzaması beklenen bir davranıştır; tekrarlayan isteklerde bağlantı havuzu ısındıkça süreler genelde kısalma eğilimindedir.

Şekil 4.1: Postman veya benzeri araçla storebackend kimlik doğrulama veya sağlık uç noktasına gönderilen örnek istek ve zaman çizelgesi.

Şekil 4.1’de sunulan örnek ölçümde toplam yanıt süresinin büyük bölümünün ilk bayta kadar geçen süre oluşturduğu görülebilir. Bu dağılım, geliştirme ortamında tek makinede çalışan konteynerler ve yerel veritabanı gecikmesinin birlikte etkisini yansıtır. Kesin rakamlar donanım, işletim sistemi yükü ve eşzamanlı işlem sayısına göre değişeceğinden, tez metninde kendi ölçümünüzün ekran görüntüsü ve tarihi ile birlikte verilmesi uygun olur.

### 4.1.2. Veri katmanı ve PostgreSQL odaklı tutarlılık

Fuira’nın kalıcı iş verisi PostgreSQL üzerinde Prisma şeması ile modellenmiştir. İlişkisel model, sipariş ve stok gibi işlemlerde ACID özelliklerinden yararlanmayı mümkün kılar; özellikle sipariş oluşturma akışında transaction bloğu ile sipariş kaydı ve stok güncellemesinin birlikte başarılı veya birlikte geri alınması bu tutarlılığa dayanır. Karmaşık listeleme ve raporlama sorgularında birleştirme ve sayfalama maliyeti artabilir; bu nedenle sık kullanılan filtre alanlarında indeksleme ve gerektiğinde okuma yönünden önbellekleme gündeme gelir. Projede ürün özellikleri ve kategori filtre meta verisi şema ve JSON alanları ile desteklendiğinden, tek bir motor üzerinden hem yapılandırılmış hem yarı yapılandırılmış veri taşınabilir; bu durum “tek veritabanı motoru altında çoklu veri ihtiyacı” şeklinde yorumlanabilir. Ayrı mikroservis şemalarında farklı Postgres örnekleri düşünülebilse de bu tez anlatımında birincil yük tek veritabanı örneğindedir.

### 4.1.3. Önbellekleme stratejisinin performans katkısı

Sistemde Redis istemcisi kullanılmaktadır. Kullanıcıya özel koleksiyon listeleri gibi sık okunan, nispeten az değişen veya kısa süreli tutulması kabul edilebilir veriler Redis üzerinde anahtar-değer biçiminde saklanarak PostgreSQL üzerindeki okuma yükü azaltılabilir. Oturum veya hız sınırlama sayaçları için de bellek tabanlı depo uygun düşer. Önbellekte tutulan verinin kaynağı ile tutarsızlaşmaması için güncelleme veya süre sonu politikaları netleştirilmelidir; aksi halde kullanıcı eski kategori listesini görebilir. Bu tez kapsamında Redis’in varlığı, mimarinin ölçek büyüdükçe okuma trafiğini yatayda rahatlatma potansiyelini göstermektedir.

---

## 4.2. Ölçeklenebilirlik ve kaynak yönetimi bulguları

Artan eşzamanlı kullanıcı sayısına karşı sistemin performansını koruması, yalnızca uygulama kodunun ölçeklenmesiyle değil, veritabanı, önbellek ve dosya sunucusunun kapasitesiyle de bağlantılıdır. Fuira’da docker-compose ile her bileşen ayrı konteyner olarak çalıştırılabildiğinden, geliştirme ve deneme ortamında kaynakların servis bazında izlenmesi mümkündür. Bu bölümde konteynerlerin bellek ve işlemci ayak izine dair niteliksel gözlemler ile Compose’un başlatma sırası ve ağ yapılandırmasının operasyonel faydası özetlenmektedir.

### 4.2.1. Konteyner bazlı kaynak tüketimi

Geliştirme ortamında Docker Desktop üzerinden PostgreSQL, Redis, Seq, MinIO, storebackend ve üç adet Vite tabanlı ön yüz konteyneri ile isteğe bağlı nginx gibi bileşenler birlikte çalıştırılabilir. Node.js tabanlı storebackend süreci, istek başına bellek kullanımı ve olay döngüsü özellikleri nedeniyle .NET veya JVM tabanlı süreçlerden farklı bir profil çizer; boşta düşük, ani trafikte kısa süreli yükselişler görülebilir. PostgreSQL konteyneri sorgu yüküyle birlikte bellek tüketimini artırır. Seq günlük arayüzü ve depolaması ek bellek ve disk kullanır. MinIO nesne depolama için çalışır; yoğun dosya trafiğinde ağ ve disk gecikmesi belirleyici olur. Redis genelde düşük bellek ayak iziyle önbellek rolünü üstlenir. Bu tablo, monolitik tek süreçte tüm bu rollerin aynı süreçte birleşmesine kıyasla, konteyner izolasyonunun kaynakları görünür kıldığını ve ihtiyaç halinde seçilen bileşenin ayrı ölçeklendirilmesine zemin hazırladığını göstermektedir.

Şekil 4.2: Docker Desktop veya docker stats çıktısı ile konteyner bazlı CPU ve bellek kullanımı.

Şekil 4.2’de yer alan sayısal değerler, ölçüm anındaki makine yükü ve eşzamanlı işlemlerle doğrudan ilişkilidir; tezde kendi ekran görüntünüz ve donanım özeti ile sunmanız tutarlılık sağlar. Elasticsearch veya vektör veritabanı bu projede docker-compose ana dosyasında yer almadığından, ağır bellek tüketen arama katmanı bu yapılandırmada varsayılan değildir; ileride tam metin arama veya öneri motoru eklendiğinde kaynak planlaması buna göre güncellenmelidir.

### 4.2.2. Docker Compose orkestrasyon verimliliği

Çok bileşenli sistemlerde servisleri tek tek elle başlatmak hem sıra hatalarına hem de bağlantı reddi mesajlarına yol açabilir. Fuira’nın docker-compose.yml dosyasında storebackend, veritabanı, Redis, Seq ve MinIO arasında bağımlılık zinciri depends_on ile kısmen yönetilir; böylece arka uç, kritik altyapı konteynerleri ayakta olmadan önce başlatılmaya çalışılmaz. Servisler varsayılan köprü ağı üzerinde birbirlerine konteyner adlarıyla erişebildiğinden, istemci tarafında sabit IP yazmak gerekmez. Tüm yığını tek komutla kaldırıp indirmek, geliştirme ve demo ortamlarında tekrarlanabilirlik sağlar ve altyapıyı kod ile tanımlama anlamında Infrastructure as Code yaklaşımına yaklaştırır.

Şekil 4.3: docker-compose.yml dosyasında depends_on ve servis adlarıyla ağ içi erişimin gösterimi.

Yapılandırmada üretim sırlarının örnek değerlerle bırakılmaması, CORS ve JWT anahtarlarının canlı ortamda sıkılaştırılması gerektiği unutulmamalıdır. Compose geliştirme kolaylığı sunarken, üretimde orchestrator ve sırlar yönetimi ayrıca ele alınmalıdır.

---

## 4.3. Sistem izleme, yönetim ve gözlemlenebilirlik altyapısı

Dağıtık veya çok konteynerli yapılarda hataları tek log dosyasında aramak zorlaşır. Bu projede Node tarafında Winston ile yapılandırılmış günlük çıktısı ve Seq ile merkezi günlük görüntüleme düşünülmüştür; storebackend ortam değişkenleri Seq adresine işaret edebilir. HTTP istek günlüğü ara katmanı, hangi uç noktaya hangi sürede yanıt verildiğini izlemeyi kolaylaştırır. Veri modelinde SystemLog benzeri bir tablo ile iş olaylarının kalıcı izi tutulabilir. Tam teşekküllü bir gözlemlenebilirlik yığını için ileride Prometheus, Grafana veya iz düşümü toplayıcılar eklenebilir; ancak bu tez kapsamındaki uygulamada temel ihtiyaç, hata ayıklama ve denetim izi için merkezi günlük ve yapılandırılmış kayıt düzeyindedir.

### 4.3.1. Merkezi günlük ve erişim pratikleri

Seq, geliştirme makinesinde tarayıcı üzerinden açılabilen bir arayüz sunar ve log akışını sorgulanabilir kılar. Fuira’da çok sayıda servis farklı portlarda çalıştığından, geliştirici dokümantasyonunda hangi adresin hangi arayüze karşılık geldiğinin listelenmesi operasyonel hızı artırır. Nginx ön uçta yönlendirme yaptığında tek giriş noktasından arka uca iletim sağlanabilir. Bu bölümde Homer veya Portainer gibi ayrı paneller zorunlu tutulmamıştır; ihtiyaç halinde aynı Compose dosyasına eklenebilir.

Şekil 4.4: Seq arayüzünde örnek log akışı veya storebackend kaynaklı hata ve bilgi kayıtları.

Özetle, Fuira E-Commerce’in gözlemlenebilirlik tarafı öncelikle uygulama günlükleri ve Seq ile merkezi görüntüleme üzerinden kurgulanmış; mikroservis iskeletleri ve ileride eklenecek metrik toplayıcılar sistemin büyümesiyle genişletilebilir niteliktedir.

---

## Ek not

Bu bölümdeki performans rakamları ve kaynak kullanım yüzdeleri, kendi test ortamınızda ürettiğiniz ekran görüntüleri ile desteklenmelidir. Örnek metinlerde yer alan süre ve megabayt değerleri yer tutucu niteliğindedir; jüri önünde gerçek ölçüm verilerinizi göstermeniz gerekir.
