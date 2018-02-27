function autoKeyboardLang(str) {
  const s = [
    'й',
    'ц',
    'у',
    'к',
    'е',
    'н',
    'г',
    'ш',
    'щ',
    'з',
    'х',
    'ъ',
    'ф',
    'ы',
    'в',
    'а',
    'п',
    'р',
    'о',
    'л',
    'д',
    'ж',
    'э',
    'я',
    'ч',
    'с',
    'м',
    'и',
    'т',
    'ь',
    'б',
    'ю',
  ];

  const r = [
    'q',
    'w',
    'e',
    'r',
    't',
    'y',
    'u',
    'i',
    'o',
    'p',
    '\\[',
    '\\]',
    'a',
    's',
    'd',
    'f',
    'g',
    'h',
    'j',
    'k',
    'l',
    ';',
    "'",
    'z',
    'x',
    'c',
    'v',
    'b',
    'n',
    'm',
    ',',
    '\\.',
  ];

  for (let i = 0; i < r.length; i += 1) {
    const reg = new RegExp(r[i], 'mig');
    str = str.replace(reg, a => (a === a.toLowerCase() ? s[i] : s[i].toUpperCase()));
  }

  return str;
}

function startChoise(bot, peer) {
  bot.sendInteractiveMessage(peer, '', [
    {
      actions: [
        {
          id: '3456',
          widget: {
            type: 'button',
            label: 'Сделать тест',
            value: 'сделать тест',
          },
        },
        {
          id: '56',
          widget: {
            type: 'button',
            label: 'Сделать опрос',
            value: 'сделать опрос',
          },
        },
      ],
    },
    {
      actions: [
        {
          id: '56',
          widget: {
            type: 'button',
            label: 'Сделать голосование',
            value: 'сделать голосование',
          },
        },
      ],
    },
  ]);
}

function checkSpell(check, correct) {
  if (correct === autoKeyboardLang(check.replace(/"/g, '')).toLowerCase()) {
    return true;
  }
  return false;
}

module.exports = {
  checkSpell,
  startChoise,
};
