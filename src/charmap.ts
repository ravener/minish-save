
/**
 * Japanese character mappings.
 * Many of these conflict with the ASCII namespace and are incompatible with other regions.
 * But is used as a base for other regions, as some leftover Japanese characters can still render in other regions.
 */
export const jpCharmap: Record<number, string> = {
    0x10: 'あ', // Visible in other regions
    0x11: 'ア', // Visible in other regions
    0x12: 'い', // Visible in other regions
    0x13: 'イ', // Visible in other regions
    0x14: 'う', // Visible in other regions
    0x15: 'を', // Visible in other regions
    0x16: 'え', // Visible in other regions
    0x17: 'エ', // Visible in other regions
    0x18: 'お', // Visible in other regions
    0x19: 'オ', // Visible in other regions
    0x1A: 'ぁ', // Visible in other regions
    0x1B: 'ァ', // Visible in other regions
    0x1C: 'ぃ', // Visible in other regions
    0x1D: 'ィ', // Visible in other regions
    0x1E: 'ぅ', // Visible in other regions
    0x1F: 'ゥ', // Visible in other regions
    0x20: ' ',
    0x21: '!',
    0x23: 'わ', // Visible in other regions
    0x24: 'ワ', // Visible in other regions
    0x25: 'っ', // Visible in other regions
    0x26: 'ッ', // Visible in other regions
    0x27: '\'',
    0x28: '(',
    0x29: ')',
    0x2A: '、',
    0x2B: '。',
    0x2C: ',',
    0x2D: '-',
    0x2E: '.',
    0x2F: 'ヲ', // Visible in other regions
    0x30: '0',
    0x31: '1',
    0x32: '2',
    0x33: '3',
    0x34: '4',
    0x35: '5',
    0x36: '6',
    0x37: '7',
    0x38: '8',
    0x39: '9',
    0x3A: ':',
    0x3B: 'ぇ', // Visible in other regions
    0x3C: 'ェ', // Visible in other regions
    0x3D: 'ぉ', // Visible in other regions
    0x3E: 'ォ', // Visible in other regions
    0x3F: '?',
    0x40: '〜', // Visible in other regions
    0x41: 'A',
    0x42: 'B',
    0x43: 'C',
    0x44: 'D',
    0x45: 'E',
    0x46: 'F',
    0x47: 'G',
    0x48: 'H',
    0x49: 'I',
    0x4A: 'J',
    0x4B: 'K',
    0x4C: 'L',
    0x4D: 'M',
    0x4E: 'N',
    0x4F: 'O',
    0x50: 'P',
    0x51: 'Q',
    0x52: 'R',
    0x53: 'S',
    0x54: 'T',
    0x55: 'U',
    0x56: 'V',
    0x57: 'W',
    0x58: 'X',
    0x59: 'Y',
    0x5A: 'Z',
    0x5B: 'ぬ', // Visible in other regions
    0x5C: 'や', // Visible in other regions
    0x5D: 'ヤ', // Visible in other regions
    0x5E: 'ゆ', // Visible in other regions
    0x5F: 'ユ', // Visible in other regions
    0x60: '`',
    0x61: 'a',
    0x62: 'b',
    0x63: 'c',
    0x64: 'd',
    0x65: 'e',
    0x66: 'f',
    0x67: 'g',
    0x68: 'h',
    0x69: 'i',
    0x6A: 'j',
    0x6B: 'k',
    0x6C: 'l',
    0x6D: 'm',
    0x6E: 'n',
    0x6F: 'o',
    0x70: 'p',
    0x71: 'q',
    0x72: 'r',
    0x73: 's',
    0x74: 't',
    0x75: 'u',
    0x76: 'v',
    0x77: 'w',
    0x78: 'x',
    0x79: 'y',
    0x7A: 'z',
    0x7B: 'ヌ', // Visible in other regions
    0x7C: 'よ', // Visible in other regions
    0x7D: 'ヨ', // Visible in other regions
    0x7E: 'ん', // Visible in other regions
    0x7F: 'ン', // Visible in other regions
    0x80: 'な',
    0x81: 'ナ',
    0x82: 'に',
    0x83: 'ニ',
    0x84: 'ー',
    0x85: '…',
    0x86: 'ね',
    0x87: 'ネ',
    0x88: 'の',
    0x89: 'ノ',
    0x8A: 'ま',
    0x8B: 'マ',
    0x8C: 'み',
    0x8D: 'ミ',
    0x8E: 'む',
    0x8F: 'ム',
    0x90: 'め',
    0x91: 'メ',
    0x92: 'も',
    0x93: 'モ',
    0x94: 'ら',
    0x95: 'ラ',
    0x96: 'り',
    0x97: 'リ',
    0x98: 'る',
    0x99: 'ル',
    0x9A: 'れ',
    0x9B: 'レ',
    0x9C: 'ろ',
    0x9D: 'ロ',
    0x9E: 'ゃ',
    0x9F: 'ャ',
    0xA0: 'ゅ',
    0xA1: 'ュ',
    0xA2: 'ょ',
    0xA3: 'ョ',
    0xA4: 'ヴ',
    0xA5: 'が',
    0xA6: 'ガ',
    0xA7: 'ぎ',
    0xA8: 'ギ',
    0xA9: 'ぐ',
    0xAA: 'グ',
    0xAB: 'げ',
    0xAC: 'ゲ',
    0xAD: 'ご',
    0xAE: 'ゴ',
    0xAF: 'ざ',
    0xB0: 'ザ',
    0xB1: 'じ',
    0xB2: 'ジ',
    0xB3: 'ず',
    0xB4: 'ズ',
    0xB5: 'ぜ',
    0xB6: 'ゼ',
    0xB7: 'ぞ',
    0xB8: 'ゾ',
    0xB9: 'だ',
    0xBA: 'ダ',
    0xBB: 'ぢ',
    0xBC: 'ヂ',
    0xBD: 'づ',
    0xBE: 'ヅ',
    0xBF: 'で',
    0xC0: 'デ',
    0xC1: 'ど',
    0xC2: 'ド',
    0xC3: 'ば',
    0xC4: 'バ',
    0xC5: 'び',
    0xC6: 'ビ',
    0xC7: 'ぶ',
    0xC8: 'ブ',
    0xC9: 'べ',
    0xCA: 'ベ',
    0xCB: 'ぼ',
    0xCC: 'ボ',
    0xCD: 'ぱ',
    0xCE: 'パ',
    0xCF: 'ぴ',
    0xD0: 'ピ',
    0xD1: 'ぷ',
    0xD2: 'プ',
    0xD3: 'ぺ',
    0xD4: 'ペ',
    0xD5: 'ぽ',
    0xD6: 'ポ',
    0xD7: 'ウ',
    0xD8: 'か',
    0xD9: 'カ',
    0xDA: 'き',
    0xDB: 'キ',
    0xDC: 'く',
    0xDD: 'ク',
    0xDE: 'け',
    0xDF: 'ケ',
    0xE0: 'こ',
    0xE1: 'コ',
    0xE2: 'さ',
    0xE3: 'サ',
    0xE4: 'し',
    0xE5: 'シ',
    0xE6: 'す',
    0xE7: 'ス',
    0xE8: 'せ',
    0xE9: 'セ',
    0xEA: 'そ',
    0xEB: 'ソ',
    0xEC: 'た',
    0xED: 'タ',
    0xEE: 'ち',
    0xEF: 'チ',
    0xF0: 'つ',
    0xF1: 'ツ',
    0xF2: 'て',
    0xF3: 'テ',
    0xF4: 'と',
    0xF5: 'ト',
    0xF6: 'は',
    0xF7: 'ハ',
    0xF8: 'ひ',
    0xF9: 'ヒ',
    0xFA: 'ふ',
    0xFB: 'フ',
    0xFC: 'へ',
    0xFD: 'ヘ',
    0xFE: 'ほ',
    0xFF: 'ホ'
};

