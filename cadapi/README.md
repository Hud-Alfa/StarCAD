# StarCAD

Doğalgaz iç tesisat projelendirme API'si — **.NET 10 · ASP.NET Core · EF Core (SQL Server) · MinIO · Scalar**.
Geleneksel N-Layer mimari (8 proje).

| Proje | Rol |
|---|---|
| `StarCAD.Api` | Controller'lar, `Program.cs`, Scalar/OpenAPI |
| `StarCAD.Business` | İş servisleri (Manager), FluentValidation, JWT, MinIO |
| `StarCAD.DataAccess` | EF Core (`StarCADContext`, Migrations), MinIO |
| `StarCAD.Entity` / `StarCAD.Core` | POCO entity'ler / temel sınıflar (Result, arayüzler) |
| `StarCAD.ViewModel` / `StarCAD.Common` | DTO'lar / sabitler, mesajlar |
| `StarCAD.Tests` | xUnit + Moq |

---

## İçindekiler

1. [Gereksinimler](#1-gereksinimler)
2. [Hangi kurulum? (karar)](#2-hangi-kurulum-karar)
3. [Ön hazırlık (her iki yolda ortak)](#3-ön-hazırlık-her-iki-yolda-ortak)
4. [Kurulum A — Tamamen Docker](#4-kurulum-a--tamamen-docker)
5. [Kurulum B — API'yi yerelde koştur](#5-kurulum-b--apiyi-yerelde-koştur)
6. [Doğrulama](#6-doğrulama)
7. [Kimlik doğrulama & test kullanıcıları](#7-kimlik-doğrulama--test-kullanıcıları)
8. [Günlük kullanım](#8-günlük-kullanım) · [8.1 Yerel veritabanını sıfırlama](#81-yerel-veritabanını-sıfırlama)
9. [Sorun giderme (SSS)](#9-sorun-giderme-sss)
10. [Yapılandırma notları](#10-yapılandırma-notları)

---

## 1. Gereksinimler

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — SQL Server + MinIO (ve istenirse API) için.
- **Git** — repoyu klonlamak için (+ GitLab erişimi).
- **Yalnızca API'yi yerelde koşturacaksan:** [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
  ve EF CLI: `dotnet tool install --global dotnet-ef`
- **openssl** — şifreleme anahtarı üretmek için. macOS/Linux'ta **yerleşik**; Windows'ta **Git Bash** ile gelir.

> **Kabuk / işletim sistemi notu.** Buradaki komutlar **bash** içindir.
> - **macOS / Linux:** varsayılan terminal (bash/zsh) yeter.
> - **Windows:** komutları **Git Bash**'te çalıştır (`openssl` ve `$(...)` orada çalışır). PowerShell
>   kullanıyorsan anahtar üretme için [alternatif](#32-şifreleme-anahtarları-zorunlu) verilmiştir.
> - `docker` ve `dotnet` komutları her OS/kabukta aynıdır.

---

## 2. Hangi kurulum? (karar)

| Senaryon | Seç | Neden |
|---|---|---|
| İlk kez kuruyorum / hızlıca deneyeceğim / demo | **A — Tamamen Docker** | Tek komut, local'e SQL/MinIO kurmak yok |
| Kod geliştireceğim / debug (breakpoint) / günlük iş | **B — API'yi yerelde koştur** | IDE'de F5, hot reload, debugger |

İkisi de eşit meşru — altyapı (SQL Server + MinIO) **her iki yolda da Docker'da** çalışır; fark sadece
**API'nin** konteynerde mi yoksa yerelde mi koştuğudur.

---

## 3. Ön hazırlık (her iki yolda ortak)

### 3.1 Repoyu klonla
```bash
git clone https://gitlab.tekhnelogos.com/tekhnestars2026/cadapi.git
cd cadapi
```

### 3.2 Şifreleme anahtarları (zorunlu)
Şahıs firma TC kimliği KVKK gereği **şifreli** (AES-GCM) saklanır; benzersizlik için **HMAC**'lenir.
Bu iki anahtar ortamdan gelir — **iki adet base64, 32-byte anahtar** gerekir:

| Çalıştırma | Anahtar nereye konur |
|---|---|
| **A — Docker** | `.env` dosyası (`ENCRYPTION_KEY`, `ENCRYPTION_HMAC_KEY`) — compose bunu okur |
| **B — Yerel** | **user-secrets** (`Encryption:Key`, `Encryption:HmacKey`) |

Anahtar üretme komutu:
- **Git Bash / macOS / Linux:** `openssl rand -base64 32`
- **PowerShell (openssl yoksa):**
  ```powershell
  [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  ```

> ⚠️ **Anahtar sabit kalmalı.** Değişirse o anahtarla şifrelenmiş TC'ler bir daha **çözülemez**.
> Ortam başına (her dev makinesi / sunucu) bir kez üret, sabit tut. Anahtar eksik/geçersizse API
> **açılışta net hata verip durur** (ilk istekte gizemli 500 beklemezsin).

---

## 4. Kurulum A — Tamamen Docker

**1) `.env` hazırla** (repo kökünde). Yoksa şablondan kopyala ve doldur:
```bash
cp .env.example .env      # zaten bir .env varsa atla
```
```ini
# .env
ENCRYPTION_KEY=<openssl rand -base64 32 çıktısı>
ENCRYPTION_HMAC_KEY=<openssl rand -base64 32 çıktısı>
PUBLIC_HOST=              # YEREL: boş bırak (localhost). Ortak sunucuda: sunucu ip/hostname
```

**2) Ayağa kaldır:**
```bash
docker compose up -d --build
```
SQL Server ve MinIO sağlıklı olunca API kalkar. Migration'lar açılışta otomatik uygulanır
(ayrıca `database update` gerekmez).

**Servisler:**

| Servis | Adres | Kimlik |
|---|---|---|
| API | `http://localhost:5193` — Scalar: `/scalar` | — |
| SQL Server | `localhost:1433` | `sa` / `.env → MSSQL_SA_PASSWORD` |
| MinIO S3 | `localhost:29000` | `.env → MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` |
| MinIO konsol | `http://localhost:29001` | `.env → MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` |

> MinIO host portları **29000/29001** (konteyner içi 9000/9001). Ortak bir sunucuda koşuyorsan
> `.env`'e `PUBLIC_HOST=<sunucu ip/hostname>` ekle — yoksa presigned URL `localhost` ile üretilir ve
> başka makinedeki tarayıcı dosyayı indiremez.

→ [6. Doğrulama](#6-doğrulama)'ya geç.

---

## 5. Kurulum B — API'yi yerelde koştur

Altyapı Docker'da, API yerelde (IDE'de debug için).

**1) Altyapıyı kaldır:**
```bash
docker compose up -d sqlserver minio
```

**2) Anahtarları user-secrets'a set et** (`.env` yerel `dotnet run`'a geçmez — bir kez):
```bash
# Git Bash / macOS / Linux:
dotnet user-secrets set "Encryption:Key"     "$(openssl rand -base64 32)" --project StarCAD.Api
dotnet user-secrets set "Encryption:HmacKey" "$(openssl rand -base64 32)" --project StarCAD.Api
```
```powershell
# PowerShell (openssl yoksa):
dotnet user-secrets set "Encryption:Key"     ([Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))) --project StarCAD.Api
dotnet user-secrets set "Encryption:HmacKey" ([Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))) --project StarCAD.Api
```

**3) Veritabanını hazırla:**
```bash
dotnet ef database update --project StarCAD.DataAccess --startup-project StarCAD.Api
```

**4) Çalıştır** (iki yoldan biri):
- **Komut satırı:** `dotnet run --project StarCAD.Api`
- **Visual Studio / Rider:** başlangıç projesi = **`StarCAD.Api`**, profil **`http`** (5193), **F5**.
  → Tarayıcı **otomatik `http://localhost:5193/scalar`'a açılır** (launchSettings ayarı).
  > VS profil menüsünden **`http`** seç; `https` seçersen 7144'te açılır (çalışır ama dev-sertifika uyarısı verebilir).

> **Port çakışması:** Docker'daki `api` ile yereldeki API **aynı anda** 5193'ü ister. Yerelde
> koşacaksan önce: `docker compose stop api`.
>
> **Not:** `dotnet ef` komutları anahtar gerektirmez (design-time host açılışı tetiklemez); anahtar
> yalnız **uygulamayı çalıştırınca** lazım.

---

## 6. Doğrulama

```bash
curl http://localhost:5193/api/health          # 200 dönmeli
```
- Tarayıcıda **`http://localhost:5193/scalar`** — API dokümanı açılır (VS'te F5 ile otomatik gelir).
- Login testi:
  ```bash
  curl -X POST http://localhost:5193/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin1234"}'      # token dönmeli
  ```

---

## 7. Kimlik doğrulama & test kullanıcıları

**API fail-closed'dır:** `[AllowAnonymous]` olmayan her uç token ister. Token'sız `401`, yetkisiz rol `403`.

Seeder (yalnız Development) üç test kullanıcısı oluşturur:

| Kullanıcı | Şifre | Rol | Firma |
|---|---|---|---|
| `admin` | `Admin1234` | `Admin` | — |
| `proje` | `Proje1234` | `ProjectFirmUser` | Demo Proje Firması |
| `dagitim` | `Dagitim1234` | `GasDistributionUser` | Demo Doğalgaz Dağıtım |

**Kullanım:**
1. `POST /api/auth/login` → `{ "username": "admin", "password": "Admin1234" }`
2. Dönen `token`'ı header'a ekle: `Authorization: Bearer <token>`
3. `GET /api/auth/me` ile doğrula.

Scalar'da: sağ üstteki **Authorize** panelinden `admin`/`Admin1234` ile giriş yap (OAuth2 password
flow ön-dolu) → token otomatik eklenir. Kullanıcı oluşturma (`POST /api/auth/register`) yalnız `Admin`.

---

## 8. Günlük kullanım

```bash
docker compose stop / start        # servisleri durdur / başlat (veri kalıcı)
docker compose logs -f api         # API loglarını izle
docker compose up -d --build api   # API kodu değişince yeniden derle
docker compose down -v             # servisleri VE verileri tamamen sil

# Migration:
dotnet ef migrations add <Ad> --project StarCAD.DataAccess --startup-project StarCAD.Api
dotnet ef database update      --project StarCAD.DataAccess --startup-project StarCAD.Api
```

### 8.1 Yerel veritabanını sıfırlama

Migration geçmişi **squash'landığında** (repodaki migration'lar tek bir
`InitialCreate`'e toplandığında) mevcut yerel veritabanları EF'e "hiç migration
uygulanmamış" gibi görünür: EF zaten var olan tabloları yeniden oluşturmaya
çalışır ve API **açılışta düşer**.

Uygulama bunu saptayıp ne yapmanız gerektiğini logda yazar. Belirti frontend'de
`net::ERR_CONNECTION_RESET` olarak görünür — ağ sorunu değildir, arkada dinleyen
kimse kalmamıştır. ⚠️ `docker ps` yine de **"Up"** gösterir, çünkü süreç
`app.Run()`'a hiç gelmeden düşer; `docker compose logs api` bakılacak yerdir.

**Yalnız SQL verisini siler; MinIO (çizimler, evraklar) ve Redis'e dokunmaz:**

```bash
docker stop starcad-api
docker exec starcad-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "$MSSQL_SA_PASSWORD" -C -Q \
  "ALTER DATABASE [StarCAD] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [StarCAD];"
docker start starcad-api
```

Açılışta migration'lar temiz uygulanır ve seeder örnek veriyi yeniden kurar
([7. bölümdeki test kullanıcıları](#7-kimlik-doğrulama--test-kullanıcıları) dahil).
MinIO'da kalan eski nesneler sahipsizleşir; yerelde zararsızdır, tamamen temiz
başlangıç isteyen `docker compose down -v` kullanabilir (o MinIO'yu DA siler).

> **Migration geçmişini yeniden yazarken:** bu, herkesin yerel ortamını bozan bir
> değişikliktir. Ayrı bir commit'te yap, mesaja sonucu ve bu bölümün bağlantısını
> yaz, ekibe haber ver — "squash'ladım" ifadesi tek başına okuyanı harekete
> geçirmiyor.

---

## 9. Sorun giderme (SSS)

| Belirti | Sebep / Çözüm |
|---|---|
| SQL bağlantısı reddedildi / *"Sunucu bulunamadı"* | Altyapı container'ları ayakta değil → `docker compose up -d sqlserver minio`. |
| `openssl: command not found` | Windows'ta **Git Bash** kullan; ya da PowerShell anahtar üretme alternatifini ([3.2](#32-şifreleme-anahtarları-zorunlu)) kullan. |
| Açılışta *"Encryption:Key ve Encryption:HmacKey ayarlanmalı"* | Anahtar eksik. Docker'da `.env`, yerelde user-secrets doldurulmalı ([3.2](#32-şifreleme-anahtarları-zorunlu)). |
| `Failed to bind... address already in use` (5193) | Docker `api` + yerel API aynı anda çalışıyor → `docker compose stop api`. |
| Scalar'da istek `401` alıyor (token'ım vardı) | Token'ın süresi doldu / bayat. Auth panelinden **yeniden Authorize** et, ya da Scalar'ı gizli pencerede aç. |
| Docker'a bağlanamıyorum | Docker Desktop açık mı? Kapalıysa aç, sonra `docker compose up -d`. |
| Açılışta *"Yerel veritabanınız bu koddaki migration setiyle UYUŞMUYOR"* | Migration geçmişi squash'lanmış; veritabanınız eski setle kurulmuş → [8.1 Yerel veritabanını sıfırlama](#81-yerel-veritabanını-sıfırlama). |
| **Frontend'de `net::ERR_CONNECTION_RESET`** (`localhost:5193`) | Ağ/CORS sorunu DEĞİL: API açılışta düşmüş, 8080'i dinleyen kimse yok. ⚠️ `docker ps` yine "Up" gösterir — `docker compose logs api` ile gerçek sebebe bak (çoğunlukla yukarıdaki migration uyuşmazlığı). |

---

## 10. Yapılandırma notları

- `MinioSettings:PublicEndpoint` — presigned URL'e yazılacak host. Konteynerde API MinIO'ya
  `minio:9000` ile ulaşır ama o adı tarayıcı çözemez; compose bu yüzden `${PUBLIC_HOST:-localhost}:29000`
  geçer (şema `http://` yazılmaz, sadece `host:port`). Bkz. `.claude/knowledge/minio-presign-host.md`.
- `PUBLIC_HOST` (`.env`) — tarayıcının gördüğü host. Hem `MinioSettings:PublicEndpoint`'i hem MinIO'nun
  `MINIO_SERVER_URL` / `MINIO_BROWSER_REDIRECT_URL` ayarlarını besler. Yerelde boş (localhost); ortak
  sunucuda sunucu ip/hostname.
- **MinIO host portları 29000/29001** (konteyner içi 9000/9001).
- HTTPS yönlendirmesi yalnız Development **dışında** açıktır (dev'de CORS preflight sorununu önlemek için).
