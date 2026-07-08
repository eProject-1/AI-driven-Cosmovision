export function levenshteinDistance(a, b) {
  if (a.length > b.length) [a, b] = [b, a];
  const aLen = a.length, bLen = b.length;
  if (aLen === 0) return bLen;
  let prevRow = new Array(aLen + 1);
  for (let j = 0; j <= aLen; j++) prevRow[j] = j;
  for (let i = 1; i <= bLen; i++) {
    const currRow = new Array(aLen + 1);
    currRow[0] = i;
    for (let j = 1; j <= aLen; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      currRow[j] = Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost);
    }
    prevRow = currRow;
  }
  return prevRow[aLen];
}

export function similarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  if (str1 === str2) return 1.0;
  return (maxLen - levenshteinDistance(str1, str2)) / maxLen;
}

export function findMatchedKeywords(normalizedMessage, keywords, fuzzyThreshold = 0.78) {
  const message = normalizedMessage.trim();
  const messageWords = message.split(/\s+/);

  return keywords.filter((keyword) => {
    if (message.includes(keyword)) return true;

    if (keyword.includes(" ")) {
      const kwWords = keyword.split(/\s+/);
      const kwCount = kwWords.length;
      for (let i = 0; i <= messageWords.length - kwCount; i++) {
        const subPhrase = messageWords.slice(i, i + kwCount).join(" ");
        if (similarity(subPhrase, keyword) >= fuzzyThreshold) return true;
      }
      return false;
    }

    return messageWords.some(
      (word) => word === keyword || (word.length > 3 && similarity(word, keyword) >= fuzzyThreshold)
    );
  });
}

export function hasKeyword(normalizedMessage, keywords, fuzzyThreshold = 0.78) {
  return findMatchedKeywords(normalizedMessage, keywords, fuzzyThreshold).length > 0;
}
