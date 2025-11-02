export const batchAttribute = (value: number | string) => Number(value) >= 1 ? Math.round(Number(value)) : 1;

export const offsetAttribute = (value: number | string) => Number(value) >= 0 ? Math.round(Number(value)) : 0;
