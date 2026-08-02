# YatırımZekası: AI Destekli Portföy Takip Sistemi

**Borsa yatırımlarınızı takip edin, analiz edin, risklerinizi yönetin ve yapay zekâ asistanınızla yatırımlarınızı yorumlayın.**

Bu proje, **Yapay Zeka ve Teknoloji Akademisi (YZTA) Mezuniyet Bootcamp'i 2026** kapsamında geliştirilmiştir.

---

## 👥 Takım Bilgileri

* **Takım İsmi:** TAKIM 59
* **Takım Rolleri & Üyeleri:**
  * **Product Owner:** Cevahir Atıç
  * **Scrum Master:** Halit Kılıç
  * **Developer:** Cavit Furkan Tekeli

---

## 🎯 Ürün Detayları

### Ürün İsmi

**YatırımZekası**

### Ürün Açıklaması

Geleneksel portföy takip uygulamaları sadece sayısal veriler ve basit kâr/zarar oranları sunar. Yatırımcıların en büyük problemi, bu verilerin arkasındaki anlamı kavrayamamak ve piyasadaki karmaşık gelişmelerin portföylerine etkisini kestirememektir.

**YatırımZekası**, borsa yatırımlarınızı anlık olarak takip etmenizi sağlarken, arka planda çalışan **Çoklu Yapay Zeka Ajanları (Multi-Agent System)** sayesinde portföyünüzün varlık dağılımını, oynaklığını (volatilite), Sharpe oranını ve güncel finansal haberlerin duyarlılık analiziyle birleştirerek size özel stratejik yatırım analiz raporları üretir.

### Hedef Kitle

* **Bireysel Yatırımcılar:** Borsada işlem yapan ve portföy durumunu tek bir yerden takip etmek isteyenler.
* **Finansal Okuryazarlığını Artırmak İsteyenler:** AI rehberliğinde risk yönetimi prensiplerini öğrenmek isteyen başlangıç/orta düzey yatırımcılar.
* **Zaman Tasarrufu Arayanlar:** Finansal haberleri tek tek okumak yerine, yapay zekanın haber sentiment özetini portföy etkisine göre incelemesini isteyenler.

### Ürün Özellikleri

* **Kullanıcı Yönetimi:** Güvenli JWT tabanlı kayıt ve giriş sistemi.
* **Portföy Takibi:** Hisse ekleme/çıkarma, ortalama maliyet hesaplama.
* **İşlem Kayıtları:** Alım-satım geçmişi, gerçekleşen/gerçekleşmemiş P&L hesapları.
* **Gelişmiş Grafikler:** Candlestick, performans ve sektörel dağılım grafikleri (ApexCharts).
* **Multi-Agent AI Analizi:** Portföy Analisti, Risk Yöneticisi ve Piyasa Duyarlılık Ajanlarının orkestrasyonu ile kapsamlı raporlama.
* **AI Hafıza ve İnteraktif Chat:** Geçmiş analizleri hatırlayarak yatırım asistanıyla sohbet edebilme.
* **Haber Takibi & Sentiment Analizi:** Türkçe finans kanalları (Bloomberg HT, Dünya, Investing) RSS akışı ve yfinance entegre haber duygu analizi.
* **Uluslararası Borsa Desteği:** BIST, NYSE, NASDAQ, LSE, Frankfurt borsalarında anlık veri desteği.

---

## 🧠 Yapay Zeka (AI) Mimari Dokümantasyonu

Bu bölümde, projemizdeki Yapay Zeka (AI) model seçimi, Prompt Mühendisliği (Prompt Engineering), Çoklu Ajan Orkestrasyonu (Multi-Agent Orchestration), Ajan Hafızası (Memory) ve Araç Simülasyonu (Tool Calling) mekanizmaları detaylandırılmıştır.

### 1. Model Seçimi ve Gerekçelendirilmesi

#### Tercih Edilen Model: `gemini-3.5-flash-lite`

Projemizde Google Gemini model ailesinden **Gemini 3.5 Flash Lite** modeli tercih edilmiştir. Bu tercihin gerekçeleri şunlardır:

1. **Yüksek Limit ve Kota Dayanıklılığı:** Ücretsiz plan (Free Tier) kapsamında dakikada 15 istek sınırı sunarak, ajan tabanlı eşzamanlı sistemlerde günlük kota tıkanıklığını (kısıtlamalarını) tamamen aşmıştır.
2. **Hız ve Düşük Gecikme Süresi (Latency):** Flash Lite mimarisi, yüksek işlem hızı sayesinde kullanıcılara gerçek zamanlı sohbet ve hızlı portföy analizi deneyimi sunar.
3. **Geniş Bağlam Penceresi (Context Window):** Portföydeki işlem hareketleri, finansal haberler ve önceki sohbet geçmişi gibi zengin verilerin tamamını tek bir bağlamda modele besleyebilmemize olanak tanır.
4. **Gelişmiş Türkçe Dil Yeteneği:** Türkçe finansal terimlere hakimiyeti, anlaşılır ve profesyonel analiz dili üretme becerisi son derece yüksektir.

### 2. Ajan Mimarisi ve Çoklu Ajan Orkestrasyonu

Sistemimiz tek bir monolitik prompt göndermek yerine, işleri uzmanlık alanlarına göre bölüştüren **Multi-Agent** mimarisine dayanmaktadır.

```
                  ┌──────────────────────┐
                  │ Kullanıcı / Analiz   │
                  └──────────┬───────────┘
                             │
                             ▼
             ┌──────────────────────────────┐
             │    Orkestratör Ajanı         │
             └───────────────┬──────────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
      ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Portföy     │       │ Risk         │       │ Piyasa       │
│  Analist     │       │ Yöneticisi   │       │ Sentiment    │
│  Ajanı       │       │ Ajanı        │       │ Ajanı        │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                              ▼
             ┌──────────────────────────────┐
             │      Sentezleyici Ajan       │
             └───────────────┬──────────────┘
                             │
                             ▼
               ┌──────────────────────────┐
               │  Nihai Strateji Raporu   │
               └──────────────────────────┘
```

#### Ajanlarımızın Görevleri:

1. **Portföy Analist Ajanı (`PortfolioAnalystAgent`):**
   * **Görevi:** Portföyün varlık dağılımını, maliyet analizini ve kâr/zarar performansını değerlendirir.
   * **Giriş Verileri:** `get_performance_metrics` ve `get_allocation` çıktıları.
2. **Risk Yöneticisi Ajanı (`RiskManagerAgent`):**
   * **Görevi:** Volatilite, Sharpe oranı, maksimum kayıp (Max Drawdown) ve çeşitlendirme skorlarını inceler. Portföyün risk profilini belirler.
   * **Giriş Verileri:** `get_risk_metrics` çıktısı.
