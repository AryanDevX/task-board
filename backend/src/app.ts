import express from "express";
import cors from 'cors';
import authRoutes from './routes/authRoutes';

const app = express();

// middleware
app.use(express.json());
app.use('/api/auth',authRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Backend running");
});


export default app;