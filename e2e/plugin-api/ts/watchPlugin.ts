import type {Config} from '@jest/types';

export function watchModePlugin(): Config.JestPlugin {
  return {
    name: 'jest:watch-mode-plugin',
    apply(hooks) {
      hooks.onTestRunComplete(results => {
        console.log(`Watch plugin: ${results.numPassedTests} tests passed`);
      });
    },
    getUsageInfo() {
      return {
        key: 'w',
        prompt: 'watch mode plugin action',
      };
    },
    run(globalConfig, updateConfigAndRun) {
      console.log('Watch plugin action triggered');
      return Promise.resolve();
    },
  };
}
