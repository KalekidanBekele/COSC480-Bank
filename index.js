const express = require('express');
const session = require('express-session');
const sequelize = require('./routes/connection');
const bodyParser = require('body-parser');
const User = require('./routes/user');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));
app.use(flash());

const hbs = exphbs.create({
    handlebars: handlebars,
    defaultLayout: 'main',
    // Allow prototype properties by default
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
    },
});
handlebars.registerHelper('formatCurrency', function(value) {
    const formattedValue = parseFloat(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return new hbs.handlebars.SafeString(formattedValue);
  });

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

sequelize.sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.log('Error: ' + err))

// define routes
app.get('/', (req, res) => {
    res.render('index');
});
app.get('/login', (req, res) => {
    //res.render('login');
    const messages = {
        errormessage: req.flash('errormessage'),
        failedmessage: req.flash('failedmessage')
    };
    res.render('login', messages);
});
app.get('/register', (req, res) => {
    const message = {
        error: req.flash('error'),
    };
    res.render('register', message)
});
app.get('/profile', (req, res) => {
    if (req.session.authenticated) {
        // serve the home page HTML file
        const user = { firstName: req.session.firstName, lastName: req.session.lastName, password: req.session.password};
    } else {
        // redirect to the login page
        res.redirect('/profile');
    }
    const messages = {
        error: req.flash('error'),
        success: req.flash('success')
    };
    res.render('profile', messages);
});
app.get('/transfer', (req, res) => {
    const messages = {
        error: req.flash('error'),
        failed: req.flash('failed'),
    };
    res.render('transfer', messages);
})
app.get('/transaction', (req, res) => {
    const messages = {
        error: req.flash('error'),
        failed: req.flash('failed'),
    };
    res.render('transaction', messages);
})
app.get('/forgotpass', (req, res) => {
    const messages = {
        passwordmessage: req.flash('passwordmessage'),
        failed: req.flash('failed'),
        success: req.flash('success'),
    };
    res.render('forgotpass', messages);
})
app.get('/home', (req, res) => {
    // check if user is authenticated
    if (req.session.authenticated) {
        // serve the home page HTML file
        const user = {
            firstName: req.session.firstName,
            lastName: req.session.lastName,
            email: req.session.email,
            balance: req.session.balance,
            password: req.session.password
        };
        const lastName = req.session.lastName;

        // Render home.handlebars with user information
        const messages = {
            restrictmessage: req.flash('restrictmessage'),
            failedmessage: req.flash('failedmessage'),
            balmessage: req.flash('balmessage'),
            errormessage: req.flash('errormessage'),
            message: req.flash('message'),
        };
        res.render('home', {user, messages, lastName});
    } else {
        // redirect to the login page
        res.redirect('/login');
    }
});




//Login Route
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({
        where: {
            email: email,
            password: password
        }
    }).then(user => {
        if(user) {
            req.session.authenticated = true;
            req.session.firstName = user.firstName;
            req.session.email = user.email;
            req.session.balance = user.balance;
            res.redirect('/home');
        } else {
            req.flash('failedmessage', 'Invalid email or password');
            res.redirect('/login');
        }
    }).catch(err => {
        console.log('Error: ' + err);
        req.flash('errormessage', 'An error occurred');
        res.redirect('/login');;
    });
});
//Forgot Password Route
app.post('/forgotpass', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const passrepeat = req.body.passrepeat;

    User.findOne({
        where: {
            email: email,
        }
    }).then(user => {
        if(!user) {
            req.flash('passwordmessage', 'Invalid email or password');
            return res.redirect('/forgotpass');
        }
        if(password !== passrepeat) {
            req.flash('passwordmessage', 'Passwords do not match');
            return res.redirect('/forgotpass');
        }
        User.update({password: password}, {
            where: {
                email: email
            }
        }).then(() => {
            req.flash('success', 'Password Reset Successful!');
            return res.redirect('/login');
        }).catch(err => {
            console.log(err);
            req.flash('failed', 'Password Change failed');
            return res.redirect('/forgotpass');
        });
    }).catch(err => {
        console.log('Error: ' + err);
        req.flash('failed', 'An error occurred');
        return res.redirect('/forgotpass');
    });    
});
//Register Route
app.post('/register', async (req, res) => {
    try {
      const { firstName, lastName, email, password, repeatpassword } = req.body;
  
      // Check if email already exists in database
      const user = await User.findOne({ where: { email } });
      if (user) {
        req.flash('error', 'Email already exists');
        return res.redirect('/register');
      }
  
      // Check if password and repeatpassword match
      if (password !== repeatpassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/register');
      }
  
      // Create new user
      const newUser = await User.create({ firstName, lastName, email, password });
      req.session.user = newUser;
  
      return res.redirect('/login');
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
});
// Update balance route
app.post('/bal', (req, res) => {
    const email = req.session.email;
    const amount = parseFloat(req.body.amount);
    const action = req.body.action;
  
    if(req.session.authenticated) {
      User.findOne({ where: { email }, raw: true })
        .then(user => {
          user.balance = parseFloat(user.balance);
  
          if (action === 'add') {
            if (isNaN(amount) || amount < 0.01 || amount > 10000) {
              req.flash('restrictmessage', 'You can only deposit between $0.01 and $10,000.');
              return res.redirect('/home');
            } else {
              user.balance += amount;
            }
          }
  
          if (action === 'subtract') {
            if (isNaN(amount) || amount > user.balance - 5) {
              req.flash('balmessage', 'Your total balance cannot drop below $5.');
              return res.redirect('/home');
            } else {
              user.balance -= amount;
            }
          }
  
          return User.update({ balance: user.balance }, { where: { email }});
        })
        .then(() => {
          return User.findOne({ where: { email }, raw: true });
        })
        .then(user => {
          // Store updated balance in session
          req.session.balance = user.balance;
  
          // Send a response back to the client with the updated balance
          res.render('home', {
            user,
            message: `Successfully ${action === 'add' ? 'deposited' : 'withdrawn'} $${amount}.`
          });
        })
        .catch(err => {
          console.log(err);
          req.flash('errormessage', 'An error occurred.');
          res.redirect('/home');
        });
    }
});
//Update Profile route
app.post('/profile', (req, res) => {
    const { fname, lname, password } = req.body;
    const action = req.body.action;

   if(req.session.authenticated)
   {
        User.findOne({ where: { email: email } })
        .then(user => {
            res.render('profile', { user });
            if (action === 'add'){
                if (fname) {
                    user.firstName = fname;
                    return user.update({ firstName: user.firstName });
                }
                if (lname) {
                    user.lastName = lname;
                    return user.update({ lastName: user.lastName });
                }
                if (password) {
                    user.password = password;
                    return user.update({ password: user.password });
                }
                res.redirect('/profile');
            }
        });
        try {
        req.flash('success', 'Profile updated successfully.');
        res.redirect('/profile');
        } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while updating the profile.');
        res.redirect('/profile');
        }
    }
  });
//Logout Route
app.get('/logout', (req, res) => {

    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            // set Cache-Control header to prevent caching
            res.set('Cache-Control', 'no-cache, no-store');
            res.header('Expires', '-1');
            res.header('Pragma', 'no-cache');
            res.redirect('/login');
        }
    });
});

//Start Server
app.listen(3000, () => {
    console.log('Server started on port 3000...');
});
