require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startPolling } = require('./services/poller');
const containerRoutes = require('./routes/containers');

const app = express();
app.use(cors()); // allows React on 5173 to call backend on 3001
app.use(express.json());
app.use('/api/containers', containerRoutes);

const start = async () => {
  await connectDB();
  startPolling();
  app.listen(3001, () => {
    console.log(`API running on http://localhost:3001`);
  });
};

start();