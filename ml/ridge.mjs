/** Ridge regression via normal equations + Cholesky. No dependencies. */
export function standardize(X) {
  const n = X.length, d = X[0].length;
  const mu = Array(d).fill(0), sg = Array(d).fill(0);
  for (const r of X) for (let j = 0; j < d; j++) mu[j] += r[j] / n;
  for (const r of X) for (let j = 0; j < d; j++) sg[j] += (r[j] - mu[j]) ** 2 / n;
  for (let j = 0; j < d; j++) sg[j] = Math.sqrt(sg[j]) || 1;
  return { mu, sg };
}
export const applyScale = (r, mu, sg) => r.map((v, j) => (v - mu[j]) / sg[j]);

export function ridgeFit(X, y, alpha) {
  const n = X.length, d = X[0].length;
  const A = Array.from({ length: d }, () => Array(d).fill(0));
  const b = Array(d).fill(0);
  const ym = y.reduce((a, c) => a + c, 0) / n;
  for (let i = 0; i < n; i++) {
    const xi = X[i], yi = y[i] - ym;
    for (let j = 0; j < d; j++) { b[j] += xi[j] * yi; for (let k = j; k < d; k++) A[j][k] += xi[j] * xi[k]; }
  }
  for (let j = 0; j < d; j++) { A[j][j] += alpha; for (let k = 0; k < j; k++) A[j][k] = A[k][j]; }
  // Cholesky solve
  const L = Array.from({ length: d }, () => Array(d).fill(0));
  for (let j = 0; j < d; j++) {
    let s = A[j][j]; for (let k = 0; k < j; k++) s -= L[j][k] ** 2;
    L[j][j] = Math.sqrt(Math.max(s, 1e-12));
    for (let i = j + 1; i < d; i++) {
      let t = A[i][j]; for (let k = 0; k < j; k++) t -= L[i][k] * L[j][k];
      L[i][j] = t / L[j][j];
    }
  }
  const z = Array(d).fill(0);
  for (let i = 0; i < d; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * z[k]; z[i] = s / L[i][i]; }
  const w = Array(d).fill(0);
  for (let i = d - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < d; k++) s -= L[k][i] * w[k]; w[i] = s / L[i][i]; }
  return { w, b: ym };
}
export const predict = (m, x) => m.b + x.reduce((s, v, j) => s + v * m.w[j], 0);
