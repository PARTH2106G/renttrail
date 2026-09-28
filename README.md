# RentTrail

RentTrail is a landlord and tenant operations manager for properties, agreements, verification, rent schedules and event history. The repository now includes a deployable React/Vite client, Express/MongoDB API, Docker Compose setup and tenant CRUD API.

## Local development

### Without Docker

```bash
cp server/.env.example server/.env
# Set a long random JWT_SECRET and a reachable MONGO_URI in server/.env
cd server && npm install && npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:5000/api` for the client if Vite is not proxying requests.

### With Docker

```bash
cp server/.env.example server/.env
# Replace JWT_SECRET before starting
 docker compose up --build
```

Open `http://localhost:3000`. The API health endpoint is `http://localhost:5000/api/health`.

## Production deployment

1. Provision MongoDB Atlas or another managed MongoDB instance.
2. Set `MONGO_URI`, a unique high-entropy `JWT_SECRET`, `PORT=5000`, and the public client origin in `server/.env`.
3. Build and run with `docker compose up -d --build`, or deploy the `server` and `client` images to your container provider.
4. Expose only the client publicly when using the included Nginx reverse proxy; it forwards `/api/*` to the API service.
5. Configure TLS, backups, monitoring and provider secrets in the hosting platform.

Do not commit `.env` files or real credentials. The included health check endpoint can be used by a hosting provider for liveness checks.

## API highlights

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/POST /api/properties`, `PUT /api/properties/:id`
- `GET/POST /api/tenants`, `GET/PUT /api/tenants/:id`
- `GET/POST /api/agreements`, `GET/PUT /api/agreements/:id`
- `POST /api/verifications`, `PATCH /api/verifications/:id/stage`
- `GET /api/rent-payments/agreement/:agreementId`, `PATCH /api/rent-payments/:id/mark-paid`
- `POST /api/event-logs`, `GET /api/event-logs/agreement/:agreementId`
