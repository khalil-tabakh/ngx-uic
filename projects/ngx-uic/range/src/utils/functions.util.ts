export const between = (value: number | string, min: number, max: number) => Number(value) >= min && Number(value) <= max;

export const closest = (value: number, array: number[]) => {
    return array.length
        ? array.reduce((min, item) => Math.abs(value - item) < Math.abs(value - min) ? item : min, Number.MAX_VALUE)
        : value;
};
