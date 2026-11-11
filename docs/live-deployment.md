# BINGOPOS Live Deployment Guide

This guide deploys BINGOPOS on an Ubuntu VPS using Nginx, PHP-FPM, MySQL, Supervisor, and HTTPS.

## 1. Production architecture

```text
Browser
  |
HTTPS / Nginx
  |
PHP-FPM -> Laravel 13 + Inertia + React
  |
MySQL
  |
Supervisor -> Laravel queue worker
Cron       -> Laravel scheduler
```

The web server document root must be the project's `public` directory:

```text
/var/www/bingopos/public
```

Never point Nginx at the project root.

## 2. Server requirements

Use Ubuntu 22.04 or 24.04 with:

- PHP 8.4+
- MySQL 8+
- Composer 2
- Node.js 24+
- Nginx
- Supervisor
- Certbot
- At least 2 GB RAM for a small installation; 4 GB is recommended when building assets on the VPS

Required PHP extensions:

```text
bcmath, ctype, curl, dom, fileinfo, gd, intl, mbstring,
openssl, pdo, pdo_mysql, tokenizer, xml, zip, exif
```

## 3. Create the deployment user and folders

Run as a sudo-enabled administrator:

```bash
sudo adduser deploy
sudo usermod -aG www-data deploy
sudo mkdir -p /var/www
sudo chown -R deploy:www-data /var/www
```

Log in as `deploy` for application commands:

```bash
sudo -iu deploy
```

## 4. Install server packages

The exact PHP repository depends on the Ubuntu version. Confirm that `php -v` reports PHP 8.4 after installation.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx mysql-server supervisor git unzip curl \
    php8.4-fpm php8.4-cli php8.4-mysql php8.4-mbstring \
    php8.4-xml php8.4-curl php8.4-zip php8.4-gd \
    php8.4-bcmath php8.4-intl php8.4-exif
```

Install Composer 2 from the official Composer installer and Node.js 24 from the NodeSource repository. Verify:

```bash
php -v
composer --version
node --version
npm --version
```

## 5. Create the MySQL database

Use a dedicated database user rather than MySQL `root`:

```bash
sudo mysql
```

```sql
CREATE DATABASE point_of_sales CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bingopos'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON point_of_sales.* TO 'bingopos'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Store the database password only in the server `.env` file.

## 6. Upload the application

Choose one controlled release source. For a Git deployment:

```bash
cd /var/www
git clone YOUR_PRIVATE_REPOSITORY_URL bingopos
cd /var/www/bingopos
```

For a release archive, upload it to `/var/www/bingopos` and ensure the `artisan` file is directly inside that directory.

Install dependencies:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
PUPPETEER_SKIP_DOWNLOAD=true npm ci
```

## 7. Configure production environment

Create the environment file:

```bash
cp .env.example .env
php artisan key:generate --force
```

Edit `/var/www/bingopos/.env` and set values similar to:

```env
APP_NAME=BINGOPOS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://pos.example.com
APP_TIMEZONE=Asia/Karachi

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=point_of_sales
DB_USERNAME=bingopos
DB_PASSWORD=REPLACE_WITH_DATABASE_PASSWORD

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=database
CACHE_STORE=database
FILESYSTEM_DISK=local
IMAGE_DISK=public

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_VERSION=v3.0.2

# Configure only if the integrations are enabled.
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=
XENDIT_IS_PRODUCTION=true
XENDIT_SECRET_KEY=
```

Security rules:

- Never set `APP_DEBUG=true` on a live server.
- Use a strong, unique `APP_KEY` and database password.
- Never commit `.env` or payment credentials.
- Set `APP_URL` to the real HTTPS URL; payment webhooks do not work with `localhost`.
- Keep `AUTH_PUBLIC_REGISTRATION` disabled unless public registration is intentionally required.

## 8. Migrate and build

Run these commands from the application directory:

```bash
cd /var/www/bingopos
php artisan migrate --force
php artisan storage:link
PUPPETEER_SKIP_DOWNLOAD=true npm run build
php artisan optimize
```

Do not run the demo seeder on production:

```bash
# Do not run this on production.
php artisan db:seed --class=DemoSeeder --force
```

The normal seeders are safe only for a new installation when the deployment plan explicitly requires the system seed data:

```bash
php artisan db:seed --force
```

On the first installation, open the root URL and complete the `/setup` wizard. Create the admin user, store profile, business information, and primary warehouse there.

## 9. Set file permissions

```bash
sudo chown -R deploy:www-data /var/www/bingopos
sudo chown -R www-data:www-data /var/www/bingopos/storage /var/www/bingopos/bootstrap/cache
sudo find /var/www/bingopos -type d -exec chmod 755 {} \;
sudo chmod -R ug+rwX /var/www/bingopos/storage /var/www/bingopos/bootstrap/cache
```

Do not make the entire project writable by the web server.

## 10. Configure Nginx

Create `/etc/nginx/sites-available/bingopos`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pos.example.com;

    root /var/www/bingopos/public;
    index index.php;

    client_max_body_size 20M;

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/bingopos /etc/nginx/sites-enabled/bingopos
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable --now nginx php8.4-fpm mysql supervisor
```

Replace `pos.example.com` with the actual domain and confirm DNS `A`/`AAAA` records point to the VPS.

## 11. Enable HTTPS

