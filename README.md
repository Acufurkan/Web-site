# Öz Acu Grup Alüminyum - Backend API

Modern Node.js + MongoDB backend sistemi ile alüminyum ürünleri web sitesi.

## 🚀 Özellikler

- **RESTful API** - Modern API tasarımı
- **MongoDB** - NoSQL veritabanı
- **JWT Authentication** - Güvenli admin girişi
- **Email Notifications** - Otomatik email bildirimleri
- **Rate Limiting** - Spam koruması
- **Input Validation** - Veri doğrulama
- **Error Handling** - Kapsamlı hata yönetimi

## 📋 API Endpoints

### İletişim
- `POST /api/contact` - Yeni mesaj gönder
- `GET /api/contact` - Mesajları listele (Admin)
- `GET /api/contact/:id` - Mesaj detayı
- `PUT /api/contact/:id/status` - Mesaj durumu güncelle
- `DELETE /api/contact/:id` - Mesaj sil

### Ürünler
- `GET /api/products` - Ürünleri listele
- `GET /api/products/categories` - Kategorileri listele
- `GET /api/products/:id` - Ürün detayı
- `POST /api/products` - Yeni ürün (Admin)
- `PUT /api/products/:id` - Ürün güncelle (Admin)
- `DELETE /api/products/:id` - Ürün sil (Admin)

### Admin
- `POST /api/admin/login` - Admin girişi
- `GET /api/admin/dashboard` - Dashboard istatistikleri
- `POST /api/admin/register` - Yeni admin (Admin)
- `GET /api/admin/profile` - Profil bilgileri
- `PUT /api/admin/profile` - Profil güncelle

## 🛠️ Kurulum

### 1. Gereksinimler
- Node.js (v14+)
- MongoDB (v4+)
- Git

### 2. Projeyi Klonlayın
```bash
git clone <repository-url>
cd oz-acu-grup-backend
```

### 3. Bağımlılıkları Yükleyin
```bash
npm install
```

### 4. Environment Variables
```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/oz-acu-grup
JWT_SECRET=your-super-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@ozacugrup.com
```

### 5. MongoDB'yi Başlatın
```bash
# MongoDB servisini başlatın
mongod
```

### 6. Sunucuyu Başlatın
```bash
# Development
npm run dev

# Production
npm start
```

## 📊 Veritabanı Modelleri

### Contact (İletişim)
- name: String (required)
- email: String (required)
- phone: String (optional)
- subject: String (required)
- message: String (required)
- status: Enum ['new', 'read', 'replied', 'closed']
- ipAddress: String
- userAgent: String
- timestamps

### Product (Ürün)
- name: String (required, unique)
- description: String (required)
- category: Enum ['pencere', 'kapı', 'cephe', 'panjur', 'diğer']
- features: [String]
- price: Number
- images: [{url, alt}]
- isActive: Boolean
- specifications: Object
- timestamps

### Admin (Yönetici)
- username: String (required, unique)
- email: String (required, unique)
- password: String (required, hashed)
- role: Enum ['admin', 'moderator']
- isActive: Boolean
- lastLogin: Date
- timestamps

## 🔐 Güvenlik

- **Helmet** - HTTP header güvenliği
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting
- **Input Validation** - Express-validator
- **Password Hashing** - bcryptjs
- **JWT Tokens** - Authentication

## 📧 Email Konfigürasyonu

Gmail için App Password oluşturun:
1. Google Account Settings
2. Security > 2-Step Verification
3. App passwords
4. Generate password for "Mail"

## 🚀 Deployment

### Heroku
```bash
# Heroku CLI kurun
npm install -g heroku

# Login
heroku login

# Create app
heroku create oz-acu-grup-api

# Add MongoDB
heroku addons:create mongolab:sandbox

# Deploy
git push heroku main
```

### DigitalOcean
```bash
# PM2 ile process management
npm install -g pm2

# Start app
pm2 start server.js --name "oz-acu-grup-api"

# Save PM2 config
pm2 save
pm2 startup
```

## 📝 API Kullanım Örnekleri

### Mesaj Gönderme
```javascript
const response = await fetch('http://localhost:5000/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '0555 123 45 67',
    subject: 'Alüminyum Pencere',
    message: 'Merhaba, pencere fiyatları hakkında bilgi almak istiyorum.'
  })
});

const result = await response.json();
console.log(result);
```

### Admin Girişi
```javascript
const response = await fetch('http://localhost:5000/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const result = await response.json();
const token = result.data.token;
```

## 🐛 Hata Ayıklama

### Logs
```bash
# Development logs
npm run dev

# Production logs
pm2 logs oz-acu-grup-api
```

### MongoDB Bağlantısı
```bash
# MongoDB durumunu kontrol et
mongosh
> db.runCommand({ping: 1})
```

## 📈 Performans

- **MongoDB Indexes** - Hızlı sorgular
- **Connection Pooling** - Veritabanı bağlantı yönetimi
- **Caching** - Redis entegrasyonu (opsiyonel)
- **Compression** - Gzip sıkıştırma

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Email:** info@ozacugrup.com
- **Telefon:** +90 312 123 45 67
- **Adres:** Yalınç Caddesi 64/B Altındağ/Ankara
