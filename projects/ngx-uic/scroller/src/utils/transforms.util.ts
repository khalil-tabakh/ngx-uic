export const batchAttribute = (value: number | string) => Number(value) > 0 ? Math.round(Number(value)) : 1;

export const offsetAttribute = (value: number | string) => {
    if (!isNaN(Number(value))) return Number(value) >= 0 ? Math.round(Number(value)) : 0;
    else return parseFloat(String(value)) ? String(value) : 0;
};
