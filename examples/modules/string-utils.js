exports.reverse = (s) => {
  let out = '';
  for (let i = s.length - 1; i >= 0; i--) {
    out += s[i];
  }
  return out;
}
