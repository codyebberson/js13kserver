export interface Storage {
  get<T>(key: string, defaultValue?: T, json = true): Promise<T>;

  set(key: string, value: any, json = true): Promise<void>;

  remove(key: string): Promise<void>;

  clear(): Promise<void>;

  length(): Promise<number>;

  size(): number;
}
