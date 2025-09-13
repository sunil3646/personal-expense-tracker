require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "https://personal-expenss-tracker.netlify.app", // replace with your Netlify URL
  optionsSuccessStatus: 200
}));


app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('📝 Personal Finance Tracker API is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connection established successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Transaction Schema and Model
const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// REST API Endpoints for Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTransaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updatedTransaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini LLM API Endpoint placeholders
const geminiApiUrl = process.env.GEMINI_API_URL; // add your Gemini API URL in .env

app.post('/api/llm/insights', async (req, res) => {
  try {
    const { transactions } = req.body;
    const prompt = `Act as a personal financial advisor. Analyze the following transactions and provide a concise, actionable summary:\n${JSON.stringify(transactions)}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "You are a friendly financial advisor." }] },
    };

    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ text });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.post('/api/llm/goals', async (req, res) => {
  try {
    const { income, expenses } = req.body;
    const prompt = `Act as a financial coach. Based on total income $${income.toFixed(2)} and expenses $${Math.abs(expenses).toFixed(2)}, suggest a simple achievable financial goal.`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "You are a helpful financial coach." }] },
    };

    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ text });

  } catch (error) {
    console.error('Error generating goals:', error);
    res.status(500).json({ error: 'Failed to generate a financial goal' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on port: ${port}`);
});
