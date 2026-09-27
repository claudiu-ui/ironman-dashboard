const healthData = `--- 20260921 ---
Steps: 6,486 | Calories: 1,162 kcal
--- 20260927 ---
Steps: 194 | Calories: 31 kcal`;

function extractRegex(str, pattern, isCommaNumber = false) {
  if (!str || typeof str !== 'string') return null;
  
  // Create a global RegExp to get all matches
  // If pattern is already global, we use it, otherwise add 'g' flag
  const gPattern = new RegExp(pattern, 'g');
  const matches = [...str.matchAll(gPattern)];
  
  if (matches.length === 0) return null;
  
  // Get the last match
  const m = matches[matches.length - 1];
  
  if (isCommaNumber) {
    return Number(m[1].replace(/,/g, ''));
  }
  return Number(m[1]);
}

console.log(extractRegex(healthData, /Steps:\s*([\d,]+)/, true));
