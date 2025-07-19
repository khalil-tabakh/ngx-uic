import { ResourceRef } from "@angular/core";
import { Observable } from "rxjs";

export type ScrollerLoader<Item = unknown>
    = Observable<Item[]>
    | Promise<Item[]>
    | ResourceRef<Item[]>
    | (() => Observable<Item[]>)
    | (() => Promise<Item[]>)
    | (() => ResourceRef<Item[]>);
