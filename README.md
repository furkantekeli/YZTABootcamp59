# AI Destekli Portföy Takip Sistemi

Bu proje, kullanıcıların borsa ve yatırım portföylerini takip edebileceği, alım-satım işlemlerini kaydedebileceği, kâr-zarar durumunu görebileceği ve yapay zekâ desteğiyle portföyünü yorumlatabileceği bir sistem olarak tasarlanmıştır.

## Proje Amacı

Geleneksel portföy takip uygulamaları genellikle sadece kullanıcıya sayı ve grafik gösterir. Bu projenin amacı ise sadece veri göstermek değil, aynı zamanda bu verileri yorumlayan ve kullanıcıya anlamlı geri bildirimler sunan bir sistem geliştirmektir.

Sistem; kullanıcının portföy performansını analiz eder, risk durumunu yorumlar, kâr-zarar bilgisini gösterir ve yapay zekâ yardımıyla yatırım kararlarını daha anlaşılır hale getirir.

## Temel Özellikler

- Kullanıcı kayıt ve giriş sistemi
- Hisse senedi ekleme ve çıkarma
- Alım-satım işlemlerini kaydetme
- Ortalama maliyet hesaplama
- Anlık veya manuel fiyat bilgisiyle portföy değeri hesaplama
- Kâr-zarar takibi
- Toplam portföy performansı
- Grafiklerle portföy analizi
- AI destekli portföy yorumu
- Risk analizi
- Haber ve piyasa etkisi değerlendirme
- Kullanıcıya öneri ve uyarılar sunma

## AI Özelliği

Projede yapay zekâ sadece sohbet eden bir sistem olarak kullanılmaz. AI sistemi, kullanıcının portföy verilerini analiz ederek daha anlamlı yorumlar üretir.

Örneğin:

- Hangi hissede ne kadar kâr veya zarar var?
- Portföy çok riskli mi?
- Belirli bir hisseye fazla ağırlık verilmiş mi?
- Güncel piyasa haberleri portföyü etkileyebilir mi?
- Kullanıcı uzun vadeli mi yoksa kısa vadeli mi hareket etmeli?
- Portföy daha dengeli hale nasıl getirilebilir?

AI sistemi bu sorulara göre kullanıcıya açıklayıcı ve anlaşılır yorumlar sunar.

## Kullanım Senaryosu

Kullanıcı sisteme giriş yaptıktan sonra sahip olduğu hisseleri portföyüne ekler. Her hisse için alış fiyatı, lot miktarı ve alış tarihi gibi bilgiler girilir.

Sistem bu veriler üzerinden kullanıcının toplam yatırım tutarını, güncel portföy değerini ve kâr-zarar durumunu hesaplar.

Daha sonra kullanıcı isterse AI analiz bölümüne girerek portföyü hakkında yorum alabilir. Yapay zekâ, kullanıcının portföyünü değerlendirir ve risk, performans, dağılım ve olası fırsatlar hakkında yorum yapar.

## Hedef Kullanıcılar

Bu proje özellikle borsa yatırımı yapan bireysel kullanıcılar için geliştirilmiştir.

Hedef kullanıcılar:

- Borsaya yeni başlayan yatırımcılar
- Portföyünü düzenli takip etmek isteyen kullanıcılar
- Kâr-zarar durumunu kolay görmek isteyen kişiler
- Yatırımlarını AI desteğiyle analiz etmek isteyen kullanıcılar
- Finansal kararlarını daha bilinçli almak isteyen bireyler

## Kullanılabilecek Teknolojiler

Projede aşağıdaki teknolojiler kullanılabilir:

### Frontend

- React
- HTML
- CSS
- JavaScript

### Backend

- Node.js / Express.js  
veya  
- Python / FastAPI

### Veritabanı

- PostgreSQL
- MySQL
- MongoDB

### Yapay Zekâ

- OpenAI API
- Portföy analiz algoritmaları
- Haber analizi
- Risk değerlendirme sistemi

### Ek Servisler

- Borsa fiyat verisi API’si
- Finans haberleri API’si
- Grafik kütüphaneleri

## Sistem Modülleri

### 1. Kullanıcı Modülü

Kullanıcıların kayıt olmasını, giriş yapmasını ve kendi portföylerini güvenli şekilde yönetmesini sağlar.

### 2. Portföy Modülü

Kullanıcıların hisse senedi eklemesini, silmesini ve portföy detaylarını görüntülemesini sağlar.

### 3. İşlem Takip Modülü

Alım ve satım işlemleri bu bölümde tutulur. Sistem bu işlemlere göre ortalama maliyet ve kâr-zarar hesaplaması yapar.

### 4. Analiz Modülü

Portföyün genel durumu grafikler ve sayısal verilerle gösterilir.

### 5. AI Yorumlama Modülü

Yapay zekâ, kullanıcının portföyünü analiz ederek yorumlar üretir. Risk, dağılım, kâr-zarar ve piyasa durumu hakkında açıklamalar sunar.

### 6. Haber Analiz Modülü

Finans haberleri takip edilerek kullanıcının portföyündeki hisselerle ilgili gelişmeler analiz edilir.
