// Parse spoken dart throws like "triple 20", "double 16", "single 5", "bullseye", "bull"
// Returns the point value of the dart, or null if not recognised.

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

function parseNum(token) {
  const n = parseInt(token, 10);
  if (!isNaN(n)) return n;
  return NUMBER_WORDS[token.toLowerCase()] ?? null;
}

export function parseDartThrow(text) {
  const t = text.toLowerCase().trim();

  // Bullseye / bull = 50
  if (/\bbullseye\b|\bbull'?s eye\b/.test(t)) return { value: 50, label: "Bullseye" };
  // Outer bull / 25
  if (/\b(outer )?bull\b/.test(t) && !/bullseye/.test(t)) return { value: 25, label: "Bull (25)" };

  // Miss = 0
  if (/\bmiss(ed)?\b/.test(t)) return { value: 0, label: "Miss" };

  // Triple slang: "trip", "trips", "treble", "treb", "t20", "trip20", "triple"
  const tripleMatch = t.match(/\b(?:triple|trebles?|trebs?|trips?|tri)\s*(\w+)/);
  if (tripleMatch) {
    const n = parseNum(tripleMatch[1]);
    if (n !== null) return { value: n * 3, label: `Triple ${n}` };
  }
  // Shorthand "t20" with no space
  const tripleShort = t.match(/\bt(\d{1,2})\b/);
  if (tripleShort) {
    const n = parseInt(tripleShort[1], 10);
    if (n >= 1 && n <= 20) return { value: n * 3, label: `Triple ${n}` };
  }

  // Double slang: "dub", "dubs", "d16", "double"
  const doubleMatch = t.match(/\b(?:doubles?|dubs?)\s*(\w+)/);
  if (doubleMatch) {
    const n = parseNum(doubleMatch[1]);
    if (n !== null) return { value: n * 2, label: `Double ${n}` };
  }
  // Shorthand "d16" with no space
  const doubleShort = t.match(/\bd(\d{1,2})\b/);
  if (doubleShort) {
    const n = parseInt(doubleShort[1], 10);
    if (n >= 1 && n <= 20) return { value: n * 2, label: `Double ${n}` };
  }

  // Single slang: "single", "s5"
  const singleMatch = t.match(/\b(?:singles?)\s*(\w+)/);
  if (singleMatch) {
    const n = parseNum(singleMatch[1]);
    if (n !== null) return { value: n, label: `Single ${n}` };
  }
  const singleShort = t.match(/\bs(\d{1,2})\b/);
  if (singleShort) {
    const n = parseInt(singleShort[1], 10);
    if (n >= 1 && n <= 20) return { value: n, label: `Single ${n}` };
  }

  // Bare number — treat as single
  const bareNum = t.match(/^(\d+)$/);
  if (bareNum) {
    const n = parseInt(bareNum[1], 10);
    if (n >= 1 && n <= 60) return { value: n, label: `${n}` };
  }

  return null;
}

export function parseScore(text) {
  const numbers = text.match(/\d+/g);
  if (!numbers) return null;
  return parseInt(numbers[numbers.length - 1], 10);
}