import { NgxOptionDirective } from "../directives/option/option.directive";

export type Multi<M> = [M] extends [false | null | undefined]
    ? false
    : [M] extends [number | object | string | true]
        ? true
        : [M] extends [boolean]
            ? boolean
            : false;

export type Selected<M> = Multi<M> extends false
    ? NgxOptionDirective | undefined
    : Multi<M> extends true
        ? ReadonlyArray<NgxOptionDirective>
        : ReadonlyArray<NgxOptionDirective> | NgxOptionDirective | undefined;

export type Value<M, V> = Multi<M> extends false
    ? V | undefined
    : Multi<M> extends true
        ? V extends Array<infer T> ? ReadonlyArray<T> : never
        : unknown;