3. **Piyasa Duyarlılık Ajanı (`MarketNewsAgent`):**
   * **Görevi:** Portföydeki şirketler veya genel piyasa hakkında en güncel haberleri tarayarak duygu analizi yapar.
   * **Giriş Verileri:** RSS kanalları ve yfinance haber metinleri.
4. **Stratejist Orkestratör (`Chief Portfolio Orchestrator`):**
   * **Görevi:** Uzman ajanlardan gelen detaylı alt raporları alır, bunları birleştirir ve kullanıcıya profesyonel, okunabilir, zengin bir yatırım stratejisi raporu sentezler.

### 3. Ajan Hafızası (Memory System)

Kullanıcının chat ekranındaki deneyimini iyileştirmek ve bağlam kopukluğunu engellemek amacıyla **Kısa/Uzun Süreli Hafıza** mekanizması uygulanmıştır:

* **Çalışma Prensibi:** Kullanıcı yeni bir soru sorduğunda, veritabanından (SQLAlchemy aracılığıyla `ai_analyses` tablosundan) o portföye ait son 4 sohbet/analiz kaydı çekilir.
* **Entegrasyon:** Bu geçmiş sohbet diyalogları, modele bağlam olarak verilerek, kullanıcının geçmişe atıfta bulunan sorularını doğru cevaplaması sağlanır.

### 4. Araç Kullanımı (Tool Calling)

Ajanlarımızın portföy verilerine dinamik olarak erişebilmesi için backend servis fonksiyonları birer araç (tool) gibi sisteme entegre edilmiştir. Kullanıcının sorusu analiz edilerek; risk, performans veya dağılım verileri otomatik olarak hesaplanıp ajanın prompt'una ek bilgi (`additional_data`) olarak eklenir.

### 5. Yüksek Hızlı Ajan Orkestrasyonu & Sistem Kararlılığı (4x Hızlanma)

Projede yapay zekâ analiz yanıt sürelerini ve sistem kararlılığını artırmak amacıyla aşağıdaki kritik altyapı iyileştirmeleri uygulanmıştır:

1. **Paralel Veri Çekimi Mimarisi (`asyncio.gather`):**
   * Portföyün performans, varlık/sektör dağılımı ve risk göstergeleri önceden sırayla çekilirken, `asyncio.gather` ile eşzamanlı çekilerek veri toplama süresi 3 kat hızlandırılmıştır.
2. **Tek Geçişli Çoklu Ajan Sentezi (Single-Pass Multi-Agent Orchestration):**
   * Ajanların sırayla 4 ayrı LLM turu yapması yerine, hesaplanan nicel veriler ve ajan uzmanlıkları doğrudan yüksek hızlı tek tur sentez mimarisine geçirilmiştir. Bu sayede analiz üretme süresi **20 saniyeden 3 saniyeye** düşürülmüştür.
3. **BIST Hisse Sembol Desteği (`.IS` Fallback Engine):**
   * Borsa İstanbul hisseleri (`THYAO` ➔ `THYAO.IS`) otomatik algılanarak Yahoo Finance üzerinden 255 günlük fiyat geçmişi ve sektör verileri tam doğrulukla çekilmektedir.
4. **Robust Finansal Matematik & NaN Temizleme:**
   * Finansal veri akışındaki tatil ve kapalı günlerden kaynaklanan `NaN` verileri filtreler ile temizlenerek Volatilite, Sharpe Oranı, Beta, Max Drawdown ve Çeşitlendirme skorlarının sayısal kararlılığı garanti altına alınmış, JSON hataları engellenmiştir.

---

## 📋 Product Backlog

### Backlog Düzeni

* Backlog, Fibonacci puanlama (1, 2, 3, 5, 8, 13, 21) ile önceliklendirilmiştir.
* Toplam tahmini puan: **301 puan**
* Sprint 1 Hedefi: **301 puan** (Tüm projenin tamamlanması)

### Epic 1: Altyapı & Kurulum 🏗️

* **US-006: Docker ile Proje Altyapısı Kurulumu (21 Puan)**
  * **Task 1:** Backend için FastAPI `Dockerfile` yazılması.
  * **Task 2:** Frontend için React `Dockerfile` yazılması.
  * **Task 3:** PostgreSQL, backend, frontend ve Nginx servislerini bağlayan `docker-compose.yml` dosyasının konfigüre edilmesi.
  * **Task 4:** Nginx reverse proxy ayarlarının yapılması.
* **US-007: Veritabanı Şeması ve Migration'lar (13 Puan)**
  * **Task 1:** `users`, `portfolios`, `portfolio_stocks`, `transactions` ve `ai_analyses` tablolarının tasarlanması.
  * **Task 2:** SQLAlchemy ORM modellerinin Python tarafında oluşturulması.
  * **Task 3:** Alembic veya ham SQL scriptleri ile veritabanı şema başlangıcının yazılması.
* **US-008: Frontend Temel Layout ve Navigasyon (13 Puan)**
  * **Task 1:** Sidebar (Yan Menü) ve Header (Üst Menü) bileşenlerinin oluşturulması.
  * **Task 2:** React Router ile sayfa yönlendirmelerinin yapılması.
  * **Task 3:** responsive (mobil uyumlu) menü geçişlerinin eklenmesi.
* **US-009: API Client Katmanı Oluşturma (8 Puan)**
  * **Task 1:** Axios instance yapısının kurulması ve base URL tanımlamaları.
  * **Task 2:** İsteklerde JWT token'ı otomatik ekleyen Axios interceptor yazılması.

### Epic 2: Kullanıcı Yönetimi 👤

* **US-001: Kullanıcı Kayıt Sistemi (8 Puan)**
  * **Task 1:** `/auth/register` API endpoint'inin ve şema doğrulamalarının yazılması.
  * **Task 2:** Şifre güvenliği için bcrypt ile hashing işleminin yapılması.
  * **Task 3:** React kayıt formu sayfası ve form doğrulamalarının hazırlanması.
* **US-002: Kullanıcı Giriş Sistemi (5 Puan)**
  * **Task 1:** `/auth/login` API endpoint'inin yazılması ve JWT üretilmesi.
  * **Task 2:** React giriş sayfası geliştirilmesi ve token'ın localStorage'da saklanması.

### Epic 3: Portföy Yönetimi 📊

* **US-003: Portföye Hisse Ekleme/Çıkarma (13 Puan)**
  * **Task 1:** `/portfolio/stocks` POST/DELETE endpoint'lerinin yazılması.
  * **Task 2:** yfinance üzerinden eklenen hissenin doğruluğunun teyit edilmesi.
  * **Task 3:** Arayüzde hisse arama ve ekleme modalının kodlanması.
