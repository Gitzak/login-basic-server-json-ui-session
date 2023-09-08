// Import necessary libraries and modules
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Define the path to the users.json file and read its contents
const usersFile = path.join(__dirname, '..', 'db', 'users.json');
const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

// Retrieve the secret key from environment variables for JWT
const secretKey = process.env.SECRET_KEY;

// Middleware function to check if a user is authenticated
function checkAuthenticated(req, res, next) {
    if (req.session.auth) {
        jwt.verify(req.cookies.token_jwt, secretKey, (err, decoded) => {
            if (err) {
                next();
            } else {
                if (decoded.sessionId !== req.session.sid) {
                    next();
                }
                res.redirect('/dashboard');
            }
        });
    } else {
        next();
    }
}

// Function to render the registration page
function renderRegisterPage(req, res) {
    const locals = {
        title: "Create an Account!",
    }
    res.render('auth/register', { errors: [], message: '', layout: 'layouts/main_auth', locals: locals });
}

// Function to handle user registration
function registerUser(req, res) {
    const locals = {
        title: "Create an Account!",
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/register', { errors: errors.array(), message: '', layout: 'layouts/main_auth', locals: locals });
    }

    const { username, password, email } = req.body;

    const userExists = users.find(user => user.username === username || user.email === email);
    if (userExists) {
        return res.render('auth/register', {
            errors: [],
            message: 'Username or email already exists. Please choose different ones.',
            layout: 'layouts/main_auth',
            locals: locals
        });
    }

    const avatar = req.file;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = {
        username,
        password: hashedPassword,
        email,
        avatar: avatar ? avatar.filename : null,
    };

    users.push(user);

    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');

    // Remove the 'password' key
    delete user.password;

    const sessionId = req.session.sid;

    const token = jwt.sign({ user, sessionId }, secretKey, { expiresIn: '2d' });
    res.cookie('token_jwt', token);

    req.session.auth = true;

    res.redirect('/dashboard');
}

// Function to render the login page
function renderLoginPage(req, res) {
    const locals = {
        title: "Login",
    }
    res.render('auth/login', { errors: [], message: '', layout: 'layouts/main_auth', locals: locals });
}

// Function to handle user login
function loginUser(req, res) {
    const locals = {
        title: "Login",
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render('auth/login', { errors: errors.array(), message: '', layout: 'layouts/main_auth', locals: locals });
    }

    const { email, password } = req.body;

    const user = users.find(user => user.email === email);

    if (!user) {
        return res.render('auth/login', {
            errors: [],
            message: 'User not found.',
            layout: 'layouts/main_auth',
            locals: locals
        });
    }

    bcrypt.compare(password, user.password, function (err, result) {
        if (!result) {
            return res.render('auth/login', {
                errors: [],
                message: 'Invalid password.',
                layout: 'layouts/main_auth',
                locals: locals
            });
        }
    });

    // Remove the 'password' key
    delete user.password;

    const sessionId = req.session.sid;

    const token = jwt.sign({ user, sessionId }, secretKey, { expiresIn: '2d' });
    res.cookie('token_jwt', token);

    req.session.auth = true;

    res.redirect('/dashboard');
}

// Function to log out the user
function logoutUser(req, res) {
    req.session.destroy();
    res.clearCookie('token_jwt');
    res.redirect('/auth/login');
}

// Export the functions as modules
module.exports = {
    checkAuthenticated,
    renderRegisterPage,
    registerUser,
    renderLoginPage,
    loginUser,
    logoutUser,
};
