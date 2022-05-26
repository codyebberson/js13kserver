export const DEBUG = false;

export function log(...args: any[]): void {
  if (DEBUG) {
    console.log(...args);
  }
}
