
const express = require('express');
const xss = require('xss');
const {
  check,
  validationResult,
} = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { hashPassword } = require('./users');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

const router = express.Router();

// Fylki af öllum validations fyrir umsókn
const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt'),

  check('email')
    .isEmail()
    .withMessage('Netfang verður að vera netfang'),

  check('username')
    .isLength({ min: 1 })
    .withMessage('Notandanafn verður að vera minnst einn stafur'),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Lykilorð verður að vera minnst 8 stafir'),

  check('password2')
    .custom((val, { req }) => val === req.body.password)
    .withMessage('Lykilorð verða að vera eins'),


];

function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

// Fylki af öllum hreinsunum fyrir umsókn
const sanitazions = [
  sanitize('name').trim().escape(),
  sanitizeXss('name'),

  sanitizeXss('email'),
  sanitize('email').trim().normalizeEmail(),

  sanitize('username').trim().escape(),
  sanitizeXss('username'),

];

function register(req, res) {
  const data = {
    title: 'Register',
    name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    errors: [],
  };
  res.render('register', data);
}

async function registerPost(req, res) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      password2 = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    password2,
  };

  hashPassword(data);
  return res.redirect('/thanks');
}

function showErrors(req, res, next) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      password2 = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    password2,

  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;
    data.title = 'Nýskráning – vandræði';

    return res.render('register', data);
  }

  return next();
}

function thanks(req, res) {
  return res.render('thanks', { title: 'Nýskráning tókst!' });
}

router.get('/', register);
router.get('/thanks', thanks);

router.post(
  '/',
  // Athugar hvort form sé í lagi
  validations,
  // Ef form er ekki í lagi, birtir upplýsingar um það
  showErrors,
  // Öll gögn í lagi, hreinsa þau
  sanitazions,
  // Senda gögn í gagnagrunn
  catchErrors(registerPost),
);

module.exports = router;
