const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const validator = require('validator');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Initialize SQLite database
const db = new sqlite3.Database('./waitlist.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');

        // Create waitlist table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS waitlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT (datetime('now', 'localtime')),
            notified BOOLEAN DEFAULT FALSE
        )`);

        // Add columns if they don't exist (for existing databases)
        db.run(`ALTER TABLE waitlist ADD COLUMN role TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding role column:', err);
            }
        });

        db.run(`ALTER TABLE waitlist ADD COLUMN first_name TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding first_name column:', err);
            }
        });

        db.run(`ALTER TABLE waitlist ADD COLUMN last_name TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding last_name column:', err);
            }
        });

        db.run(`ALTER TABLE waitlist ADD COLUMN phone TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding phone column:', err);
            }
        });
    }
});

// Email transporter configuration
const createEmailTransporter = () => {
    // For development, use a test account (you can replace with real SMTP settings)
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-app-password'
        }
    });
};

// Email templates
const getWelcomeEmailHTML = (email, role) => {
    const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
    const roleSpecificContent = {
        buyer: "As a property buyer, you'll get early access to verified listings and smart search features to find your perfect home.",
        seller: "As a property seller, you'll be first to list on our platform with our verified listing system and market intelligence tools.",
        investor: "As a property investor, you'll get access to market analytics and investment opportunities across African real estate markets."
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Hanti Waitlist</title>
        <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { font-size: 2rem; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
            .highlight { color: #16a34a; font-weight: bold; }
            .role-badge { background: #16a34a; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">HANTI</div>
                <p>Creating A Better Way To Find Home</p>
            </div>
            <div class="content">
                <h2>Welcome to the Hanti Waitlist! 🏠</h2>
                ${role ? `<p><span class="role-badge">${roleDisplay}</span></p>` : ''}
                <p>Hi there,</p>
                <p>Thank you for joining the <span class="highlight">Hanti waitlist</span>! We're excited to have you as part of our journey to revolutionize real estate across Africa.</p>
                
                ${role && roleSpecificContent[role] ? `
                <h3>Tailored for You</h3>
                <p>${roleSpecificContent[role]}</p>
                ` : ''}
                
                <h3>What's Next?</h3>
                <ul>
                    <li>You'll be among the <strong>first to know</strong> when we launch</li>
                    <li>Get <strong>early access</strong> to our platform</li>
                    <li>Receive <strong>exclusive updates</strong> on our progress</li>
                    <li>Be part of shaping the <strong>future of African real estate</strong></li>
                </ul>
                
                <h3>Our Mission</h3>
                <p>We're building a verified, data-driven property platform for Africa that connects buyers, renters, and agents seamlessly. With features like smart property search, verified listings, market intelligence, and seamless connections, we're making finding your dream home easier than ever.</p>
                
                <p>Stay tuned for more updates!</p>
                
                <p>Best regards,<br>
                <strong>Team Hanti</strong></p>
            </div>
            <div class="footer">
                <p>You're receiving this email because you signed up for the Hanti waitlist at hanti.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const getLaunchEmailHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hanti is Now Live!</title>
        <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { font-size: 2rem; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
            .cta-button { display: inline-block; background: #fbbf24; color: #1f2937; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .highlight { color: #2563eb; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">HANTI</div>
                <p>🎉 WE'RE NOW LIVE! 🎉</p>
            </div>
            <div class="content">
                <h2>The wait is over - Hanti is officially live!</h2>
                <p>Hi there,</p>
                <p>We're thrilled to announce that <span class="highlight">Hanti is now fully operational</span>! As one of our early supporters, you get exclusive first access to our revolutionary real estate platform.</p>
                
                <div style="text-align: center;">
                    <a href="https://hanti.com/app" class="cta-button">Explore Properties Now →</a>
                </div>
                
                <h3>What You Can Do Now:</h3>
                <ul>
                    <li>🔍 <strong>Search verified properties</strong> across Africa</li>
                    <li>📍 <strong>Use our smart map features</strong> to find the perfect location</li>
                    <li>📊 <strong>Access market intelligence</strong> and property analytics</li>
                    <li>🤝 <strong>Connect directly with agents</strong> and property owners</li>
                    <li>💼 <strong>List your properties</strong> if you're an agent or owner</li>
                </ul>
                
                <p>Thank you for believing in our vision from the beginning. Your support has been instrumental in making this dream a reality.</p>
                
                <p>Ready to find your perfect home?</p>
                
                <div style="text-align: center;">
                    <a href="https://hanti.com/app" class="cta-button">Get Started →</a>
                </div>
                
                <p>Best regards,<br>
                <strong>Team Hanti</strong></p>
            </div>
            <div class="footer">
                <p>You're receiving this email because you joined our waitlist. Welcome to the future of African real estate!</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Waitlist signup endpoint
app.post('/api/waitlist', async (req, res) => {
    try {
        const { email, role, first_name, last_name, phone } = req.body;

        // Validate email
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                error: 'Please provide a valid email address'
            });
        }

        // Validate role
        const validRoles = ['buyer', 'seller', 'investor'];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                error: 'Please select a valid role (Buyer, Seller, or Investor)'
            });
        }

        // Validate names (optional - only validate if provided)
        if (first_name && first_name.trim() === '') {
            return res.status(400).json({
                error: 'First name cannot be empty'
            });
        }

        if (last_name && last_name.trim() === '') {
            return res.status(400).json({
                error: 'Last name cannot be empty'
            });
        }

        // Validate phone (optional - only validate if provided)
        if (phone && phone.trim() === '') {
            return res.status(400).json({
                error: 'Phone number cannot be empty'
            });
        }

        // Normalize data
        const normalizedEmail = validator.normalizeEmail(email);
        const normalizedRole = role.toLowerCase();
        const normalizedFirstName = first_name ? first_name.trim() : null;
        const normalizedLastName = last_name ? last_name.trim() : null;
        const normalizedPhone = phone ? phone.trim() : null;

        // Check if email already exists
        db.get('SELECT email FROM waitlist WHERE email = ?', [normalizedEmail], async (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    error: 'Internal server error'
                });
            }

            if (row) {
                return res.status(400).json({
                    error: 'Email already registered in waitlist'
                });
            }

            // Add email, role, names, and phone to database
            db.run('INSERT INTO waitlist (email, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
                [normalizedEmail, normalizedRole, normalizedFirstName, normalizedLastName, normalizedPhone], async function (err) {
                    if (err) {
                        console.error('Database insert error:', err);
                        return res.status(500).json({
                            error: 'Failed to add to waitlist'
                        });
                    }

                    // Send welcome email
                    try {
                        const transporter = createEmailTransporter();

                        const mailOptions = {
                            from: process.env.FROM_EMAIL || 'noreply@hanti.com',
                            to: normalizedEmail,
                            subject: 'Welcome to Hanti Waitlist! 🏠',
                            html: getWelcomeEmailHTML(normalizedEmail, normalizedRole)
                        };

                        await transporter.sendMail(mailOptions);
                        console.log('Welcome email sent to:', normalizedEmail);
                    } catch (emailError) {
                        console.error('Email sending error:', emailError);
                        // Don't fail the request if email fails
                    }

                    res.status(201).json({
                        message: 'Successfully added to waitlist',
                        id: this.lastID
                    });
                });
        });

    } catch (error) {
        console.error('Waitlist signup error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Admin endpoint to get waitlist count (optional)
app.get('/api/admin/waitlist-count', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM waitlist', (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ count: row.count });
    });
});

// Admin endpoint to get all waitlist emails
app.get('/api/admin/waitlist', (req, res) => {
    db.all('SELECT id, email, role, first_name, last_name, phone, created_at, notified FROM waitlist ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Clear database endpoint
app.post('/admin/clear', (req, res) => {
    db.run('DELETE FROM waitlist', (err) => {
        if (err) {
            return res.status(500).send('Error clearing database');
        }
        res.redirect('/admin');
    });
});

// Serve admin page with server-side rendering
app.get('/admin', (req, res) => {
    db.all('SELECT id, email, role, first_name, last_name, phone, created_at FROM waitlist ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        let emailTable = '';
        if (rows.length > 0) {
            emailTable = `
                <table class="email-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email Address</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Date</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((email, index) => {
                // Parse the SQLite datetime and convert to EDT (GMT-4)
                const date = new Date(email.created_at);
                // Subtract 4 hours to convert from UTC to EDT (Ohio time)
                const easternDate = new Date(date.getTime() - (4 * 60 * 60 * 1000));

                const dateStr = easternDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                const timeStr = easternDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                const fullName = [email.first_name, email.last_name].filter(Boolean).join(' ') || 'N/A';
                const roleDisplay = email.role ? email.role.charAt(0).toUpperCase() + email.role.slice(1) : 'N/A';
                const phoneDisplay = email.phone || 'N/A';
                return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td><strong>${fullName}</strong></td>
                                    <td><strong>${email.email}</strong></td>
                                    <td>${phoneDisplay}</td>
                                    <td><span class="role-badge role-${email.role || 'unknown'}">${roleDisplay}</span></td>
                                    <td>${dateStr}</td>
                                    <td>${timeStr}</td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            emailTable = '<div class="no-emails">No emails yet</div>';
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hanti Admin</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 95%;
                    margin: 20px auto;
                    padding: 20px;
                    background: #ffffff;
                    min-height: 100vh;
                }
                .header {
                    background: linear-gradient(135deg, #16a34a, #22c55e);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 20px rgba(22, 163, 74, 0.2);
                }
                .logo-text {
                    font-size: 2rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    margin-bottom: 10px;
                }
                .container {
                    background: white;
                    padding: 0;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }
                .total {
                    text-align: center;
                    font-size: 20px;
                    color: #16a34a;
                    margin: 20px 0;
                    font-weight: 600;
                    padding: 20px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e5e7eb;
                }
                .email-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0;
                    font-size: 16px;
                    background: white;
                }
                .email-table th {
                    background: #16a34a;
                    color: white;
                    padding: 20px 25px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 16px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 3px solid #15803d;
                }
                .email-table th:first-child {
                    width: 50px;
                    text-align: center;
                }
                .email-table th:nth-child(2) {
                    width: 18%;
                }
                .email-table th:nth-child(3) {
                    width: 25%;
                }
                .email-table th:nth-child(4) {
                    width: 15%;
                }
                .email-table th:nth-child(5) {
                    width: 12%;
                }
                .email-table th:nth-child(6) {
                    width: 15%;
                }
                .email-table th:nth-child(7) {
                    width: 15%;
                }
                .role-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .role-buyer { background: #dbeafe; color: #1e40af; }
                .role-seller { background: #dcfce7; color: #166534; }
                .role-investor { background: #fef3c7; color: #92400e; }
                .role-unknown { background: #f3f4f6; color: #6b7280; }
                .email-table td {
                    padding: 18px 25px;
                    border-bottom: 1px solid #e5e7eb;
                    vertical-align: middle;
                    font-size: 15px;
                }
                .email-table td:first-child {
                    text-align: center;
                    font-weight: 600;
                    color: #16a34a;
                    background: #f8fafc;
                }
                .email-table tr:nth-child(even) {
                    background: #f9fafb;
                }
                .email-table tr:hover {
                    background: #f0fdf4;
                    transform: scale(1.001);
                    transition: all 0.2s ease;
                }
                .no-emails {
                    text-align: center;
                    color: #999;
                    font-style: italic;
                    padding: 40px;
                }
                .actions {
                    text-align: center;
                    margin: 0;
                    padding: 25px;
                    border-top: 1px solid #e5e7eb;
                    background: #f8fafc;
                }
                .btn {
                    background: #16a34a;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 600;
                    text-decoration: none;
                    display: inline-block;
                    margin: 0 10px;
                    cursor: pointer;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .btn:hover {
                    background: #15803d;
                }
                .btn-danger {
                    background: #dc2626;
                }
                .btn-danger:hover {
                    background: #b91c1c;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-text">HANTI</div>
                <p>Admin Signup Dashboard</p>
            </div>
            
            <div class="container">
                <div class="total">Total Signups: <strong>${rows.length}</strong></div>
                
                ${emailTable}
                
                <div class="actions">
                    <a href="/admin" class="btn">🔄 Refresh</a>
                    <!-- Clear All Button - COMMENTED OUT -->
                    <!--
                    <form method="post" action="/admin/clear" style="display: inline;">
                        <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure you want to clear all emails?')">🗑️ Clear All</button>
                    </form>
                    -->
                </div>
            </div>
        </body>
        </html>
        `;

        res.send(html);
    });
});

// Admin endpoint to send launch notification to all waitlist members
app.post('/api/admin/notify-launch', async (req, res) => {
    try {
        // Get all waitlist emails that haven't been notified
        db.all('SELECT email FROM waitlist WHERE notified = FALSE', async (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const transporter = createEmailTransporter();
            let successCount = 0;
            let errorCount = 0;

            // Send launch email to all waitlist members
            for (const row of rows) {
                try {
                    const mailOptions = {
                        from: process.env.FROM_EMAIL || 'noreply@hanti.com',
                        to: row.email,
                        subject: '🎉 Hanti is Now Live - Your Early Access is Ready!',
                        html: getLaunchEmailHTML()
                    };

                    await transporter.sendMail(mailOptions);
                    successCount++;

                    // Mark as notified
                    db.run('UPDATE waitlist SET notified = TRUE WHERE email = ?', [row.email]);

                } catch (emailError) {
                    console.error('Failed to send launch email to:', row.email, emailError);
                    errorCount++;
                }
            }

            res.json({
                message: 'Launch notification process completed',
                success: successCount,
                errors: errorCount,
                total: rows.length
            });
        });

    } catch (error) {
        console.error('Launch notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Hanti website server running on http://localhost:${PORT}`);
    console.log(`📧 Email system configured and ready`);
    console.log(`📊 Database initialized`);
});

module.exports = app;
