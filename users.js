
/* todo útfæra virkni fyrir notendur */
const {
  registerUser,
  selectUser,
} = require('./db');
const bcrypt = require('bcrypt');

async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);

  if (ok) {
    return user;
  }

  return false;
}

async function findByUsername(username) {
  const user = await selectUser();
  const found = user.find(u => u.username === username);

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

async function findById(id) {
  const user = await selectUser();
  const found = user.find(u => u.id === id);

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

async function hashPassword(data) {
  const hashdata = data;
  const hash = bcrypt.hashSync(data.password, 12);
  hashdata.password = hash;

  await registerUser(hashdata);
}

module.exports = {
  comparePasswords,
  findByUsername,
  findById,
  hashPassword,
};