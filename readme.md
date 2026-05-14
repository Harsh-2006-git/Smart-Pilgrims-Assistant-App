# Smart Pilgrims Assistant App

Quick GSSoCsetup guide for the full Divya Yatra stack.

## Overview

This project has two apps:

- `Frontend/` - React + Vite pilgrim UI.
- `Backend/` - Express + Sequelize + MySQL API.

Main features include:

- Google OAuth login and local JWT sessions.
- Landing page first, with booking routes protected by auth.
- Darshan ticket booking.
- Parking marketplace and bookings.
- Stay/hotel listing marketplace and bookings.
- Admin, SOS, tracking, family mode, nearby services, chatbot, and crowd tools.

## Folder Structure

```text
Smart-Pilgrims-Assistant-App/
  Backend/
    config/
    controllers/
    middlewares/
    models/
    routes/
    index.js
  Frontend/
    src/
    package.json
  readme.md
```

## Backend Setup

```bash
cd Backend
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:3001
```

## Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Environment Files

The backend config loads env from:

- repo root `.env`
- `Smart-Pilgrims-Assistant-App/.env`

For Vite, the frontend env file should be inside `Frontend/.env` or exposed through your deployment provider.

Never commit real secrets.

## Backend `.env` Example

```env
# Server
PORT=3001
NODE_ENV=development

# Auth
JWT_SECRET=replace_with_a_long_random_secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
ADMIN_SECRET=DIVYA-ADMIN-777

# Database mode: local or cloud
DB_MODE=local

# Local MySQL
DB_NAME_LOCAL=divya_yatra
DB_USER_LOCAL=root
DB_PASSWORD_LOCAL=your_local_mysql_password
DB_HOST_LOCAL=localhost
DB_PORT_LOCAL=3306

# Cloud MySQL/TiDB option
# DB_MODE=cloud
# DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB_NAME
# DB_SSL=true
# DB_CA_CERT_PATH=C:/Users/your-user/Downloads/isrgrootx1.pem

# Cloudinary uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
TO_EMAIL=admin_receiver_email@gmail.com
ADMIN_EMAIL=admin_receiver_email@gmail.com

# AI / Maps
GEMINI_API_KEY=your_gemini_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_key
SERP_API_KEY=your_serpapi_key
GEOAPIFY_API_KEY=your_geoapify_key

# Optional stay reminder cron protection
STAY_CRON_SECRET=replace_with_cron_secret
```

## Frontend `.env` Example

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

For deployment, change `VITE_API_URL` to the deployed backend URL:

```env
VITE_API_URL=https://your-backend-domain.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

## Google OAuth Setup

In Google Cloud Console:

1. Go to `APIs & Services` -> `Credentials`.
2. Create an OAuth Client ID.
3. Choose `Web application`.
4. Add authorized JavaScript origins:

```text
http://localhost:5173
```

For production, add your deployed frontend domain too.

Use the same client ID in:

```env
GOOGLE_CLIENT_ID=...
VITE_GOOGLE_CLIENT_ID=...
```

## Database Setup

The backend uses Sequelize. On startup, `Backend/index.js` calls:

```js
await sequelize.sync();
```

So tables are created automatically after the DB connection succeeds.

Local DB flow:

1. Create a MySQL database, for example `divya_yatra`.
2. Fill the local DB env vars.
3. Start backend with `npm run dev`.

Cloud DB flow:

1. Set `DB_MODE=cloud`.
2. Provide `DATABASE_URL`.
3. If SSL is required, set `DB_SSL=true` and optionally `DB_CA_CERT_PATH`.

## Seed Dummy Hotel/Stay And Parking Listings

A seed script has been added for demo marketplace data:

```bash
cd Backend
npm run seed:listings
```

This creates:

- 1 demo owner account
- 2 parking listings
- 2 stay/hotel listings
- demo rooms for each stay

Demo owner login:

```text
phone: 9999900001
password: demo1234
```

The script is idempotent for the included demo data. Running it again updates the same demo listings instead of creating endless duplicates.

Seed file:

```text
Backend/models/seedListings.js
```

## Other Seed Script

Zone seed:

```bash
cd Backend
npm run seed
```

This seeds demo crowd/zone data from:

```text
Backend/models/seed.js
```

## Useful Admin Routes

Base API:

```text
http://localhost:3001/api/v1
```

Common route groups:

```text
/auth
/admin
/ticket
/parking
/booking
/stays
/nearby
/chatbot
/family
/location
/crowd
```

## Recommended Local Run Order

1. Start MySQL or confirm cloud DB env is correct.
2. Start backend:

```bash
cd Backend
npm run dev
```

3. Seed demo listings:

```bash
npm run seed:listings
```

4. Start frontend:

```bash
cd ../Frontend
npm run dev
```

5. Open:

```text
http://localhost:5173
```

## Notes For Contributors

- Keep real `.env` files private.
- Use `VITE_` prefix for frontend env vars.
- Restart Vite after changing frontend env.
- Booking pages require login.
- Public marketplace pages can show listings before login, but booking/details are auth-gated.
