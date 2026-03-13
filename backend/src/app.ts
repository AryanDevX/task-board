import express, {Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from "cookie-parser"
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { error } from 'console';
import columnRoutes from './routes/columnRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app: Application = express();

//cors for specific origin:
let corsOptions = {
   origin : ['http://localhost:5173'],
}

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

//static files
app.use("/uploads", express.static("uploads"));

//routes:
app.use('/api/auth',authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', columnRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// test route
app.get('/', (req, res) => {
  res.send('Welcome to our server ROHIT.');
});



let users: any[] = []; // Added a quick 'any[]' type here to keep TS happy!
app.post('/users', (req: Request, res: Response) => {
    const user = req.body;
    users.push(user);
    res.status(201).send(user);
});

app.use(errorMiddleware);
export default app;