After DNS resolves:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pos.example.com
sudo certbot renew --dry-run
```

The final `.env` must use:

```env
APP_URL=https://pos.example.com
SESSION_SECURE_COOKIE=true
```

## 12. Configure the queue worker

BINGOPOS uses the database queue for background work. Create `/etc/supervisor/conf.d/bingopos-worker.conf`:

```ini
[program:bingopos-worker]
process_name=%(program_name)s_%(process_num)02d
command=/usr/bin/php /var/www/bingopos/artisan queue:work database --sleep=3 --tries=3 --timeout=120
directory=/var/www/bingopos
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/bingopos/storage/logs/worker.log
stopwaitsecs=3600
```

Enable it:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart bingopos-worker:*
sudo supervisorctl status
```

After every deployment that changes queued code:

```bash
sudo supervisorctl restart bingopos-worker:*
```

## 13. Configure the Laravel scheduler

Add this cron entry for the deployment user:

```bash
crontab -e
```

```cron
* * * * * cd /var/www/bingopos && /usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

The scheduler is required for CRM reminders, reorder jobs, and other scheduled tasks.

## 14. First deployment verification

Run the following checks:

```bash
cd /var/www/bingopos
php artisan about
php artisan route:list
php artisan migrate:status
php artisan optimize:clear
php artisan optimize
```

Verify in a browser:

1. `https://pos.example.com/`
2. `/setup` on a fresh install, or `/login` after setup
3. Dashboard login and permissions
4. Product image upload and display
5. POS transaction and receipt/PDF generation
6. Digital Menu at `/menu`
7. Queue-generated notifications or reminders
8. Payment gateway webhook endpoint, if enabled

Check logs when a verification fails:

```bash
tail -f /var/www/bingopos/storage/logs/laravel.log
sudo journalctl -u nginx -f
sudo journalctl -u php8.4-fpm -f
sudo supervisorctl tail -f bingopos-worker:bingopos-worker_00
```

## 15. Safe update procedure

Before updating, take a database and uploaded-file backup:

```bash
sudo mysqldump --single-transaction --routines --triggers \
    point_of_sales | gzip > /var/backups/point_of_sales_$(date +%F_%H%M).sql.gz

sudo tar -czf /var/backups/bingopos-storage_$(date +%F_%H%M).tar.gz \
    -C /var/www/bingopos storage/app/public
```

Put the application in maintenance mode:

```bash
cd /var/www/bingopos
php artisan down --render="errors::503" --retry=60
```

Deploy the selected release:

```bash
git fetch --tags origin
git checkout RELEASE_TAG_OR_COMMIT
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
PUPPETEER_SKIP_DOWNLOAD=true npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize
sudo supervisorctl restart bingopos-worker:*
php artisan up
```

If the build or migration fails, do not run `php artisan up`. Restore the previous release or database backup after confirming the failure.

## 16. Rollback

Application rollback:

```bash
php artisan down --render="errors::503" --retry=60
git checkout PREVIOUS_RELEASE_TAG_OR_COMMIT
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
PUPPETEER_SKIP_DOWNLOAD=true npm ci
npm run build
php artisan optimize
sudo supervisorctl restart bingopos-worker:*
php artisan up
```

Database migrations are not automatically reversible. Restore a database backup only after stopping writes and confirming the correct backup:

```bash
gunzip -c /var/backups/point_of_sales_TIMESTAMP.sql.gz | \
    mysql point_of_sales
```

## 17. Backup policy

At minimum, back up:

- MySQL database
- `storage/app/public` uploaded images and documents
- `.env` through a secure secrets/backup system, never a public repository

Keep daily backups for at least 14 days and test restoring one regularly. Store a copy outside the VPS.

## 18. Common production problems

### 502 Bad Gateway

```bash
sudo systemctl status php8.4-fpm
sudo nginx -t
ls -l /run/php/php8.4-fpm.sock
```

Confirm the Nginx `fastcgi_pass` socket matches the installed PHP version.

### Images are missing

```bash
php artisan storage:link
sudo chmod -R ug+rwX storage bootstrap/cache
```

### Queue jobs are not running

```bash
sudo supervisorctl status
sudo supervisorctl restart bingopos-worker:*
tail -f storage/logs/worker.log
```

### Webhooks fail

Confirm that `APP_URL` is public HTTPS, DNS resolves correctly, firewall port 443 is open, and the provider callback URL matches the deployed route.

### A new module returns HTTP 500

```bash
php artisan migrate:status
php artisan migrate --force
tail -f storage/logs/laravel.log
```

### Permission changes are not visible

Log out and log in again, then clear application caches:

```bash
php artisan optimize:clear
php artisan optimize
```

## 19. Firewall baseline

Allow only SSH, HTTP, and HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do not expose MySQL port `3306` publicly. Allow it only locally or through a private network.

## 20. Production handover checklist

- [ ] DNS points to the VPS
- [ ] HTTPS certificate is active and renewal test passes
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` uses HTTPS
- [ ] Dedicated MySQL user is configured
- [ ] Migrations completed
- [ ] Storage link exists
- [ ] Production frontend build completed
- [ ] Nginx points to `/public`
- [ ] Queue worker is running under Supervisor
- [ ] Scheduler cron runs every minute
- [ ] Payment webhooks use the public HTTPS URL
- [ ] Admin account and store profile configured
- [ ] Database and storage backups are scheduled
- [ ] POS, receipts, reports, image uploads, and Digital Menu verified
