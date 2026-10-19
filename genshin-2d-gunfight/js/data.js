// Playable roster for this build: the two pixel characters supplied by the user.
window.TEYVAT_ROSTER = [
  {
    id: 1,
    zh: '赤羽',
    en: 'Faye',
    element: 'pyro',
    frames: 0,
    style: 2,
    accessory: 1,
    img: 'assets/characters/char_red.png',
    sprite: 'assets/characters/char_red_sprite.png',
    portrait: 'assets/characters/char_red_portrait.png',
    desc: '来自风与火交界处的旅行射手。红白披风与棕发在战场上格外醒目，擅长用爆裂弹点燃敌阵。',
    weaponName: '烈焰短铳',
    scale: 1.05
  },
  {
    id: 2,
    zh: '霜角',
    en: 'Frosthorn',
    element: 'cryo',
    frames: 0,
    style: 3,
    accessory: 5,
    img: 'assets/characters/char_horn.png',
    sprite: 'assets/characters/char_horn_sprite.png',
    portrait: 'assets/characters/char_horn_portrait.png',
    desc: '额生白角的霜原猎手。深绯发丝与冰蓝披肩在夜风里轻轻发亮，以寒霜弹冻结逼近的敌潮。',
    weaponName: '霜棱长铳',
    scale: 1.05
  }
];

window.ELEMENTS = {
  pyro: { name:'火', color:'#ff7048', light:'#ffd0b5', dark:'#7d231b', role:'爆裂射手', skill:'烈焰新星', burst:'灼日风暴' },
  hydro: { name:'水', color:'#58c8ff', light:'#c8f2ff', dark:'#134e73', role:'潮汐枪手', skill:'愈水之环', burst:'沧海怒涛' },
  cryo: { name:'冰', color:'#a9e8ff', light:'#e8fbff', dark:'#245f78', role:'霜华狙击', skill:'霜华爆发', burst:'凛冬冰雨' },
  electro: { name:'雷', color:'#c08aff', light:'#ead5ff', dark:'#4a246d', role:'雷霆游侠', skill:'雷链', burst:'雷霆万钧' },
  anemo: { name:'风', color:'#68e8c0', light:'#d4fff2', dark:'#1b6153', role:'疾风枪手', skill:'风涡', burst:'真空风暴' },
  geo: { name:'岩', color:'#f4bd52', light:'#ffebbd', dark:'#6e4a12', role:'磐岩重炮', skill:'磐岩护盾', burst:'天星陨落' },
  dendro: { name:'草', color:'#9adf58', light:'#e5ffc4', dark:'#3c6317', role:'森罗射手', skill:'藤蔓束缚', burst:'森罗万象' }
};
