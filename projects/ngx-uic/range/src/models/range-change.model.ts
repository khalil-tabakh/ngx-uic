export type RangeSimple = {
    value: number;
};

export type RangeDouble = {
    lower: number;
    upper: number;
}

export type RangeChange = RangeSimple | RangeDouble;
