export const between = (value: number | string, min: number, max: number) => Number(value) >= min && Number(value) <= max;

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const closest = (value: number, array: readonly number[]) => array.length
    ? array.reduce((min, item) => distance(value, item) < distance(value, min) ? item : min, Number.MAX_VALUE)
    : value;

export const distance = (value: number, origin: number) => Math.abs(value - origin);
