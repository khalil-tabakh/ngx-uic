# NgxScrollerModule

The `NgxScrollerModule` provides a reusable scrollable container component for Angular applications. It includes the `NgxScrollerComponent`, a customizable Angular component for creating infinite scroll containers. It provides flexibility for loading, appending, and managing items dynamically.

## Features

- Infinite scrolling with batch appending.
- Supports asynchronous data fetching using `Observable`, `Promise` or `ResourceRef`.
- Handles dynamic item removal and resets.
- Configurable scroll `offset` and `threshold` values.
- Emits value changes via `loaded` and `loading` events.
- Reactive signal-based architecture for better performance.

## Usage

### NgxScrollerComponent

```ts
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, tap } from 'rxjs';
import { NgxScrollerModule } from 'ngx-uic/scroller';

@Component({
    selector: 'app-root',
    imports: [NgxScrollerModule], // <- Add here
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    http = inject(HttpClient);
    offset = 1;

    loadImages() {
        return this.http.get<any[]>(`https://picsum.photos/v2/list?page=${this.offset}&limit=100`).pipe(
            catchError((error) => []),
            tap((data) => data.length && this.offset++)
        );
    }
}
```
```html
<ngx-scroller
    [batch]="10"
    [loader]="loadImages.bind(this)"
>
    <ng-template let-image>
        <img [src]="image.download_url" />
    </ng-template>
</ngx-scroller>
```
