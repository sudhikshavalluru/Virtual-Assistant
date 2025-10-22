const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;
const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri);
let db;
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sudhiksha.valluru@gmail.com', 
        pass: 'tpiu harw pgax bkix'  // Removed spaces from app password              
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration on startup
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Email transporter verification failed:', error.message);
        console.log('⚠️ OTPs will be printed to console instead of emailed');
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

let ticketsStorage = [];
let analyticsStorage = [];

async function connectDB() {
    try {
        await client.connect();
        db = client.db('aiva_support');
        console.log('✅ Connected to MongoDB');
        
        await db.admin().ping();
        console.log('✅ MongoDB ping successful');
        
        await db.createCollection('tickets');
        console.log('✅ Tickets collection ready');
        
        const testDoc = {
            _id: 'startup-test',
            message: 'Server started successfully',
            timestamp: new Date()
        };
        
        await db.collection('tickets').replaceOne(
            { _id: 'startup-test' },
            testDoc,
            { upsert: true }
        );
        
        console.log('✅ Test document inserted');
        
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
        db = null;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'aiva-dashboard-fixed.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'analytics-dashboard.html'));
});

app.get('/api/db-status', (req, res) => {
    if (db) {
        res.json({ connected: true, database: 'aiva_support' });
    } else {
        res.json({ connected: false, error: 'Database not connected' });
    }
});
app.get('/api/test-ticket', async (req, res) => {
    try {
        if (!db) {
            return res.json({ error: 'Database not connected' });
        }
        
        const testTicket = {
            ticketId: 'TEST-123',
            title: 'Test Ticket',
            description: 'This is a test ticket',
            status: 'Open',
            createdAt: new Date()
        };
        
        const result = await db.collection('tickets').insertOne(testTicket);
        const count = await db.collection('tickets').countDocuments();
        
        res.json({ 
            success: true, 
            insertedId: result.insertedId,
            totalTickets: count 
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        const mailOptions = {
            from: 'AI Complaint Assistant <lasyareddipatlolla71415@gmail.com>',
            to: email, 
            subject: 'AI Complaint System - Login Verification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">🤖 AI-Powered Complaint System</h2>
                    <h3 style="color: #374151;">Secure Login Verification</h3>
                    <p>Your verification code is:</p>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };
        
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${email}`);
            console.log(`📧 Message ID: ${info.messageId}`);
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            console.error('Error details:', {
                code: emailError.code,
                command: emailError.command,
                response: emailError.response
            });
            // Still store OTP for testing even if email fails
            console.log(`\n⚠️ IMPORTANT - EMAIL FAILED BUT OTP GENERATED:`);
            console.log(`📧 OTP for ${email} is: ${otp}`);
            console.log(`💡 Use this OTP to login (valid for 5 minutes)\n`);
        }
        
        global.otpStore = global.otpStore || {};
        global.otpStore[email] = { otp: otp, expires: Date.now() + 300000 };
        
        console.log(`🔑 OTP stored in memory for ${email}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
app.post('/api/verify-otp', (req, res) => {
    try {
        const { email, otp } = req.body;
        const stored = global.otpStore && global.otpStore[email];
        
        if (!stored || Date.now() > stored.expires) {
            return res.json({ success: false, error: 'OTP expired' });
        }
        
        if (stored.otp === otp) {
            delete global.otpStore[email];
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Invalid OTP' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/tickets', async (req, res) => {
    try {
        const ticket = {
            ...req.body,
            _id: Date.now().toString(),
            createdAt: new Date(),
            status: 'Open'
        };
        
        console.log('Database connection status:', db ? 'Connected' : 'Not connected');
        console.log('Ticket data to save:', ticket);
        
        if (db) {
            const result = await db.collection('tickets').insertOne(ticket);
            console.log('✅ Ticket saved to MongoDB with ID:', result.insertedId);
            const count = await db.collection('tickets').countDocuments();
            console.log('Total tickets in MongoDB:', count);
            
            res.json({ success: true, ticketId: result.insertedId });
        } else {
            ticketsStorage.push(ticket);
            console.log('❌ Ticket saved to memory only:', ticket._id);
            res.json({ success: true, ticketId: ticket._id });
        }
    } catch (error) {
        console.error('Ticket creation error:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/tickets', async (req, res) => {
    try {
        if (db) {
            const tickets = await db.collection('tickets').find().toArray();
            res.json(tickets);
        } else {
            res.json(ticketsStorage);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/analytics', async (req, res) => {
    try {
        const analytics = {
            ...req.body,
            timestamp: new Date()
        };
        await db.collection('analytics').insertOne(analytics);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/analytics', async (req, res) => {
    try {
        const totalTickets = await db.collection('tickets').countDocuments();
        const resolvedIssues = await db.collection('analytics').countDocuments({ type: 'resolved' });
        res.json({
            totalTickets,
            resolvedIssues,
            avgResponseTime: '< 1 min'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, '0.0.0.0', async () => {
    await connectDB();
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Also accessible at http://127.0.0.1:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy. Trying port ${PORT + 1}...`);
        app.listen(PORT + 1, '0.0.0.0', async () => {
            await connectDB();
            console.log(`Server running on http://localhost:${PORT + 1}`);
        });
    } else {
        console.error('Server error:', err);
    }
});