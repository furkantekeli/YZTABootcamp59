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

#### Tercih Edilen Model: `gemini-3.1-flash-lite`

Projemizde Google Gemini model ailesinden **Gemini 3.1 Flash Lite** modeli tercih edilmiştir. Bu tercihin gerekçeleri şunlardır:

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
* **Dün Neler Yapıldı:** Proje deposu oluşturuldu, yerel dizinler hazırlandı.
* **Bugün Neler Yapılacak:** Docker Compose altyapısı (PostgreSQL, Backend, Frontend, Nginx) ayağa kaldırılacak, veritabanı modelleri ve migration'lar tanımlanacak. JWT tabanlı kullanıcı kayıt/giriş sistemi geliştirilecek.
* **Engelleyici Faktörler (Blocker):** Yok.

#### Gün 2
* **Dün Neler Yapıldı:** Altyapı, veritabanı şeması ve kullanıcı yönetim sistemi tamamlandı.
* **Bugün Neler Yapılacak:** yfinance entegrasyonu yapılacak. Portföy CRUD (ekleme, silme, güncelleme) endpoint'leri yazılacak, alım-satım işlem kayıtları (Transaction) ve kâr/zarar (realized/unrealized P&L) hesaplama motoru geliştirilecek.
* **Engelleyici Faktörler (Blocker):** Yok.

#### Gün 3
* **Dün Neler Yapıldı:** Portföy yönetimi ve işlem kayıt backend motoru tamamlandı.
* **Bugün Neler Yapılacak:** Vite + React 19 ile frontend arayüzleri tasarlanacak. Dashboard, portföy ekranı, işlemler sayfası oluşturulacak ve ApexCharts ile candlestick/dağılım grafikleri entegre edilecek.
* **Engelleyici Faktörler (Blocker):** Yok.

#### Gün 4
* **Dün Neler Yapıldı:** Frontend arayüzü ve grafik entegrasyonları tamamlandı.
* **Bugün Neler Yapılacak:** Google Gemini entegrasyonu yapılarak; Portföy Analisti, Risk Yöneticisi ve Haber Duyarlılık uzman ajanları içeren Multi-Agent orkestrasyon sistemi, konuşma geçmişi (Memory) ve RSS haber sentiment analizi eklenerek proje tamamlanacak.
* **Engelleyici Faktörler (Blocker):** Yok.

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

**⚠️ Yasal Uyarı:** Bu uygulama yatırım tavsiyesi vermez. Yapay zekâ tarafından üretilen yorumlar bilgilendirme amaçlıdır ve yatırım kararı olarak değerlendimilmelidir.
