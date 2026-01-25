# Products API

A serverless REST API built with Express.js and AWS Lambda for managing products with AI-powered descriptions and email notifications.

## Requirements

- **Node.js** >= 20.0.0
- **AWS Account** with configured credentials
- **npm** or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=production
DB_ENGINE=postgres
OPENAI_API_KEY=your-openai-key-here
POSTGRES_DATABASE_URL=your-postgres-connection-string
EMAIL_SOURCE=your-email@domain.com
EMAIL_TOADDRESSES=recipient@domain.com
```

**⚠️ Important:** Add `.env` to `.gitignore` to avoid committing sensitive credentials.

## Available Commands

### Local Development
```bash
npm start
```
Runs the API locally on `http://localhost:3000` using nodemon

### Deployment

**Deploy to Production:**
```bash
npm run deploy
```

**Deploy only modified function (faster):**
```bash
serverless deploy function -f app
```

## Project Structure

```
├── app.js                    # Express application setup
├── lambda.js                 # AWS Lambda handler
├── local.js                  # Local development server
├── serverless.yml            # Serverless framework config
├── package.json              # Dependencies
│
├── controllers/
│   ├── product-controller.js # Product endpoints logic
│   └── email-controller.js   # Email sending logic
│
├── routes/
│   ├── product-routes.js     # Product API routes
│   └── email-routes.js       # Email API routes
│
├── models/
│   ├── product.mysql.js      # MySQL product model
│   ├── product.postgres.js   # PostgreSQL product model
│   ├── product.ai.js         # AI-powered model
│   ├── product.factory.js    # Model factory
│   └── email.js              # Email model
│
├── db/
│   ├── mysql.js              # MySQL connection
│   └── postgres.js           # PostgreSQL connection
│
├── middlewares/
│   └── parse-lambdabody.js   # AWS Lambda body parser
│
└── schemas/
    └── product-schema.js     # Zod validation schemas
```

## Database Structure

### Products Table

**PostgreSQL:**
```sql
CREATE TABLE products (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(4,0) NOT NULL,
  stock INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false
);
```

**MySQL:**
```sql
CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  stock INT,
  price DECIMAL(10,2),
  PRIMARY KEY (id),
  UNIQUE (name)
);
```

### Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Product unique identifier |
| `name` | STRING | Product name (max 255 chars, unique) |
| `price` | DECIMAL | Product price |
| `stock` | INT | Product stock quantity |
| `active` | INT/BOOLEAN | Product status (0 or 1 or true/false depending the sql engine) |

## How It Works

1. **Local Development:**
   - Run `npm start` to start the Express server
   - Variables are loaded from `.env`

2. **Deployment:**
   - Run `npm run deploy` to deploy to AWS Lambda
   - MUST add the 6 environmental variables after or before deploy it

3. **Database:**
   - Configure `DB_ENGINE` to choose between `postgres` or `mysql`
   - In case postgres connection use the transaction pooler url string provided via `POSTGRES_DATABASE_URL`
   - Ensure the `products` table exists before running

4. **Features:**
   - Product management (CRUD operations)
   - AI-powered product descriptions
   - Email notifications via AWS SES

## Deployment Notes

- Use `serverless deploy function -f app` for faster updates when only code changes
- Full `serverless deploy` is needed when modifying infrastructure/routes

## Troubleshooting

**Port already in use (local development)**
- The default port is 3000, change it with: `PORT=3001 npm start`

## License

ISC