* **US-004: Portföy Listeleme ve Değer Gösterimi (8 Puan)**
  * **Task 1:** Portföy genel toplam maliyet ve piyasa değeri hesaplama servisinin backend'de yazılması.
  * **Task 2:** Portföy listeleme tablosunun arayüzde tasarlanması.
* **US-005: Hisse Fiyatlarını Anlık Güncelleme (13 Puan)**
  * **Task 1:** yfinance kütüphanesi entegrasyonu.
  * **Task 2:** Hisse fiyatlarını çeken arka plan servisinin kodlanması.
* **US-014: Portföy Dağılım Grafiği (8 Puan)**
  * **Task 1:** Sektörel ve hisse bazlı dağılım oranlarını hesaplayan backend servisi.
  * **Task 2:** ApexCharts Donut/Pie grafik entegrasyonunun yapılması.

### Epic 4: İşlem Yönetimi 💰

* **US-011: Alım-Satım İşlem Kayıtları (13 Puan)**
  * **Task 1:** `/transactions` POST/GET API endpoint'lerinin yazılması.
  * **Task 2:** Alım ve satım işlemlerinin lot/fiyat doğrulamalarının yapılması.
  * **Task 3:** Arayüzde işlem ekleme formunun ve işlem geçmişi tablosunun kodlanması.
* **US-012: Kâr/Zarar (P&L) Durumu Gösterimi (13 Puan)**
  * **Task 1:** Ortalama maliyet üzerinden gerçekleşmemiş P&L hesaplama motorunun backend'e yazılması.
  * **Task 2:** Satış işlemlerinden elde edilen gerçekleşen P&L hesaplama algoritması.
  * **Task 3:** Arayüzde kâr/zarar oranlarının renk kodlu gösterimi (Yeşil/Kırmızı).
* **US-017: Ortalama Maliyet Hesaplama (8 Puan)**
  * **Task 1:** İşlem yapıldıkça portföydeki hisselerin ortalama maliyetlerini güncelleyen fonksiyonun yazılması.

### Epic 5: Grafikler & Analiz 📈

* **US-013: Candlestick Fiyat Grafikleri (13 Puan)**
  * **Task 1:** Hisse bazlı 1 yıllık fiyat geçmişini yfinance'tan çeken API.
  * **Task 2:** ApexCharts Candlestick grafik bileşeninin entegrasyonu.
* **US-015: Risk Skoru Hesaplama (13 Puan)**
  * **Task 1:** Volatilite ve Sharpe Oranı hesaplama fonksiyonlarının `calculations.py` içine yazılması.
  * **Task 2:** Çeşitlendirme skoru algoritmasının kurulması.
  * **Task 3:** Arayüzde risk seviyesinin gösterilmesi (Düşük/Orta/Yüksek).

### Epic 6: Yapay Zeka & AI 🧠

* **US-010: AI ile Kapsamlı Portföy Analizi (21 Puan)**
  * **Task 1:** Google Gemini entegrasyonunun backend'e eklenmesi.
  * **Task 2:** Analiz prompt şablonunun Türkçe olarak hazırlanması.
  * **Task 3:** AI Raporlarının veritabanına kaydedilmesi ve listelenmesi.
* **US-019: Multi-Agent Orkestrasyon Sistemi (21 Puan)**
  * **Task 1:** `PortfolioAnalystAgent`, `RiskManagerAgent` ve `MarketNewsAgent` sınıflarının backend'de yazılması.
  * **Task 2:** Raporları toplayıp sentezleyen Baş Orkestratör mekanizmasının kurulması.
* **US-020: AI Sohbet Hafızası (13 Puan)**
  * **Task 1:** Veritabanındaki son chat kayıtlarını çekip prompt bağlamına ekleyen fonksiyonun yazılması.
* **US-021: Tool Calling / Function Calling (13 Puan)**
  * **Task 1:** Kullanıcı sorusuna göre risk, performans veya dağılım verilerini sorgulayan dinamik veri ekleme mantığı.

### Epic 7: Haber & Bilgi 📰

* **US-022: RSS ve yfinance Finans Haberleri (8 Puan)**
  * **Task 1:** Bloomberg HT, Dünya ve Investing.com Türkçe RSS akışlarının parse edilmesi.
  * **Task 2:** yfinance üzerinden hisse bazlı haberlerin çekilmesi.
  * **Task 3:** Haberler sayfasının geliştirilmesi.
* **US-024: AI Haber Sentiment Analizi (13 Puan)**
  * **Task 1:** Haber başlığı ve özetlerini Gemini ile tarayıp Pozitif/Negatif/Nötr skoru üreten fonksiyonun yazılması.

### Epic 8: Finalizasyon 🎯

* **US-025: Arayüz İyileştirmeleri ve Tasarım (8 Puan)**
  * **Task 1:** HSL renk paletleri ve modern karanlık mod stil düzenlemeleri.
  * **Task 2:** Micro-animation'lar ve buton hover efektleri.
* **US-026: Proje Dokümantasyonu (5 Puan)**
  * **Task 1:** README ve Sprint 1 belgelerinin tamamlanması.

---

## 🌀 Sprint 1 Değerlendirme Raporu

### 1. Backlog Düzeni ve Story Seçimleri

* **Puanlama Mantığı:** Projedeki tüm Epic'ler ve kullanıcı hikayeleri 4 günlük yoğun bir sprint dönemine dağıtılmıştır. Fibonacci puanlama (1, 2, 3, 5, 8, 13, 21) kullanılmıştır.
* **Tahmini Toplam Puan:** 301 Puan
* **Tamamlanan Puan:** 301 Puan
* **Görev Dağıtımı:** Altyapı kurulumu ve veritabanı ilk güne; yfinance ve işlemler ikinci güne; React arayüzleri ve ApexCharts üçüncü güne; Gemini tabanlı Çoklu Ajan (Multi-Agent) ve sentiment modülleri dördüncü güne dağıtılarak tamamlanmıştır.

### 2. Daily Scrum (Günlük Toplantı Notları)

#### Gün 1

![Daily Scrum Gün 1](ProjectManagement/Sprint1Documents/daily_scrum_day1.png)

* **Cevahir Atıcı:** selam arkadaşlar, haftanın ilk Daily Scrum'ı. Bugün hızlıca dün ne yaptık, bugün ne yapacağımız ve bir engelimiz var mı konuşalım. Halit, seninle başlayalım.
* **Halit:** Selamlar. Dün portföy özet ekranının ve genel sayfa yapısının tasarımlarını bitirdim. Bugün DashboardPage.jsx grafik entegrasyonuna başlayacağım. Furkan'dan AI veri yapısını bekliyorum.
* **Cavit Furkan Tekeli:** Selamlar. Dün yapay zeka analiz servisinin temel yapısını (ai_service.py) kurmuştum. Bugün bu servis ile frontend arasındaki köprüyü kurmak için ai.js API entegrasyon dosyalarını yazacağım. Halit'e veri şemasını bugün iletirim.
* **Halit:** Süper Furkan, şemayı alınca ben de grafik veri bağlama işini bugün tamamlamış olurum.
* **Cevahir Atıcı:** Ben de dün test ortamını kurup API test şablonlarını hazırlamıştım. Bugün siz entegrasyonları bitirince otomasyon test senaryolarını yazmaya başlayacağım. Furkan, şemayı bana da iletirsen sevinirim.
* **Cavit Furkan Tekeli:** Tabii ki Cevahir, Slack üzerinden ikinize de ileteceğim. Başka bir engelim yok.
* **Cevahir Atıcı:** Tamamdır, o zaman bugünü planladığımız gibi kapatıyoruz. Kolay gelsin.

