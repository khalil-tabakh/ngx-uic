import { between } from "./functions.util";

export const marksAttribute = (value: number | number[] | string | undefined, min: number, max: number, steps: number[]) => {
    if (value === undefined) return [];
    if (value instanceof Array) {
        const unique = Array.from(new Set(value));
        const sorted = unique.toSorted((a, b) => a - b);
        return sorted.filter((mark) => mark >= min && mark <= max);
    } else {
        const mark = value && between(value, 0, max - min) ? Number(value) : 0;
        const length = mark ? Math.floor((max - min) / mark) + 1 : 0;
        return length ? Array(length).fill(0).map((_, index) => min + mark * index) : steps;
    }
};

export const maxAttribute = (value: number, min: number) => {
    return value > min ? value : min + 100;
};

export const minAttribute = (value: number, max: number) => {
    return value < max ? value : max - 100;
};

export const splitsAttribute = (value: number[], min: number, max: number) => {
    const unique = Array.from(new Set(value));
    const sorted = unique.toSorted((a, b) => a - b);
    return sorted.filter((split) => split > min && split < max);
};

export const stepAttribute = (value: number | number[] | string, min: number, max: number) => {
    if (value instanceof Array) {
        const unique = Array.from(new Set(value));
        const sorted = unique.toSorted((a, b) => a - b);
        return sorted.filter((step) => step >= min && step <= max - min);
    } else {
        const step = between(value, 0, max - min) ? Number(value) : (max - min) / 100;
        const length = step ? Math.floor((max - min) / step) + 1 : 0;
        return Array(length).fill(0).map((_, index) => min + step * index);
    }
};

export const valueAttribute = (value: number, min: number, max: number, percentage: number) => {
    return between(value, min, max) ? Number(value) : (max - min) * percentage / 100 + min;
};
