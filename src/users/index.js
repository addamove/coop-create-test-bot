const users = {};

function defineNewUser(peer) {
  if (typeof users[peer.id] === 'undefined') {
    users[peer.id] = {
      start: true,
      // Создание теста
      createTest: 'init',
      currentWorkingTest: undefined,
      // храним что-нибудь что надо помнить между вызовами фун-ций
      cached: '',
      score: 0,
      currentTakingTest: undefined,
      i: 0,
    };
  }
}

module.exports = {
  defineNewUser,
  users,
};
