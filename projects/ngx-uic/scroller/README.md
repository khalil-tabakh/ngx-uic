# NgxScrollerModule

The `NgxScrollerModule` provides a reusable scrollable container component for Angular applications. It includes the `NgxScrollerComponent`, a customizable Angular component for creating infinite scroll containers.

## Features

- Infinite scrolling with batch appending.
- Configurable scroll `offset` and `threshold` values.
- Emits `first` and `last` events when reaching the first or the last observed element.

## Usage

### NgxScrollerComponent

```ts
import { HttpClient } from '@angular/common/http';
import { Component, inject, linkedSignal, rxResource, signal } from '@angular/core';
import { catchError } from 'rxjs';
import { NgxScrollerModule } from 'ngx-uic/scroller';

@Component({
    selector: 'app-root',
    imports: [NgxScrollerModule], // <- Add here
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    http = inject(HttpClient);
    page = signal(0);
    stream = rxResource({
        params: this.page,
        defaultValue: [],
        stream: (request) => this.http
            .get<any[]>(`https://picsum.photos/v2/list?page=${request.params}&limit=100`)
            .pipe(catchError((error) => []))
    });
    images = linkedSignal<unknown[], unknown[]>({
        source: this.stream.value,
        computation: (images, previous) => previous?.value ? previous.value.concat(images) : images
    });
}
```
```html
<ngx-scroller [batch]="10" [items]="items()" (last)="page.set(page() + 1)">
    <ng-template let-image>
        <img [src]="image.download_url" />
    </ng-template>
</ngx-scroller>
```
