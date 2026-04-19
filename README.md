# Retroz Restaurant Management System

## Security Setup Instructions

### Problem Solved
The login credentials were previously hardcoded in the frontend JavaScript (`assets/js/auth.js`), making them visible to anyone who inspects the code. This has been fixed by implementing server-side authentication with bcrypt password hashing.

### What Was Changed
1. **Removed hardcoded credentials** from `assets/js/auth.js`
2. **Created Node.js server** (`server.js`) with secure authentication
3. **Updated frontend** to use API calls instead of local validation
4. **Added bcrypt** for password hashing
5. **Added JWT tokens** for session management

### Setup Instructions

#### 1. Install Node.js
If you don't have Node.js installed, download it from:
- https://nodejs.org/ (Download the LTS version)

#### 2. Install Dependencies
Open PowerShell/CMD in the project directory and run:
```bash
npm install
```

#### 3. Start the Server
```bash
npm start
```
The server will run on http://localhost:3000

#### 4. Access the Application
Open your browser and go to: http://localhost:3000

### Default Login Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Waiter**: username: `waiter1`, password: `waiter123`  
- **Cook**: username: `cook1`, password: `cook123`

### Security Features
- Passwords are now hashed with bcrypt (no plain text storage)
- Authentication happens on the server (not in browser)
- JWT tokens for secure session management
- No credentials visible in browser inspector

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

### Important Notes
- Change the JWT_SECRET in `server.js` for production
- The server serves static files from the current directory
- All authentication logic is now server-side and secure
