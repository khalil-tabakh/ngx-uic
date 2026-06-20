export type Value<T> = [T] extends ['single'] ? number : [number, number];
