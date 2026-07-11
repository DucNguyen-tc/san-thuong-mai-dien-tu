const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const services = [
  'identity-service',
  'catalog-service',
  'order-service',
  'cart-service',
  'payment-service',
  'notification-service',
  'recommendation-service',
  'api-gateway'
];

const backendPath = __dirname;

const tsconfigContent = `{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}`;

const packageJsonContent = (serviceName) => `{
  "name": "${serviceName}",
  "version": "1.0.0",
  "description": "${serviceName} for e-commerce system",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.12",
    "nodemon": "^3.1.0",
    "prisma": "^5.14.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}`;

const serverTsContent = `import app from './app';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(\`Server is running on port \${PORT}\`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
`;

const appTsContent = `import express from 'express';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Import and use routes here
// import routes from './routes';
// app.use('/api', routes);

export default app;
`;

const prismaTsContent = `import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
`;

const prismaSchemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

const envExampleContent = `PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
`;

const gitignoreContent = `node_modules/
dist/
build/
.env
.DS_Store
`;

const dockerfileContent = `FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
`;


async function scaffoldService(serviceName) {
  console.log('\n--- Scaffolding ' + serviceName + ' ---');
  const servicePath = path.join(backendPath, serviceName);

  if (!fs.existsSync(servicePath)) {
    fs.mkdirSync(servicePath);
  }

  // Create directories
  const dirs = [
    'src/config',
    'src/controllers',
    'src/services',
    'src/routes',
    'src/middlewares',
    'src/schemas',
    'src/types',
    'src/utils',
    'src/exceptions',
    'tests',
    'prisma'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(servicePath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Write base files
  fs.writeFileSync(path.join(servicePath, 'package.json'), packageJsonContent(serviceName));
  fs.writeFileSync(path.join(servicePath, 'tsconfig.json'), tsconfigContent);
  fs.writeFileSync(path.join(servicePath, 'src/server.ts'), serverTsContent);
  fs.writeFileSync(path.join(servicePath, 'src/app.ts'), appTsContent);
  fs.writeFileSync(path.join(servicePath, 'src/config/prisma.ts'), prismaTsContent);
  fs.writeFileSync(path.join(servicePath, 'prisma/schema.prisma'), prismaSchemaContent);
  fs.writeFileSync(path.join(servicePath, '.env.example'), envExampleContent);
  fs.writeFileSync(path.join(servicePath, '.env'), envExampleContent);
  fs.writeFileSync(path.join(servicePath, '.gitignore'), gitignoreContent);
  fs.writeFileSync(path.join(servicePath, 'Dockerfile'), dockerfileContent);

  console.log('✔ Created directory structure and boilerplates for ' + serviceName);
}

async function run() {
  for (const service of services) {
    try {
      await scaffoldService(service);
    } catch (e) {
      console.error('Failed to scaffold ' + service + ': ', e);
    }
  }
  console.log('\n✅ All services scaffolded successfully!');
}

run();
