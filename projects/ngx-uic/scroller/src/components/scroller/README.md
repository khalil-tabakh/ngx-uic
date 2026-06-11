# NgxScrollerComponent

High-performance Angular scrolling with smart virtualization, intersection-based windowing, and automatic “first” / “last” boundary detection.
Designed for large lists, grid layouts, and dynamic content containers.

## API

### Inputs

| Input        | Type                 | Default      | Description                                                                        |
| ------------ | -------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `batch`      | `number`             | `1`          | Number of batches to load per intersection event.                                  |
| `container`  | `Element`            | host element | Where projected children live (layout source).                                     |
| `emit`       | `boolean`            | `false`      | When `true`, disables auto-emit logic and uses controlled event emission.          |
| `items`      | `T[]` *(required)*   | -            | Array of items to be rendered.                                                     |
| `offset`     | `number`             | `0`          | Number of extra tracks (rows/columns) to include before reacting to intersections. |
| `overflow`   | `boolean`            | `false`      | Enables scroll offset adjustments when virtualizing.                               |
| `root`       | `HTMLElement`        | host element | Scrollable element used as IntersectionObserver root.                              |
| `rootMargin` | `string`             | `undefined`  | Root margin for IntersectionObserver.                                              |
| `threshold`  | `number \| number[]` | `undefined`  | Visibility threshold(s).                                                           |
| `virtualize` | `boolean`            | `false`      | Enables true virtualization (shifts window instead of growing it).                 |

### Outputs

| Output  | Payload | Description                                             |
| ------- | ------- | ------------------------------------------------------- |
| `first` | `void`  | Fired when user reaches the start boundary of the list. |
| `last`  | `void`  | Fired when user reaches the end boundary of the list.   |

### Properties

| Name            | Type                          | Description                                     |
| --------------- | ----------------------------- | ----------------------------------------------- |
| `content`       | `T[]`                         | The currently visible slice of the items array. |
| `intersections` | `IntersectionObserverEntry[]` | Raw visibility entries.                         |


## Usage

```ts
import { NgxScrollerModule } from 'ngx-uic/scroller';

@Component({
    selector: 'app-demo',
    imports: [NgxScrollerModule],
    templateUrl: './demo.component.html',
    styleUrl: './demo.component.scss',
})
export class DemoComponent {
    loading = signal(false);
    items = signal(new Array(100).fill(0).map((_, index) => index));

    onReachedFirst(): void {
        this.loading.set(true);
        setTimeout(() => {
            const first = this.items().at(0)! - 1;
            this.items.update((items) => new Array(100).fill(0).map((_, index) => first - index).reverse().concat(items));
            this.loading.set(false);
        }, 3000);
    }

    onReachedLast(): void {
        this.loading.set(true);
        setTimeout(() => {
            const last = this.items().at(-1)! + 1;
            this.items.update((items) => items.concat(new Array(100).fill(0).map((_, index) => last + index)));
        t   his.loading.set(false);
        }, 3000);
    }
}
```

### Uni-directional

```html
<ngx-scroller [items]="items()" (last)="onReachedLast()" #scroller>
    @for (item of scroller.content(); track item) {
        <div>{{ item }}</div>
    }
</ngx-scroller>
```

### Bi-directional

```html
<ngx-scroller overflow [items]="items()" (first)="onReachedFirst()" (last)="onReachedLast()" #scroller>
    @for (item of scroller.content(); track item) {
        <div>{{ item }}</div>
    }
</ngx-scroller>
```

### Content Virtualization

```html
<ngx-scroller virtualize [items]="items()" (last)="onReachedLast()" #scroller>
    @for (item of scroller.content(); track item) {
        <div>{{ item }}</div>
    }
</ngx-scroller>
```

### Visibility Tracking Configuration

```html
<div class="root" #root>
    <ngx-scroller [batch]="5" [container]="container" [items]="items()" [offset]="2" [root]="root" [rootMargin]="100px" (last)="onReachedLast()" #scroller>
        <button (click)="onReachedFirst()">Reload</button>
        <div class="container" #container>
            @for (item of scroller.content(); track item) {
                <div>{{ item }}</div>
            }
        <div>
        <button (click)="onReachedLast()">Reload</button>
    </ngx-scroller>
<div>
```

### Controlled Emission

```html
<ngx-scroller [emit]="!loading()" [items]="items()" (last)="onReachedLast()" #scroller>
    @for (item of scroller.content(); track item) {
        <div>{{ item }}</div>
    }
</ngx-scroller>
```

### Dynamic Grid Layout

```html
<ngx-scroller class="grid" [items]="items()" (last)="onReachedLast()" #scroller>
    @for (item of scroller.content(); track item) {
        <div>{{ item }}</div>
    }
</ngx-scroller>
```
```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
```

### Basic Animation

```html
<ngx-scroller class="grid" [items]="items()" (last)="onReachedLast()" #scroller>
    @for (item of scroller.content(); track item) {
        <div class="card" [class.show]="scroller.intersections().at($index)?.isIntersecting">{{ item }}</div>
    }
</ngx-scroller>
```
```css
.card {
    opacity: 0;
    transform: translateX(100px);
    transition: 200ms;
}

.show {
    opacity: 1;
    transform: translateX(0);
}
```

## Virtualization Behavior

### Window Growth (virtualize = false)

The scroller expands its internal window (start → end) as the user scrolls.

### Fully Virtualized Mode (virtualize = true)

The component maintains a fixed-size window and shifts its contents dynamically as new items come into view.
