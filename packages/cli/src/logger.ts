const useColor = process.stdout.isTTY === true && process.env.NO_COLOR === undefined;
const paint = (code: number) => (text: string) =>
  useColor ? `\u001b[${code}m${text}\u001b[0m` : text;

export const color = {
  green: paint(32),
  red: paint(31),
  yellow: paint(33),
  cyan: paint(36),
  dim: paint(2),
  bold: paint(1),
};

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  line(message?: string): void;
}

export function createLogger(write: (text: string) => void = (text) => process.stdout.write(text)): Logger {
  return {
    info: (message) => write(`${color.cyan('i')} ${message}\n`),
    success: (message) => write(`${color.green('✔')} ${message}\n`),
    warn: (message) => write(`${color.yellow('!')} ${message}\n`),
    error: (message) => write(`${color.red('✖')} ${message}\n`),
    line: (message = '') => write(`${message}\n`),
  };
}
