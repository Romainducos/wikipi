// Différences ligne à ligne entre deux textes (plus longue sous-séquence
// commune). Renvoie [{ type: "same" | "add" | "del", text }].
export const lineDiff = (before = "", after = "") => {
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];

  // lcs[i][j] = longueur de la plus longue sous-séquence commune de a[i..] et b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: "del", text: a[i++] });
    } else {
      result.push({ type: "add", text: b[j++] });
    }
  }
  while (i < a.length) result.push({ type: "del", text: a[i++] });
  while (j < b.length) result.push({ type: "add", text: b[j++] });
  return result;
};
