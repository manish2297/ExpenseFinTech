// Utility functions for Credit/Debit Card parsing, detection, and OCR extraction

export function detectCardBrand(number) {
  const clean = (number || '').replace(/\D/g, '');
  if (/^4/.test(clean)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD';
  if (/^(60|65|81|82)/.test(clean)) return 'RUPAY';
  if (/^(34|37)/.test(clean)) return 'AMEX';
  if (/^6011/.test(clean)) return 'DISCOVER';
  return 'CARD';
}

export function formatCardNumber(text) {
  const clean = (text || '').replace(/\D/g, '').slice(0, 16);
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(text) {
  const clean = (text || '').replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}

export function extractCardDetailsFromText(rawText) {
  if (!rawText) return null;
  const lines = rawText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  let cardNumber = '';
  // Match 15 to 16 digits contiguous or with spaces/hyphens
  const numRegex = /\b(?:\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}|\d{4}[ -]?\d{6}[ -]?\d{4,5}|\d{15,16})\b/;
  const matchNum = rawText.match(numRegex);
  if (matchNum) {
    cardNumber = matchNum[0].replace(/[\s-]/g, '');
  } else {
    // Try finding chunks of 4 digits
    const fourDigitChunks = [];
    for (const line of lines) {
      const chunks = line.match(/\b\d{4}\b/g);
      if (chunks) fourDigitChunks.push(...chunks);
    }
    if (fourDigitChunks.length >= 4) {
      cardNumber = fourDigitChunks.slice(0, 4).join('');
    }
  }

  // Find expiry date MM/YY
  let expiry = '';
  const expRegex = /\b(0[1-9]|1[0-2])[\/\-](2[4-9]|[3-4][0-9])\b/;
  const matchExp = rawText.match(expRegex);
  if (matchExp) {
    expiry = `${matchExp[1]}/${matchExp[2]}`;
  }

  // Find cardholder name
  const blockedWords = [
    'VISA', 'MASTERCARD', 'RUPAY', 'AMEX', 'DISCOVER', 'AMERICAN', 'EXPRESS',
    'BANK', 'DEBIT', 'CREDIT', 'PLATINUM', 'GOLD', 'CLASSIC', 'CARD', 'VALID',
    'THRU', 'GOOD', 'EXP', 'EXPIRES', 'MONTH', 'YEAR', 'ELECTRON', 'MEMBER',
    'SINCE', 'AUTHORIZED', 'SIGNATURE', 'PAYPASS', 'PAYWAVE', 'CONTACTLESS',
    'GLOBAL', 'INTERNATIONAL', 'PREMIUM', 'REWARDS', 'TITANIUM', 'SIGNATURE'
  ];

  let holderName = '';
  for (const line of lines) {
    const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const upper = cleanLine.toUpperCase();
    if (upper.length >= 4 && upper.length <= 26) {
      const words = upper.split(/\s+/).filter(w => w.length > 1);
      const containsBlocked = words.some(w => blockedWords.includes(w));
      if (!containsBlocked && words.length >= 2 && words.length <= 4) {
        holderName = upper;
        break;
      }
    }
  }

  const brand = cardNumber ? detectCardBrand(cardNumber) : 'VISA';

  return {
    cardNumber: cardNumber ? formatCardNumber(cardNumber) : '',
    expiry,
    holderName,
    brand
  };
}

export async function performCardOcr(base64Image) {
  try {
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: 'K88289456888957',
      },
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result && result.ParsedResults && result.ParsedResults.length > 0) {
      const parsedText = result.ParsedResults[0].ParsedText || '';
      return extractCardDetailsFromText(parsedText);
    }
  } catch (error) {
    console.warn('OCR error:', error);
  }
  return null;
}

export const SAMPLE_CARDS = [
  {
    name: 'HDFC Platinum Visa',
    holderName: 'RAHUL SHARMA',
    cardNumber: '4532 8923 1102 9384',
    expiry: '09/29',
    brand: 'VISA',
    balance: 45000,
    color: '#1C1C1E'
  },
  {
    name: 'ICICI Coral Mastercard',
    holderName: 'PRIYA VERMA',
    cardNumber: '5241 6789 4432 1098',
    expiry: '11/28',
    brand: 'MASTERCARD',
    balance: 32000,
    color: '#05A46D'
  },
  {
    name: 'SBI Global RuPay',
    holderName: 'AMIT PATEL',
    cardNumber: '6082 1234 5678 9012',
    expiry: '04/30',
    brand: 'RUPAY',
    balance: 20000,
    color: '#007AFF'
  }
];
