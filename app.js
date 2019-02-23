require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-local');

const apply = require('./apply');
const register = require('./register');
const admin = require('./admin');
const applications = require('./applications');
const users = require('./users');

// const sessionSecret = process.env.SESSION_SECRET;

const {
  HOST: hostname = '127.0.0.1',
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
} = process.env;

console.info(process.env);

if (!sessionSecret) {
  console.error('Add SESSION_SECRET to .env');
  process.exit(1);
}

const app = express();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 24 * 60 * 1000,
}));

async function strat(username, password, done) {
  try {
    const user = await users.findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    // Verður annaðhvort notanda hlutur ef lykilorð rétt, eða false
    const result = await users.comparePasswords(password, user);
    return done(null, result);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

// Notum local strategy með „strattinu“ okkar til að leita að notanda
passport.use(new Strategy(strat));

// Geymum id á notanda í session, það er nóg til að vita hvaða notandi þetta er
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Sækir notanda út frá id
passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Látum express nota passport með session
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find(i => i.param === field));
}

app.locals.isInvalid = isInvalid;

app.route('/login')
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.redirect('/applications');
    } else {
      let msg = '';

      if (req.session.messages && req.session.messages.length > 0) {
        msg = req.session.messages.join(',');
        req.session.messages = [];
      }
      const data = {
        title: 'Villa',
        errors: [],
        msg,
      };
      res.render('login', data);
    }
  })

  .post(
    passport.authenticate('local', {
      failureMessage: 'Notandanafn og/eða lykilorð vitlaust',
      failureRedirect: '/login',
    }),

    (req, res) => {
      res.redirect('/admin');
    },
  );

/* todo setja upp login og logout virkni */

app.use('/', apply);
app.use('/register', register);
app.use('/applications', applications);
app.use('/admin', admin);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { page: 'error', title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { page: 'error', title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
