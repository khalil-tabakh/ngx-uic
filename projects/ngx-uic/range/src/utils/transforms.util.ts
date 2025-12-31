export const marksAttribute = (values: number[], min: number, max: number, step: number) => {
    const unique = Array.from(new Set(values));
    const sorted = unique.toSorted((a, b) => a - b);
    const marks = sorted.filter((value) => value >= min && value <= max);
    const length = step ? (max - min) / step + 1 : 0;
    return marks.length ? marks : Array(length).fill(0).map((_, index) => min + step * index);
};

export const splitsAttribute = (values: number[], min: number, max: number) => {
    const unique = Array.from(new Set(values));
    const sorted = unique.toSorted((a, b) => a - b);
    return sorted.filter((value) => value > min && value < max);
}
