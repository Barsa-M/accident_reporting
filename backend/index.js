import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const port = 5000;

// Setup middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient('mongodb://localhost:27017');
const dbName = 'AccidentManagementSystem';
const db = client.db(dbName);

// Routes (example)
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB', error);
  });