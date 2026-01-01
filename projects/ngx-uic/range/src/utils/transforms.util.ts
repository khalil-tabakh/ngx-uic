import { between } from "./functions.util";

export const marksAttribute = (values: number[], min: number, max: number, steps: number[]) => {
    const unique = Array.from(new Set(values));
    const sorted = unique.toSorted((a, b) => a - b);
    const marks = sorted.filter((value) => value >= min && value <= max);
    return marks.length ? marks : steps;
};

export const splitsAttribute = (values: number[], min: number, max: number) => {
    const unique = Array.from(new Set(values));
    const sorted = unique.toSorted((a, b) => a - b);
    return sorted.filter((value) => value > min && value < max);
};

export const stepAttribute = (value: number | number[] | string, min: number, max: number) => {
    if (value instanceof Array) {
        const unique = Array.from(new Set(value));
        const sorted = unique.toSorted((a, b) => a - b);
        return sorted.filter((value) => value >= min && value <= max - min);
    } else {
        const step = between(value, 0, max - min) ? Number(value) : 1;
        const length = step ? Math.floor((max - min) / step) + 1 : 0;
        return Array(length).fill(0).map((_, index) => min + step * index);
    }
};
