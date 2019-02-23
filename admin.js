const express = require('express');
const { selectUser } = require('./db');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

async function getAdmin(req, res) {
  const getUsers = await selectUser();
  const isLoggedIn = req.isAuthenticated();
  let showName = '';
  if (isLoggedIn) {
    showName = req.user.name;
  }

  return res.render('admin', {
    title: 'admin',
    getUsers,
    isLoggedIn,
    showName,
  });
}

router.get(
  '/',
  ensureLoggedIn,
  catchErrors(getAdmin),
);

module.exports = router;
