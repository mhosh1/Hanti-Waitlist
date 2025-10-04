# Hanti - Real Estate Landing Page

A professional landing page for Hanti, a real estate platform focused on digitizing property search across Africa. Features a modern design, team showcase, and waitlist functionality with email automation.

## Features

- 🏠 **Modern Landing Page** - Professional design with hero section, mission statement, and team showcase
- 📧 **Waitlist System** - Collect emails with immediate confirmation emails
- 📊 **Database Storage** - SQLite database for storing waitlist emails
- 🔒 **Security** - Rate limiting, email validation, and security headers
- 📱 **Responsive Design** - Mobile-friendly layout
- ⚡ **Email Automation** - Automatic welcome emails and launch notifications
- 🎨 **Custom Logo** - SVG logo included

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `env.example` to `.env` and configure your email settings:

```bash
cp env.example .env
```

Edit `.env` with your SMTP credentials:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@hanti.com
```

### 3. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Open Your Browser

Visit `http://localhost:3000` to see your website!

## Email Configuration

### Gmail Setup (Recommended for Testing)

1. Enable 2-factor authentication on your Gmail account
2. Generate an app password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use your Gmail address as `SMTP_USER` and the app password as `SMTP_PASS`

### Production Email Providers

For production, consider using:

- **SendGrid** - Reliable email delivery service
- **Mailgun** - Email automation platform
- **AWS SES** - Amazon's email service

## API Endpoints

### POST /api/waitlist

Add an email to the waitlist and send welcome email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Successfully added to waitlist",
  "id": 1
}
```

### GET /api/admin/waitlist-count

Get the total number of waitlist signups.

**Response:**

```json
{
  "count": 150
}
```

### POST /api/admin/notify-launch

Send launch notification emails to all waitlist members.

**Response:**

```json
{
  "message": "Launch notification process completed",
  "success": 145,
  "errors": 5,
  "total": 150
}
```

## File Structure

```
├── index.html          # Main landing page
├── styles.css          # CSS styling
├── script.js           # Frontend JavaScript
├── server.js           # Node.js backend server
├── package.json        # Dependencies and scripts
├── logo.svg            # Hanti logo
├── env.example         # Environment variables template
├── README.md           # This file
└── waitlist.db         # SQLite database (created automatically)
```

## Customization

### Updating Team Information

Edit the team section in `index.html` to add/remove team members or update their roles.

### Changing Colors/Styling

The main brand colors are defined in `styles.css`:

- Primary Blue: `#2563eb`
- Accent Yellow: `#fbbf24`
- Dark Gray: `#1f2937`

### Email Templates

Email templates are defined in `server.js` in the functions:

- `getWelcomeEmailHTML()` - Welcome email template
- `getLaunchEmailHTML()` - Launch notification template

## Deployment

### Heroku

1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy with Git:

```bash
git add .
git commit -m "Initial commit"
heroku git:remote -a your-app-name
git push heroku main
```

### DigitalOcean/AWS/Other VPS

1. Upload files to your server
2. Install Node.js and npm
3. Set up environment variables
4. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name "hanti-website"
```

## Team Hanti

- **Abdirahman Moualem** - Full Stack + Backend Testing + PM
- **Abdirahman Nur** - Full Stack
- **Yahya Elmi** - Backend (Networking Testing)
- **Zack** - Backend
- **Ahmed** - Frontend + UI Testing
- **Mohamed Hosh** - System Design + Product Strategy
- **Abdurahman** - CEO + Lead Software Engineer 

## Vision & Mission

**Vision:** Digitizing real estate across Africa with trust, accessibility, and market intelligence.

**Mission:** Build a verified, data-driven property platform for Africa that connects buyers, renters, and agents seamlessly.

## License

MIT License - feel free to use this code for your own projects!
