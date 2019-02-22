const express = require('express');

const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const xss = require('xss');
const { createApplication } = require('./db');
const catchErrors = require('./utils');

const router = express.Router;

router.use(express.urlencoded({ extended: true }));

async function page(req, res) {
  // ef user er admin þá senda á admin síðu
  if (req.isAuthenticated()) {
    return res.render('admin', {
      title: 'Admin',
      userAuthenticated: req.isAuthenticated(),
      user: req.user,
    });
  }

  // ef user er ekki admin þá senda til baka á login
  return res. redirect('/login');
}

router.get('/', catchErrors(page));

module.exports = router;