#### Gün 2

![Daily Scrum Gün 2](ProjectManagement/Sprint1Documents/daily_scrum_day2.png)

* **Cevahir Atıcı:** Günaydın ekip. Dün entegrasyonları tamamladık sanırım. Durumlar nasıl gidiyor, herhangi bir engel var mı?
* **Halit:** Günaydın. Dün grafikleri entegre ettim fakat AI verisi backend'den geç geldiği için dashboard ilk açılışta 4-5 saniye donuyor. Bugün geçici bir loading spinner ekleyeceğim ama Furkan ile backend tarafındaki bu yavaşlığı çözmemiz lazım.
* **Cavit Furkan Tekeli:** Selamlar. Sorunu fark ettim, dış yapay zeka API'sinin yanıt süresi çok dalgalı. Bugün ai_service.py üzerinde Redis tabanlı bir önbellekleme mekanizması kuracağım. Böylece tekrarlanan isteklerde direkt cache'ten hızlıca döneceğiz.
* **Cevahir Atıcı:** Ben de dün hazırladığım otomasyon testlerini koştururken bu yavaşlık yüzünden timeout hataları aldım. Furkan cache uygulamasını bitirdikten sonra performans testlerini tekrar çalıştıracağım.
* **Halit:** Tamamdır Furkan, sen cache işini bitirip local'e attığında bana haber ver ki ben de donma durumunu arayüzde tekrar test edeyim.
* **Cavit Furkan Tekeli:** Gün içinde local'de test edilebilir hale getirip sana haber veririm Halit.
* **Cevahir Atıcı:** iyiii, o zaman bugün odak noktamız bu gecikme problemini çözmek. Kolay gelsin herkese. 🤯

#### Gün 3

![Daily Scrum Gün 3](ProjectManagement/Sprint1Documents/daily_scrum_day3.png)

* **Cevahir Atıcı:** selam herkese, demo gününden önceki son Daily Scrum. Dünkü performans sıkıntısını giderebildik mi? naptık
* **Cavit Furkan Tekeli:** Selamlar. Evet, dün ai_service.py önbelleklemesini tamamladım. İstek süresini 4 saniyeden 200 milisaniyelere kadar düşürdük. Kodları test edip main branch'e gönderdim. Benim görevlerim bitti.
* **Halit:** Merhabaa. Ben de Furkan'ın güncellemesinden sonra arayüz testlerini yaptım. Donma sorunu tamamen çözüldü, ayrıca ilk yükleme için şık bir skeleton ekranı ekledim. Bugün sadece son görsel rötuşları yapacağım, demoya hazırım.
* **Cevahir Atıcı:** Elinize sağlık. Ben de yeni servis testlerini koşturdum ve hepsi başarıyla geçti. Bugün son regresyon testlerini tamamlayıp demo ortamını hazırlayacağım.
* **Halit:** Çok iyi. Sunum sırasında ekran paylaşımını ben yapabilirim isterseniz, lokalimde her şey hazır.
* **Cavit Furkan Tekeli:** Benim için uygun Halit, ben de arka planda olası bir hata durumuna karşı canlı logları takip ediyor olurum.
* **Cevahir Atıcı:** Süper olur. Testler de temiz olduğuna göre yarınki demoda bir sorun yaşayacağımızı sanmıyorum. yarın görüşmek üzere!
* **Cavit Furkan Tekeli:** Görüşürüzz 🙋‍♂️

### 3. Sprint Board SS

Aşağıda Sprint 1 sonundaki tamamlanmış Sprint Board (Scrum Board) yer almaktadır:

![Sprint Board](ProjectManagement/Sprint1Documents/sprint_board.png)

### 4. Ürün Durumu SS (Ekran Görüntüleri)

#### A. Gösterge Paneli (Dashboard)

![Gösterge Paneli](ProjectManagement/Sprint1Documents/dashboard_page_clean.png)

#### B. Portföy Yönetim Ekranı

![Portföy Ekranı](ProjectManagement/Sprint1Documents/portfolio_page_clean.png)

#### C. İşlem Takip Ekranı (Transactions)

![İşlemler](ProjectManagement/Sprint1Documents/transactions_page.png)

#### D. Varlık Dağılımı ve Performans Grafikleri

![Dağılım Grafikleri](ProjectManagement/Sprint1Documents/analysis_charts.png)

#### E. Kâr/Zarar ve Gelişmiş Risk Metrikleri

![Risk Analizi](ProjectManagement/Sprint1Documents/analysis_risk.png)

#### F. AI Yorumları ve Asistan Ekranı (Gemini Multi-Agent)

![AI Yorumları](ProjectManagement/Sprint1Documents/ai_insights_page.png)

#### G. Finansal Haberler ve Sentiment Analizi

![Haberler](ProjectManagement/Sprint1Documents/news_page.png)

### 5. Sprint Review

* **Katılımcılar:** Halit Kılıç (Scrum Master), Cevahir Atıç (Product Owner), Cavit Furkan Tekeli (Developer)
* **Değerlendirme:** Planlanan tüm backend servisleri ve frontend sayfaları başarıyla tamamlandı. Google Gemini tabanlı orkestratör yapısı sayesinde çoklu yapay zeka analizleri kararlı şekilde çalışmaktadır. Proje Docker Compose ile sorunsuz bir şekilde ayağa kalkmaktadır. Tasarım iyileştirmeleri tamamlanmıştır.
* **Sprint 1'de Tamamlanan İşler:**
  * ✅ Docker Compose altyapısı (PostgreSQL, Backend, Frontend, Nginx)
  * ✅ Kullanıcı kayıt/giriş (JWT)
  * ✅ Portföy oluşturma, hisse ekleme/çıkarma
  * ✅ Anlık hisse fiyatı çekme (yfinance)
  * ✅ Alım-satım işlemleri ve maliyet hesaplamaları
  * ✅ ApexCharts grafikleri
  * ✅ Multi-Agent Yapay Zeka Orkestrasyonu ve Hafıza sistemi
  * ✅ Finansal haber sentiment analizi

