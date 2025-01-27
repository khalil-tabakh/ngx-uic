# NgxRangeModule

The `NgxRangeModule` provides a reusable range slider component for Angular applications. It includes the `NgxRangeComponent`, a highly customizable Angular component for creating simple and double range-based sliders. It provides flexibility for setting minimum, maximum, and step values and emits events for value changes. The component is signal-driven, ensuring reactivity and optimal performance.

## Features

- Supports both **simple** and **double** range types.
- Configurable `min`, `max`, and `step` values.
- Emits value changes via `change` and `input` events.
- Dynamic styling using CSS custom properties.
- Reactive signal-based architecture for better performance.

## Usage

### NgxRangeComponent

```ts
import { NgxRangeModule } from 'ngx-uic/range';

@Component({
    selector: 'app-root',
    imports: [NgxRangeModule], // <- Add here
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {}
```
```html
<ngx-range
    type="simple"
    [min]="10"
    [step]="10"
    [max]="100"
    [value]="50"
    (change)="onRangeChange($event)"
    (input)="onRangeInput($event)">
</ngx-range>
```
```html
<ngx-range
    type="double"
    [min]="10"
    [step]="10"
    [max]="100"
    [lower]="25"
    [upper]="75"
    (change)="onRangeChange($event)"
    (input)="onRangeInput($event)">
</ngx-range>
```

### HTMLInputElement

```json
"build": {
    "builder": "@angular-devkit/build-angular:application",
    "options": {
        "styles": ["node_modules/ngx-uic/range/src/assets/styles/_ngx-range.scss"] // <- Add here
    }
}
```
```html
<input
    [style.--progress]="percentage()"
    class="ngx-range"
    type="range"
    [min]="10"
    [step]="10"
    [max]="100"
    [value]="50"
    (change)="onRangeChange($event)"
    (input)="onRangeInput($event)" />
```

## Customization

### Overridable CSS custom properties

```css
ngx-range, // Customize NgxRangeComponent
.ngx-range // Customize HTMLInputElement
{
    --progress_color: rgba(255, 255, 255, 1);

    --track_color: rgba(255, 255, 255, 0.2);
    --track_height: 0.25rem;
    --track_border: none;
    --track_radius: 0;
    --track_shadow: none;
    --track_transform: none;
    --track_transition: transform 200ms;

    --thumb_background: var(--progress_color);
    --thumb_height: calc(var(--track_height) * 4);
    --thumb_width: var(--thumb_height);
    --thumb_border: none;
    --thumb_radius: var(--thumb_width);
    --thumb_shadow: 0 0 0.5em -0.25rem black;
    --thumb_transform: none;
    --thumb_transition: transform 200ms;
}
```

### Classes for NgxRangeComponent

```css
.compact // Hide thumb(s)
.overflow // Thumb(s) overflow from track
```

### Classes for HTMLInputElement

```css
.ngx-range--compact // Hide thumb(s)
.ngx-range--overflow // Thumb(s) overflow from track
```