export const charmap: Record<number, string> = {
    ...jpCharmap,
    0x82: '‚', // Not in keyboard
    0x84: '„', // Not in keyboard
    0x8A: 'Š', // Not in keyboard
    0x8B: '‹', // Not in keyboard
    0x8C: 'Œ',
    0x8E: 'Ž', // Not in keyboard
    0x91: '‘', // Not in keyboard
    0x92: '’', // Not in keyboard
    0x93: '“', // Not in keyboard
    0x94: '”', // Not in keyboard
    0x95: '•', // Not in keyboard
    0x99: '™', // Not in keyboard
    0x9A: 'š', // Not in keyboard
    0x9B: '›', // Not in keyboard
    0x9C: 'œ',
    0x9E: 'ž', // Not in keyboard
    0x9F: 'Ÿ', // Not in keyboard
    0xA1: '¡', // Not in keyboard
    0xA3: '♪', // Not in keyboard
    0xAA: 'ª', // Not in keyboard
    0xAB: '«', // Not in keyboard
    0xB0: '°', // Not in keyboard
    0xB4: '´', // Not in keyboard
    0xB7: '·', // Not in keyboard
    0xBA: 'º', // Not in keyboard
    0xBB: '»', // Not in keyboard
    0xBF: '¿', // Not in keyboard
    0xC0: 'À',
    0xC1: 'Á', // EU
    0xC2: 'Â',
    0xC3: 'Ã', // Not in keyboard
    0xC4: 'Ä',
    0xC5: 'Å', // Not in keyboard
    0xC6: 'Æ',
    0xC7: 'Ç',
    0xC8: 'È',
    0xC9: 'É',
    0xCA: 'Ê',
    0xCB: 'Ë',
    0xCC: 'Ì',
    0xCD: 'Í', // EU
    0xCE: 'Î',
    0xCF: 'Ï',
    0xD0: 'Ð',
    0xD1: 'Ñ',
    0xD2: 'Ò',
    0xD3: 'Ó', // EU
    0xD4: 'Ô',
    0xD5: 'Õ', // Not in keyboard
    0xD6: 'Ö',
    0xD7: '×', // Not in keyboard
    0xD8: 'Ø', // Not in keyboard
    0xD9: 'Ù',
    0xDA: 'Ú', // EU
    0xDB: 'Û',
    0xDC: 'Ü',
    0xDD: 'Ý', // Not in keyboard
    0xDE: 'Þ', // Not in keyboard
    0xDF: 'ß', // EU
    0xE0: 'à',
    0xE1: 'á', // EU
    0xE2: 'â',
    0xE3: 'ã', // Not in keyboard
    0xE4: 'ä',
    0xE5: 'å', // Not in keyboard
    0xE6: 'æ',
    0xE7: 'ç',
    0xE8: 'è',
    0xE9: 'é',
    0xEA: 'ê',
    0xEB: 'ë',
    0xEC: 'ì',
    0xED: 'í', // EU
    0xEE: 'î',
    0xEF: 'ï',
    0xF0: 'ð',
    0xF1: 'ñ',
    0xF2: 'ò',
    0xF3: 'ó', // EU
    0xF4: 'ô',
    0xF5: 'õ', // Not in keyboard
    0xF6: 'ö',
    0xF7: '÷', // Not in keyboard
    0xF8: 'ø', // Not in keyboard
    0xF9: 'ù',
    0xFA: 'ú', // EU
    0xFB: 'û',
    0xFC: 'ü',
    0xFD: 'ý', // Not in keyboard
    0xFE: 'þ', // Not in keyboard
    0xFF: 'ÿ' // Not in keyboard
};

