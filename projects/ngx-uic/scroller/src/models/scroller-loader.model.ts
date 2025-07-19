import { ResourceRef } from "@angular/core";
import { Observable } from "rxjs";

export type Async<T> = () => Observable<T> | Promise<T>;
export type ScrollerLoader<T> = Async<T> | Observable<T> | ResourceRef<T | undefined>;