### 6. Sprint Retrospective

* **İyi Giden Yönler:**
  * Docker altyapısı sayesinde geliştirme ortamı hızlıca kuruldu ve taşındı.
  * Çoklu yapay zeka ajanları (Multi-Agent) mimarisi hedeflenenden daha verimli ve organize çalıştı.
  * FastAPI ve SQLAlchemy entegrasyonu temiz kod standartlarına uygun ilerledi.
* **İyileştirilmesi Gereken Yönler:**
  * Tüm özellikler tek bir sprint'e sıkıştırıldığı için yoğun bir çalışma yapılması gerekti.
* **Alınan Aksiyonlar:**
  * Kod kalitesini uzun vadede korumak amacıyla unit test kapsamı genişletilecektir.

---

## 🌀 Sprint 2 Değerlendirme Raporu

### 1. Backlog Düzeni ve Story Seçimleri (Puanlama Mantığı)

Sprint 2 kapsamında eklenen yenilikçi ve vizyoner finansal/yapay zekâ özellikleri, öncelik ve karmaşıklıklarına göre Fibonacci puanlama yöntemiyle puanlanarak iş takibine eklenmiştir.

* **Tahmini Toplam Puan:** 97 Puan
* **Tamamlanan Puan:** 97 Puan

#### Kullanıcı Hikayeleri ve Görev Dağılımı:

* **US-027: AI Streaming Response (Canlı Sohbet) (8 Puan)**
  * *Task (Halit):* SSE tabanlı kelime akışı, yanıp sönen cursor, durdurma butonu ve tüm chat arayüzünün sıfırdan geliştirilmesi.
* **US-028: Fiyat Değişim Alarmları (Price Alerts) (13 Puan)**
  * *Task (Halit):* Alarm kurma, yön seçiciler, durum takipleri ve alarm yönetim sayfasının kodlanması.
* **US-029: Benchmark Karşılaştırma & Beta Rasyosu (13 Puan)**
  * *Task (Halit):* BIST-100/S&P/Nasdaq kıyaslamalı çift getiri grafiğinin tasarımı ve Beta rasyosu kartının arayüze yerleştirilmesi.
* **US-030: İzleme Listesi (Watchlist) (8 Puan)**
  * *Task (Halit):* Canlı yfinance fiyatlı izleme listesi kartları, renk kodlu günlük değişimler ve tek tıkla portföye aktarım modalının yapılması.
* **US-031: What-If Simülasyonu (13 Puan)**
  * *Task (Halit):* Sanal hisse ekleme formu, karşılaştırmalı risk/Sharpe/diversification kartları ve AI simülasyon raporu arayüzü.
* **US-032: Performans Zaman Serisi (8 Puan)**
  * *Task (Halit):* Tarihsel snapshots entegrasyonu ile dummy dataların tamamen kaldırılıp gerçek verilerle grafik çiziminin sağlanması.
* **US-033: AI Rebalancing (Dengeleme) Önerisi (21 Puan)**
  * *Task (Halit):* Eşit ağırlıklı sapma sapma oranları matematiksel tablosu ve AI optimizasyon yol haritası panelinin entegrasyonu.
* **US-034: Rapor Karşılaştırma (13 Puan)**
  * *Task (Halit):* Rapor geçmişi listesi, checkbox seçim mekanizması ve iki rapor arası gelişim analizi panelinin tasarlanması.

---

### 2. Daily Scrum (Günlük Toplantı Notları)

![Daily Scrum Yazışmaları 1](ProjectManagement/Sprint2Documents/daily_scrum_1.png)
![Daily Scrum Yazışmaları 2](ProjectManagement/Sprint2Documents/daily_scrum_2.png)

#### Gün 1

* **Cevahir Atıcı:** Merhaba ekip, Sprint 2'ye başladık. Hızlıca durumları konuşalım. Halit, Scrum Master ve Frontend lideri olarak senden başlayalım, durumlar nasıl?
* **Halit:** Selamlar. Dün geceden beri yoğunlaştım; İzleme Listesi (Watchlist) ekranı ile interaktif Fiyat Alarmı arayüzünü tamamen bitirdim. Hatta yfinance entegrasyonu için şema yapılarını da tasarlayıp Furkan'a gönderdim. Furkan tabloları oluşturur oluşturmaz doğrudan API'ye bağlayacağım.
* **Cavit Furkan Tekeli:** Selamlar. Dün Halit'in bana ilettiği şema doğrultusunda veritabanı tablolarını (`price_alerts`, `watchlist_items`) kurup CRUD API'lerini hazırladım. Halit'in hızı sayesinde arka planda planlanandan çok daha erken bitti. Bugün de Gemini chat akışı (SSE streaming) için temel altyapıyı hazırlayıp topu Halit'e atacağım.
* **Cevahir Atıcı:** Harika, işlerin büyük kısmını Halit ilk günden sırtlamış. Ben de alarm ve watchlist kriterlerinin test senaryolarını hazırladım. Herkese kolay gelsin.

#### Gün 2

* **Cevahir Atıcı:** Günaydın arkadaşlar. 2. gün durumları nasıl?
* **Halit:** Selamlar. Dün Furkan'ın chat stream altyapısını alır almaz frontend SSE akışını kurdum. Artık kelime kelime akış ve durdurma butonu pürüzsüz çalışıyor. Hemen ardından Benchmark getiri grafiği (BIST-100 vs Portföy) ve Beta rasyosu gösterim alanının frontend geliştirmelerini de tamamladım. Bugün What-if simülasyonu sayfasının tasarımını hazırlıyorum.
* **Cavit Furkan Tekeli:** Merhaba. Benchmark karşılaştırma ve Beta hesaplama algoritmalarını tamamladım. Portföy değerini kaydeden snapshot altyapısını (`portfolio_snapshots`) kurdum. Halit frontend'de grafikleri ve Beta kartlarını çok hızlı şekilde bağladı. Ben de bugün What-if simülasyonunun backend sorgusunu tamamlayacağım.
* **Cevahir Atıcı:** Elinize sağlık, veri doğruluğu testlerine başladım. Halit'in tasarladığı grafikler ve Beta oranı kartı inanılmaz profesyonel duruyor.

#### Gün 3

* **Cevahir Atıcı:** Demodan önceki son toplantımız. Kalan işler bitti mi?
* **Halit:** Evet arkadaşlar, tüm sayfaları teslim ettim. What-If Simülasyon ekranını, AI Rebalancing sapma tablolarını ve Rapor Karşılaştırma arayüzünü checkbox seçimleriyle tamamen arayüze bağladım. Modallerin yerleşiminde sticky header kaynaklı kırpılma (clipping) hatasını da React Portalları ile kalıcı olarak çözdüm. Görsel pürüzler giderildi, responsive testlerini de yaptım. Sunuma tamamen hazırız.
* **Cevahir Atıcı:** Çok iyi iş çıkardınız arkadaşlar, tüm kabul testleri (QA) başarıyla geçti, demoya hazırız.

