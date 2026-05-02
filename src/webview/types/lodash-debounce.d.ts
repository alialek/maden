declare module 'lodash/debounce.js' {
  type DebouncedFunction<T extends (...args: any[]) => unknown> = ((
    ...args: Parameters<T>
  ) => ReturnType<T> | undefined) & {
    cancel: () => void;
    flush: () => ReturnType<T> | undefined;
  };

  const debounce: <T extends (...args: any[]) => unknown>(
    func: T,
    wait?: number,
    options?: {
      leading?: boolean;
      maxWait?: number;
      trailing?: boolean;
    }
  ) => DebouncedFunction<T>;

  export default debounce;
}
