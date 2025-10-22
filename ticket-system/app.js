const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('aiva_support');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}



// API to create ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = {
      ...req.body,
      status: 'open',
      createdAt: new Date()
    };
    const result = await db.collection('tickets').insertOne(ticket);
    res.json({ ...ticket, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get all tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await db.collection('tickets').find().toArray();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, async () => {
  await connectDB();
  console.log('Ticket system running on http://localhost:3001');
});