// Remove characters that instead of inheriting the international version removed entirely
// Note: ASCII here refers to the extended ASCII table from Windows-1252 character set.
delete charmap[0x80]; // ASCII €
delete charmap[0x81]; // ASCII unused
delete charmap[0x83]; // ASCII ƒ
delete charmap[0x86]; // ASCII †
delete charmap[0x87]; // ASCII ‡
delete charmap[0x88]; // ASCII ˆ
delete charmap[0x89]; // ASCII ‰
delete charmap[0x8D]; // ASCII unused
delete charmap[0x8F]; // ASCII unused
delete charmap[0x90]; // ASCII unused
delete charmap[0x96]; // ASCII – (en dash)
delete charmap[0x97]; // ASCII — (em dash)
delete charmap[0x98]; // ASCII ˜ (small tilde)
delete charmap[0x9D]; // ASCII unused
delete charmap[0xA0]; // ASCII  (non-breaking space)
delete charmap[0xA2]; // ASCII ¢
delete charmap[0xA4]; // ASCII ¤
delete charmap[0xA5]; // ASCII ¥
delete charmap[0xA6]; // ASCII ¦
delete charmap[0xA7]; // ASCII §
delete charmap[0xA8]; // ASCII ¨
delete charmap[0xA9]; // ASCII ©
delete charmap[0xAC]; // ASCII ¬
delete charmap[0xAD]; // ASCII ­ (soft hyphen)
delete charmap[0xAE]; // ASCII ®
delete charmap[0xAF]; // ASCII ¯
delete charmap[0xB1]; // ASCII ±
delete charmap[0xB2]; // ASCII ²
delete charmap[0xB3]; // ASCII ³
delete charmap[0xB5]; // ASCII µ
delete charmap[0xB6]; // ASCII ¶
delete charmap[0xB8]; // ASCII ¸
delete charmap[0xB9]; // ASCII ¹
delete charmap[0xBC]; // ASCII ¼
delete charmap[0xBD]; // ASCII ½
delete charmap[0xBE]; // ASCII ¾

export const jpReverseCharmap: Record<string, number> = Object.fromEntries(
    Object.entries(jpCharmap).map(([byte, char]) => [char, Number(byte)])
);

export const reverseCharmap: Record<string, number> = Object.fromEntries(
    Object.entries(charmap).map(([byte, char]) => [char, Number(byte)])
);