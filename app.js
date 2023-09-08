const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressLayout = require('express-ejs-layouts');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

const app = express();

// Load environment variables from .env
dotenv.config();

const oneDay = 1000 * 60 * 60 * 24;

// Middlewares
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(
    session({
        secret: 'thisismysecrctekeyfhrgfgrfrty84fwir767',
        resave: false,
        saveUninitialized: true,
        cookie: { path: '/', httpOnly: true, secure: false, maxAge: oneDay }
    })
);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(expressLayout);
app.set('layout', './layouts/main_app');
app.set('views', path.join(__dirname, './views'));

// JWT secret key
const secretKey = process.env.SECRET_KEY;

// Define the root route
app.get('/', (req, res) => {
    if (req.session.auth) {
        if (req.cookies.token_jwt) {
            res.redirect('/dashboard');
        }
        res.redirect('/auth/login');
    } else {
        res.redirect('/auth/login');
    }
});

// Include authentication routes from the "auth" folder
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/dashboard', adminRoutes);

// Start the server on port 3000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
