const express = require('express');
const xss = require('xss');
const {
  check,
  validationResults,
} = require('express-validator/check');
const { sanitize } = require('express-validator/filter');
const { createApplication } = require('./db');
const { catchErrors } = require('./utils');
const users = require('./users');


const router = express.Router;

router.use(express.urlencoded({
  extended: true,
}));

function sanitizeUser(data) {
  const safeData = data;

  safeData.username = xss(data.username);
  safeData.email = xss(data.email);
  safeData.name = xss(data.name);
  safeData.password1 = '';
  safeData.password2 = '';

  return safeData;
}

async function validData(data, req) {
  const errors = validationResults(req);

  let pwNoMatch = false;
  if (data.password1 !== data.password2) pwNoMatch = true;

  const userTaken = await users.db.getIfUsernameTaken(data.username);
  const emailTaken = await users.db.getIfEmailTaken(data.email);

  if (!errors.isEmpty() || pwNoMatch || userTaken || emailTaken) {
    const err = {};
    err.msgList = errors.array().map(i => i.msg);
    for (let j = 0; j < errors.array().length; j += 1) {
      err[errors.array()[j].param] = true;
    }

    if (pwNoMatch) {
      err.msgList.push('Lykilorð verða að vera eins.')
      err.password1 = true;
    }

    if (userTaken) {
      err.msgList.push('Notendanafn er ekki laust.');
      err.username = true;
    }

    if (emailTaken) {
      err.msgList.push('Netfang er ekki laust.');
      err.email = true;
    }

    return err;
  }

  return undefined;
}

module.exports = router;
