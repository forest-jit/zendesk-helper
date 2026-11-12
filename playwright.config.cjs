// Focused visual regressions run separately from fast checks and never use your daily profile.
const { defineConfig } = require('playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'visual.spec.cjs',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  outputDir: './test-results/visual',
  snapshotPathTemplate: '{testDir}/visual-baselines/{platform}/{arg}{ext}',
  reporter: 'list'
});
