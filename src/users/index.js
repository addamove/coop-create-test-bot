const users = {};

function defineNewUser(peer) {
  if (typeof users[peer.id] === 'undefined') {
    users[peer.id] = {
      start: true,
      createTest: false,
      score: 0,
      i: 0,
    };
  }
}

module.exports = {
  defineNewUser,
  users,
};