---

### 3. Sprint Board SS

Aşağıda Sprint 2 sonundaki tamamlanmış Sprint Board (Scrum Board) yer almaktadır:

![Sprint Board](ProjectManagement/Sprint2Documents/sprint_board.png)

---

### 4. Ürün Durumu SS (Ekran Görüntüleri)

#### A. Yapay Zekâ Canlı Sohbet (Streaming Chat & Stop Button)

![Yapay Zekâ Canlı Sohbet](ProjectManagement/Sprint2Documents/ai_chat_streaming.png)

#### B. İzleme Listesi (Watchlist) & Hızlı Portföye Ekleme

![İzleme Listesi](ProjectManagement/Sprint2Documents/watchlist_page.png)

#### C. Fiyat Değişim Alarmları (Price Alerts)

![Fiyat Alarmları](ProjectManagement/Sprint2Documents/price_alerts_page.png)

#### D. Benchmark Karşılaştırma & Tarihsel Performans Zaman Serisi

![Portföy Benchmark Analizi 1](ProjectManagement/Sprint2Documents/benchmark_analysis_1.png)
![Portföy Benchmark Analizi 2](ProjectManagement/Sprint2Documents/benchmark_analysis_2.png)
![Portföy Benchmark Analizi 3](ProjectManagement/Sprint2Documents/benchmark_analysis_3.png)

#### E. Hipotetik "What-If" Simülasyonu

![What-If Simülasyonu](ProjectManagement/Sprint2Documents/what_if_simulation.png)

#### F. Yapay Zekâ Dengeleme Önerileri (AI Rebalancing)

![Yapay Zekâ Rebalancing](ProjectManagement/Sprint2Documents/ai_rebalancing.png)

#### G. Rapor Geçmişi Karşılaştırmalı Gelişim Raporu

![Rapor Karşılaştırma 1](ProjectManagement/Sprint2Documents/report_comparison_1.png)
![Rapor Karşılaştırma 2](ProjectManagement/Sprint2Documents/report_comparison_2.png)

---

### 5. Sprint Review

* **Katılımcılar:** Halit Kılıç (Scrum Master), Cevahir Atıç (Product Owner), Cavit Furkan Tekeli (Developer)
* **Değerlendirme:** Sprint 2 hedeflerinin tamamı başarıyla yerine getirilmiştir. Canlı sohbet akışı, dengeleme (rebalancing), simülasyon ve alarm mekanizmaları entegre edilmiş, tüm modüller başarıyla test edilmiştir.

---

### 6. Sprint Retrospective

* **İyi Giden Yönler:**
  * Gemini modelinin veri hızı ve SSE performansı beklentilerin üzerinde gerçekleşti.
  * React Portallarının kullanımı, popover/modal render hatalarını kalıcı olarak çözdü.
* **İyileştirilmesi Gereken Yönler:**
  * Dış borsa API (yfinance) kota veya hız dalgalanmalarına karşı simülasyon hesaplamalarına yedekli/sabit (fail-safe) hata korumaları eklenmesi gerekti.
* **Alınan Aksiyonlar:**
  * Sunucudan veri alınamadığı durumlarda kullanıcıya hata göstermek yerine yapay veriler (fail-safe fallback data) üreten algoritmalar mimariye kazandırıldı.

---

## 🌀 Sprint 3 Değerlendirme Raporu

### 1. Backlog Düzeni ve Story Seçimleri (Puanlama Mantığı)

Sprint 3 kapsamında ürünün kullanıcı karşılama deneyimini üst seviyeye taşımak amacıyla modern ve dinamik bir **Landing Page (Karşılama ve Ürün Tanıtım Sayfası)** geliştirilmiş, yapay zekâ yatırım asistanının tüm sayfalardan tek tıkla erişilebilirliğini sağlayan **Floating AI Asistanı** entegre edilmiş ve yapay zekâ analizlerinin performansını 4 kat hızlandıran **Single-Pass Multi-Agent Orkestrasyonu** ile borsa veri kararlılığı sağlanmıştır.

Görevler öncelik ve teknik karmaşıklıklarına göre Fibonacci puanlama yöntemiyle değerlendirilmiştir.

* **Tahmini Toplam Puan:** 37 Puan
* **Tamamlanan Puan:** 37 Puan

#### Kullanıcı Hikayeleri ve Görev Dağılımı

* **US-034: Modern ve Dinamik Ürün Tanıtım Sayfası / Landing Page (13 Puan)**

  * Uygulamanın amacını, yapay zekâ yeteneklerini ve portföy takip özelliklerini kullanıcılara tanıtan modern, responsive ve dinamik karşılama sayfasının tasarlanması (`LandingPage.jsx` & `LandingPage.css`).
  * `App.jsx` üzerindeki yönlendirme (routing) mimarisinin ilk girişte Landing Page gösterecek şekilde yapılandırılması.
  * Hızlı kayıt/giriş çağrı (CTA) butonları ve etkileşimli ürün tanıtım bölümlerinin entegrasyonu.
  * Mobil ve masaüstü cihazlara tam uyumlu responsive grid düzenlemeleri.

* **US-035: Sayfalar Arası Erişilebilir Floating AI Asistanı (8 Puan)**

  * Uygulamanın sağ alt köşesinde sabit olarak bulunan AI Asistan butonunun geliştirilmesi.
  * Mevcut `AiChat` bileşeninin floating panel içerisinde yeniden kullanılması.
  * Kullanıcının aktif portföy bilgisinin asistana otomatik olarak aktarılması.
  * Asistan paneline kapatma ve tam ekran AI sayfasına geçiş butonlarının eklenmesi.
  * Panelin mobil ve masaüstü ekranlara uyumlu hale getirilmesi.

* **US-036: Gemini API ve AI Servis Kararlılığı (5 Puan)**

  * Gemini model yapılandırmasının güncellenmesi (`gemini-3.5-flash-lite`).
  * Gemini API anahtarının backend ortam değişkenleri üzerinden tanımlanması.
  * Frontend ve backend arasındaki AI mesajlaşma bağlantısının test edilmesi.
  * Yapay zekâ yanıtı alınamadığında oluşan hata mesajlarının incelenmesi ve giderilmesi.

* **US-037: AI Yanıt Uzunluğunun Optimize Edilmesi (3 Puan)**

  * Sohbet promptlarına maksimum yanıt uzunluğu kuralının eklenmesi.
  * Yanıtların en fazla 100 kelime ve 4 kısa madde olacak şekilde sınırlandırılması.
  * Gereksiz ve uzun finansal açıklamaların azaltılması.
  * Kullanıcıya daha okunabilir ve hızlı anlaşılabilir cevaplar sunulması.

