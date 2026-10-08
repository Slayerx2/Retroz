# Retroz Restaurant Management System

## Project Structure

```
Retroz/
├── css/           # Stylesheets
├── js/            # JavaScript files
├── pages/         # HTML pages
├── assets/        # Images and static assets
├── node_modules/  # Dependencies
└── server.js      # Static file server
```

## Setup Instructions

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
npx http-server -p 3000
```
The server will run on http://localhost:3000

#### 4. Access the Application
Open your browser and navigate to:
- Login: http://localhost:3000/pages/login.html
- Waiter: http://localhost:3000/pages/waiter.html
- Kitchen: http://localhost:3000/pages/kitchen.html
- Admin: http://localhost:3000/pages/admin.html

### Default Login Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Waiter**: username: `waiter1`, password: `waiter123`
- **Cook**: username: `cook1`, password: `cook123`

### Features
- LocalStorage-based data persistence
- Role-based authentication (Waiter, Cook, Admin)
- Order management and tracking
- Menu management
- Kitchen display system
- Table management
- Tips tracking

### Important Notes
- The application uses localStorage for data persistence
- All authentication is client-side (for demo purposes)
- No backend database required
- The server serves static files from the current directory
