require('dotenv').config();

const app = require('./app');
const db = require('./config/database');

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connection established successfully.');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
};

startServer();