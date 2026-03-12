import express, {Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from "cookie-parser"


const app: Application = express();

//cors for specific origin:
let corsOptions = {
   origin : ['http://localhost:5173'],
}

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

//routes:
app.use('/api/auth',authRoutes);
app.use('/api/users', userRoutes);

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

export default app;