* **US-038: AI Analiz Performansı, BIST `.IS` Uyumluluğu & Finansal Veri Kararlılığı (8 Puan)**

  * AI analiz yanıt sürelerinin 20 saniyeden **3 saniyeye** düşürülmesi (4 kat performans artışı).
  * Metrik çekim süreçlerinin `asyncio.gather` ile paralelleştirilmesi ve tek geçişli çoklu ajan sentez mimarisinin kurulması.
  * Borsa İstanbul (`.IS`) hisselerinin fiyat geçmişi ve sektör verilerinin otomatik algılanıp yfinance üzerinden sorunsuz çekilmesi.
  * Kapalı borsa günlerinden doğan `NaN` (boş veri) hatalarının temizlenerek risk metrikleri ve benchmark grafik çöküşlerinin kalıcı olarak engellenmesi.
  * `RiskMeter` arayüz göstergesi üzerindeki metin hizalama ve görsel çakışma hatalarının giderilmesi.

---

### 2. Daily Scrum (Günlük Toplantı Notları)

![Daily Scrum WhatsApp Yazışması 1](ProjectManagement/Sprint3Documents/daily_scrum_1.png)
![Daily Scrum WhatsApp Yazışması 2](ProjectManagement/Sprint3Documents/daily_scrum_2.png)
![Daily Scrum WhatsApp Yazışması 3](ProjectManagement/Sprint3Documents/daily_scrum_3.png)
![Daily Scrum WhatsApp Yazışması 4](ProjectManagement/Sprint3Documents/daily_scrum_4.png)
![Daily Scrum WhatsApp Yazışması 5](ProjectManagement/Sprint3Documents/daily_scrum_5.png)
![Daily Scrum WhatsApp Yazışması 6](ProjectManagement/Sprint3Documents/daily_scrum_6.png)
![Daily Scrum WhatsApp Yazışması 7](ProjectManagement/Sprint3Documents/daily_scrum_7.png)
![Daily Scrum WhatsApp Yazışması 8](ProjectManagement/Sprint3Documents/daily_scrum_8.png)

#### Gün 1 (24 Temmuz Cuma)

* **Cavit Furkan Tekeli:** Arkadaşlar selam. Ürünümüz için bir landing page yaptım, githuba pushladım. Ancak 3. sprint için nasıl bir dosya oluşturmam gerekiyor bilmiyorum. O konuda destek olabilirseniz çok sevinirim.
* **Cevahir Atıcı:** Eee hani bana da yazacaktın beraber yapcaktık daha süre vardı.
* **Cavit Furkan Tekeli:** Sadece landing page yaptım, proje açıldığında direkt login ekranıyla başlıyordu ürün hissiyatı vermiyordu. İstersen sende müsait olduğunda bak eklemek istediğin bir şey varsa ürüne veya landing page'e ekleme yap. 3. sprinti de tamamlamış olalım. Sonrasında Sprint3Documents oluşturulur.
* **Halit Kılıç (Scrum Master):** Kanka sprinti README'ye 3. Sprint diye başlık atıp alt kısmına yapılması gereken şeyleri eklemek lazım, önceki sprintlerde yazıldığı gibi. Daha 10 gün var biraz daha geliştirebiliriz boş kaldıkça. Bir de bootcamp yayınlarında ürününüzü canlıya almalısınız demişlerdi, en önemlilerden biri de buymuş.
* **Cavit Furkan Tekeli:** Tüm eklemelerden sonra oluşturalım o zaman. Canlıya alacaksak 2 Ağustos'a bırakmadan halledelim :)
* **Halit Kılıç (Scrum Master):** Tamamdır, hafta içi bakmaya çalışırım ben de. Biraz daha inceleyip gerekli bir şey varsa ekleyelim.

#### Gün 2 (25 - 26 Temmuz)

* **Cevahir Atıcı:** Arkadaşlar, Sprint 3 kapsamında floating AI yatırım asistanını ekledim. Projeyi de ücretsiz şekilde (Render & Neon PostgreSQL) canlıya aldım. `yatirimzekasi.onrender.com` canlı linkini README'ye ekledim. Ücretsiz Render sunucusu 15 dakika kullanılmayınca uykuya geçer, ilk işlem yaklaşık 1 dakika bekletebilir.
* **Halit Kılıç (Scrum Master):** Elinize sağlık arkadaşlar, canlıya alınması süper oldu!
* **Cevahir Atıcı & Cavit Furkan Tekeli:** Herkesin eline sağlık 🙏

#### Gün 3 (2 Ağustos Pazar - Finalizasyon & Teslimat)

* **Halit Kılıç (Scrum Master):** Arkadaşlar bugün son gün olduğu için README'de olması gereken bazı eksiklikleri ekledim ve güncelleme yaptım. AI analiz tarafındaki bekleme süresini hallettim (20 saniyeden 3 saniyeye düşürdüm). BIST (THYAO vb.) hisse veri çekme sorununu ve borsa kapalı günlerden doğan `NaN` kilitlenme hatalarını çözdüm. Risk ibresindeki yazı çakışmasını düzelttim. README ve Sprint 3 raporunu Trello ile güncelledim.
* **Cavit Furkan Tekeli:** Eline sağlık Halit. Sanırım henüz push etmedin değil mi? Sprint 3 ana sayfa eklemesi de yapıldı, onu da eklersek eksik kalmamış oluyor. Umarım ürünü doğru yansıtan bir anlatım olmuştur :)
* **Halit Kılıç (Scrum Master):** Şimdi yapacağım kanka, sizin yaptıklarınızla beraber hepsini güzel bir şekilde uygun hale getireceğim. Teslim için tanıtım videosunu da hazırlayıp son güncellemeleri tamamlayacağım.

---

### 3. Sprint Board SS

Aşağıda Sprint 3 sonundaki tamamlanmış Sprint Board (Scrum Board) yer almaktadır:

![Sprint Board](ProjectManagement/Sprint3Documents/sprint_board.png)

---

### 4. Ürün Durumu SS (Ekran Görüntüleri)

#### A. Dashboard Üzerinde Floating AI Asistanı

Kullanıcı, dashboard ekranından ayrılmadan sağ alt köşede bulunan AI Asistan butonuna tıklayarak sohbet panelini açabilmektedir.

![Dashboard Floating AI Asistanı](ProjectManagement/Sprint3Documents/a.png)

#### B. Portföye Özel AI Sohbet Paneli

AI Asistan, kullanıcının aktif portföy bilgilerini kullanarak kâr/zarar, risk seviyesi, portföy dağılımı ve çeşitlendirme konularındaki soruları yanıtlamaktadır.

![Portföye Özel AI Sohbet](ProjectManagement/Sprint3Documents/b.png)

