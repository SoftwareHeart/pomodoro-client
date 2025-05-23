# 🍅 Pomodoro Timer App

Modern ve kullanıcı dostu bir Pomodoro tekniği uygulaması. Verimli çalışma seansları için tasarlanmış, istatistik takibi ve takvim görünümü ile birlikte gelen kapsamlı bir zaman yönetimi aracı.
![image](https://github.com/user-attachments/assets/57a55e7d-c145-4f18-a148-27ed2a4aa5e4)
![image](https://github.com/user-attachments/assets/b15cd637-aff4-4501-a80b-711e62eac45f)
![image](https://github.com/user-attachments/assets/deab92ec-d622-4e86-b745-03866d057c7f)

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Pomodoro Timer**: 25 dakika çalışma, 5 dakika kısa mola, 15 dakika uzun mola
- **Özelleştirilebilir Süreler**: 1-120 dakika arası esnek süre ayarları
- **Görev Yönetimi**: Görev ekleme, düzenleme ve tamamlama
- **Ses Bildirimleri**: Başlangıç ve bitiş ses uyarıları
- **Tarayıcı Bildirimleri**: Desktop notification desteği

### 📊 İstatistik ve Takip
- **Günlük İstatistikler**: Günlük pomodoro sayısı ve çalışma süresi
- **Haftalık Grafikler**: 7 günlük performans trendi
- **Aylık Rapor**: Detaylı aylık analiz
- **Takvim Görünümü**: GitHub-style aktivite takvimi
- **Görev Bazlı Analiz**: Hangi görevde ne kadar zaman harcandığı

### 🎨 Kullanıcı Deneyimi
- **3 Farklı Tema**: Light, Dark, Blue temaları
- **Responsive Design**: Mobil ve desktop uyumlu
- **Progressive Web App**: Offline çalışma desteği
- **Modern UI/UX**: Gradient tasarım ve smooth animasyonlar

### 🔐 Kullanıcı Yönetimi
- **JWT Authentication**: Güvenli kimlik doğrulama
- **Kullanıcı Profili**: Kişisel hesap yönetimi
- **Veri Senkronizasyonu**: Tüm cihazlarda veri senkronizasyonu
- **Misafir Modu**: Kayıt olmadan temel kullanım

## 🛠️ Teknoloji Stack

### Frontend
- **React 18** - Modern React hooks ve functional components
- **React Router** - SPA routing
- **Context API** - Global state management
- **Recharts** - İstatistik grafikleri
- **Axios** - HTTP client
- **CSS3** - Custom CSS with CSS variables
- **Web Workers** - Background timer işlemleri

### Backend (.NET API)
- **ASP.NET Core 8** - Web API framework
- **Entity Framework Core** - ORM
- **SQL Server** - Veritabanı
- **JWT Authentication** - Token-based auth
- **ASP.NET Identity** - Kullanıcı yönetimi
- **AutoMapper** - Object mapping

### Araçlar ve Kütüphaneler
- **React Perfect Scrollbar** - Özel scrollbar
- **React Router DOM** - Client-side routing
- **Date-fns** - Tarih manipülasyonu

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+ 
- .NET 8 SDK
- SQL Server

### Frontend Kurulumu

```bash
# Repository'yi klonlayın
git clone 
cd pomodoro-client

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm start
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

### Backend Kurulumu (.NET API)
Github profilimden klonlayın.
```bash
# API klasörüne gidin
cd PomodoroApi

# Paketleri geri yükleyin
dotnet restore

# Veritabanını güncelleyin
dotnet ef database update

# API'yi başlatın
dotnet run
```

API `https://localhost:7023` adresinde çalışacaktır.

### Veritabanı Yapılandırması

`appsettings.json` dosyasında connection string'i güncelleyin:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=PomodoroDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  }
}
```

## 📱 Kullanım

### Hızlı Başlangıç

1. **Hesap Oluşturun** veya **Misafir Olarak Devam Edin**
2. **Görev Ekleyin** - Çalışmak istediğiniz görevi tanımlayın
3. **Süreyi Ayarlayın** - Standart 25dk veya özel süre seçin
4. **Timer'ı Başlatın** - Focus moduna geçin
5. **Mola Verin** - Otomatik mola bildirimleri

### Gelişmiş Özellikler

- **Tema Değiştirme**: Sağ üst köşeden tema seçin
- **Bildirim Ayarları**: Ses ve görsel bildirimleri özelleştirin
- **Takvim Görünümü**: Günlük aktivitelerinizi takip edin
- **İstatistikler**: Performans analizinizi görüntüleyin

## 🎯 Kullanım Senaryoları

- **Öğrenciler**: Ders çalışma seansları için
- **Freelancer'lar**: Proje yönetimi ve zaman takibi
- **Ofis Çalışanları**: Produktivite artırımı
- **Uzaktan Çalışanlar**: Ev odağını koruma

## 📊 Proje Yapısı

```
pomodoro-timer/
├── public/
│   ├── sounds/           # Bildirim sesleri
│   ├── TimerWorker.js    # Web Worker
│   └── manifest.json     # PWA manifest
├── src/
│   ├── components/       # React bileşenleri
│   ├── contexts/         # Context providers
│   ├── services/         # API servisleri
│   ├── styles/           # CSS dosyaları
│   └── App.js           # Ana uygulama
└── PomodoroApi/         # .NET Backend
    ├── Controllers/     # API controllers
    ├── Models/          # Data models
    ├── Data/           # Entity Framework context
    └── Migrations/     # Database migrations
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 👨‍💻 Geliştirici

**Ertuğrul** - Full Stack Developer
- GitHub: [@SoftwareHeart](https://github.com/SoftwareHeart)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/ertuğrul-kundak/)

## 🙏 Teşekkürler

- [Pomodoro Technique](https://francescocirillo.com/pages/pomodoro-technique) - Francesco Cirillo
- [React](https://reactjs.org/) - Facebook
- [ASP.NET Core](https://dotnet.microsoft.com/apps/aspnet) - Microsoft

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
