const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Users with bcrypt hashed passwords
// Original passwords: admin123, waiter123, cook123
const users = [
  {
    username: 'admin',
    password: '$2b$10$XBHcnpy9KtFuwCm4xAU8heTCupdk0KmrBpKaMIVz4v0hvbrr5XCCu',
    role: 'admin'
  },
  {
    username: 'waiter1',
    password: '$2b$10$xlZwKpXedT38pu1gV0x2guHV6yaUdY22etOYWIVUqo6cltN14x0Ci',
    role: 'waiter'
  },
  {
    username: 'cook1',
    password: '$2b$10$meJxNfPEUM3gGMW/je4PVegM0dPP4v5pUbKY0p8CBJP6TsucVDIw6',
    role: 'cook'
  }
];

// Hash passwords function (run this once to generate hashes)
async function hashPasswords() {
  const saltRounds = 10;
  
  const hashedUsers = await Promise.all([
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'waiter1', password: 'waiter123', role: 'waiter' },
    { username: 'cook1', password: 'cook123', role: 'cook' }
  ].map(async user => ({
    ...user,
    password: await bcrypt.hash(user.password, saltRounds)
  })));
  
  console.log('Hashed users:');
  hashedUsers.forEach(user => {
    console.log(`${user.username}: ${user.password}`);
  });
}

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = users.find(u => u.username === username && u.role === role);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      user: { username: user.username, role: user.role },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('To generate password hashes, uncomment the hashPasswords() call below:');
  // hashPasswords();
});

// Uncomment this line once to generate new password hashes
// hashPasswords();