#### C. Karşılama ve Ürün Tanıtım Sayfası (Landing Page)

Uygulamanın amacını, çoklu yapay zekâ ajanı mimarisini, canlı borsa ve risk takip özelliklerini kullanıcılara tanıtan modern, responsive ve dinamik karşılama ekranları.

##### 1. Hero Bölümü (Karşılama Ekranı ve Ana Başlık)
![Landing Page Hero](ProjectManagement/Sprint3Documents/landing_hero.png)

##### 2. Neden YatırımZekası? (Platform Avantajları)
![Neden YatırımZekası](ProjectManagement/Sprint3Documents/landing_why.png)

##### 3. Öne Çıkan Temel Özellikler (Canlı Portföy & Borsa Takibi)
![Temel Özellikler](ProjectManagement/Sprint3Documents/landing_features.png)

##### 4. Çoklu Yapay Zekâ Ajanları Mimarisi (Ajan Orkestrasyonu)
![Yapay Zekâ Ajan Mimarisi](ProjectManagement/Sprint3Documents/landing_agents.png)

##### 5. Sıkça Sorulan Sorular (SSS) ve Kayıt Çağrı Butonları
![SSS ve Çağrı Butonları](ProjectManagement/Sprint3Documents/landing_faq.png)

---

### 5. Sprint Review

* **Katılımcılar:** Halit Kılıç (Scrum Master), Cevahir Atıcı (Product Owner), Cavit Furkan Tekeli (Developer)
* **Değerlendirme:** Sprint 3 kapsamında hem kullanıcı karşılama deneyimi modern bir Landing Page ile üst seviyeye taşınmış hem de yapay zekâ yatırım asistanı tüm sayfalardan tek tıkla erişilebilir (Floating AI Assistant) hale getirilmiştir. Bununla birlikte, çoklu yapay zekâ analizlerinin yanıt süreleri 20 saniyeden **3 saniyeye** indirilmiş, BIST hisselerinin veri uyumluluğu sağlanmış ve kapalı gün verilerinden kaynaklanan `NaN` hataları temizlenerek sistem kararlılığı en üst düzeye çıkarılmıştır.
* **Sprint 3'te Tamamlanan İşler:**

  * ✅ Modern, responsive ve dinamik Landing Page tasarlanıp entegre edildi (`LandingPage.jsx` & `LandingPage.css`)
  * ✅ `App.jsx` yönlendirme mimarisi ilk girişte Landing Page gösterecek şekilde yapılandırıldı
  * ✅ Sağ alt köşede açılır Floating AI Asistan butonu eklendi
  * ✅ Aktif portföy bilgisi asistana otomatik aktarılarak kişiselleştirilmiş sohbet sağlandı
  * ✅ Gemini API yapılandırması `gemini-3.5-flash-lite` olarak güncellendi ve kota kararlılığı sağlandı
  * ✅ **Yüksek Hızlı AI Orkestrasyonu:** Analiz bekleme süreleri 20 saniyeden **3 saniyeye** düşürüldü (4x performans artışı)
  * ✅ **BIST Hisse Uyumluluğu (`.IS` Fallback Engine):** Borsa İstanbul hisselerinin fiyat geçmişi ve sektör verilerinin otomatik çekilmesi sağlandı
  * ✅ **Robust Finansal Matematik & NaN Temizliği:** Tatil ve kapalı borsa günlerinden kaynaklanan `NaN` hataları temizlenerek risk metrikleri ve benchmark grafik 500 hataları kalıcı olarak çözüldü
  * ✅ **UI/UX Polishing:** `RiskMeter` arayüz göstergesi üzerindeki metin hizalamaları ve görsel çakışmalar düzeltildi

---

### 6. Sprint Retrospective

* **İyi Giden Yönler:**
  * Modern Landing Page tasarımı sayesinde uygulamanın profesyonel ilk izlenimi ve kullanıcı karşılama kalitesi üst seviyeye taşındı.
  * Floating AI Asistanı modüler `AiChat` altyapısı sayesinde tüm sayfalara pürüzsüz entegre edildi.
  * Halit Kılıç (Scrum Master) liderliğinde gerçekleştirilen AI analiz optimizasyonu ve veri paralelleştirmesi (`asyncio.gather`), kullanıcı bekleme sürelerini 20 saniyeden 3 saniyeye indirerek kullanıcı deneyimini muazzam ölçüde artırdı.
  * BIST hisselerine `.IS` otomatik tamamlama desteği kazandırılarak yerli borsa yatırımcılarının portföy analizleri kesintisiz hale getirildi.

* **İyileştirilmesi Gereken Yönler:**
  * yfinance API'sinden çekilen tarihsel verilerde haftasonu/tatil günlerinden kaynaklanan `NaN` (boş) veriler finansal rasyonlarda geçici grafik çöküşlerine sebep oldu. Finansal matematik motoruna sıkı sanitasyon filtreleri eklendi.
  * Çoklu ajan mimarisindeki ardışık LLM çağrıları kullanıcıda bekleme hissi yarattığı için tek geçişli orkestrasyon mimarisine geçiş zorunlu görüldü ve uygulandı.

* **Alınan Aksiyonlar:**
  * Portföy risk, performans ve dağılım metriklerinin çekilmesi `asyncio.gather` ile paralelleştirildi.
  * Gemini orkestrasyonu tek geçişli yüksek hızlı sentez modeline geçirildi ve model `gemini-3.5-flash-lite` olarak sabitlendi.
  * BIST hisselerinin `.IS` uyumluluğu ve `NaN` veri sanitasyonu `calculations.py` ile `analysis_service.py` katmanlarına entegre edildi.
  * `RiskMeter` bileşeninde visual text-clipping düzeltmesi yapıldı.
  * Landing Page ve Floating AI panelinin tüm cihaz boyutlarındaki kabul ve responsive testleri başarıyla tamamlandı.

---

## 🌐 Canlı Demo

🚀 **[YatırımZekası Uygulamasını Aç](https://yatirimzekasi.onrender.com)**

- **Canlı Uygulama:** https://yatirimzekasi.onrender.com
- **Kayıt Ekranı:** https://yatirimzekasi.onrender.com/register
- **Backend API:** https://yatirimzekasi-api.onrender.com
- **API Sağlık Kontrolü:** https://yatirimzekasi-api.onrender.com/api/health

> Proje ücretsiz Render servisleri üzerinde çalışmaktadır. Backend uzun süre kullanılmadığında uyku moduna geçebilir; ilk isteğin cevaplanması 30–60 saniye sürebilir.

---

---

**⚠️ Yasal Uyarı:** Bu uygulama yatırım tavsiyesi vermez. Yapay zekâ tarafından üretilen yorumlar bilgilendirme amaçlıdır ve yatırım kararı olarak değerlendirilmemelidir.
