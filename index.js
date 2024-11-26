const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const collection = require('./config');
const session = require('express-session');
const router = express.Router();
const serverless = require('serverless-http');
const app = express();

// Convert data to JSON format
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use Bootstrap assets and EJS for views
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/assets'))); // Serve assets folder
app.use(express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));

// Generate secret key for cookie security
const { v4: uuidv4 } = require('uuid');
const secretKey = uuidv4();
console.log(secretKey);

// Set up session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true
}));

// Middleware to check if user is logged in
const checkLoggedIn = (req, res, next) => {
  if (req.session.user) {
      res.locals.username = req.session.user.name;
  }
  next();
};
app.use(checkLoggedIn);

// Render username var globally
app.use((req, res, next) => {
    res.locals.username = req.session.user ? req.session.user.name : null;
    next();
});

// Serve the index.html page as the default route
app.get('/', (req, res) => {
    // res.sendFile(path.join(__dirname, '/index.html'));
    res.render('login')
});

// Rendering EJS templates for specific routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/update', (req, res) => {
    res.render('update');
});

// Signup functionality
app.post('/signup', async (req, res) => {
    try {
        const data = {
            name: req.body.username,
            password: req.body.password
        };

        const userExist = await collection.findOne({ name: data.name });
        if (userExist) {
            res.status(400).render('signup', { error: "Error: The username already exists." });
        } else {
            const saltRound = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRound);

            data.password = hashedPassword;
            await collection.insertMany(data);
            res.redirect('/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('signup', { error: "An unexpected error occurred during signup. Please try again later." } );
    }
});

// Login functionality

app.post('/login', async (req, res) => {
    try {
        const user = await collection.findOne({ name: req.body.username });

        if (!user) {
            return res.status(400).render('login', { usererror: "Error: The username is incorrect." });
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordValid) {
            return res.status(400).render('login', { passerror: "Error: The password is incorrect." });
        }

        // Store user data in session
        req.session.user = user;
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).render('login', { error: "An unexpected error occurred during login. Please try again later." });
    }
});


// Update functionality: Reset password
app.post('/update', async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        console.log('Request body:', req.body);


        if (!username || !newPassword) {
            return res.status(400).render('update', {error: "Error: Username and new password are required."} );
        }

        const user = await collection.findOne({ name: username });
        if (!user) {
            return res.status(400).render('update',  { error: "Error: The username does not exist."} );
        }

        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRound);

        await collection.updateOne({ name: username }, { $set: { password: hashedPassword } });
        res.status(200).redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).render('update', {error: "An unexpected error occurred while updating the password. Please try again later."});
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).render('/home', {error: "An error occurred during logout. Please try again later."} );
        } else {
            res.redirect('/');
        }
    });
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
