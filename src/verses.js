// Built-in KJV verses — random “Inspire me” / first paint works offline.
export const builtInVerses = [
  { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
  { reference: 'Philippians 4:8', text: 'Finally, brothers and sisters, whatever is true, whatever is honorable, whatever is right, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence and if anything worthy of praise, think about these things.' },
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  { reference: 'Proverbs 3:5–6', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
  { reference: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { reference: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.' },
  { reference: 'Matthew 11:28', text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' },
  { reference: 'Joshua 1:9', text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
  { reference: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.' },
  { reference: '2 Corinthians 5:7', text: 'For we walk by faith, not by sight.' },
  { reference: 'Psalm 119:105', text: 'Thy word is a lamp unto my feet, and a light unto my path.' },
  { reference: 'Romans 12:12', text: 'Rejoicing in hope; patient in tribulation; continuing instant in prayer.' },
  { reference: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
  { reference: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
  { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear? The Lord is the strength of my life; of whom shall I be afraid?' },
  { reference: 'Hebrews 11:1', text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
  { reference: 'Romans 8:38–39', text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.' },
  { reference: 'Psalm 34:8', text: 'O taste and see that the Lord is good: blessed is the man that trusteth in him.' },
  { reference: '1 Corinthians 16:14', text: 'Let all your things be done with charity.' },
  { reference: 'Colossians 3:2', text: 'Set your affection on things above, not on things on the earth.' },
  { reference: 'Psalm 121:1–2', text: 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the Lord, which made heaven and earth.' },
  { reference: 'Proverbs 16:3', text: 'Commit thy works unto the Lord, and thy thoughts shall be established.' },
  { reference: 'Nahum 1:7', text: 'The Lord is good, a strong hold in the day of trouble; and he knoweth them that trust in him.' },
  { reference: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.' },
  { reference: 'Psalm 37:5', text: 'Commit thy way unto the Lord; trust also in him; and he shall bring it to pass.' },
  { reference: 'Lamentations 3:22–23', text: 'It is of the Lord\'s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.' },
  { reference: 'John 14:27', text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.' },
  { reference: 'Psalm 91:1', text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.' },
  { reference: 'Romans 15:13', text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.' },
]

function cloneVerse(v) {
  return v ? { ...v } : null
}

/** Random verse from the built-in pool (offline). Prefer another row when several exist. */
export function getRandomBuiltInVerse(current = null) {
  return cloneVerse(pickRandomVerse(builtInVerses, current))
}

/**
 * Pick a random verse from a loaded list, or null if empty.
 * When `current` is set and other rows exist, prefers a different row so repeats are less likely.
 */
export function pickRandomVerse(verseList, current = null) {
  if (!verseList?.length) return null
  if (verseList.length === 1) return verseList[0]
  const others = current
    ? verseList.filter(
        (v) => v.reference !== current.reference || v.text !== current.text,
      )
    : verseList
  const pool = others.length > 0 ? others : verseList
  return pool[Math.floor(Math.random() * pool.length)]
}
