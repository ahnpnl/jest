import type {Config} from '@jest/types';

export function watchModePlugin(): Config.JestPlugin {
  return {
    name: 'jest:watch-mode-plugin',
    subscribeToWatchMode(hooks) {
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
    executeInteractiveAction(globalConfig, updateConfigAndRun) {
      console.log('Watch plugin action triggered');
      return Promise.resolve();
    },
  };
}
