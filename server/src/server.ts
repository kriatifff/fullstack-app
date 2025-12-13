import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import prisma from './prisma';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Backend service is running!' });
});

// Generic Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Connect to the database
  prisma.$connect()
    .then(() => {
      console.log('Database connected successfully.');
    })
    .catch((e) => {
      console.error('Failed to connect to the database:', e);
      process.exit(1);
    });
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('Database disconnected.');
});
