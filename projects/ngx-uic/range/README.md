# NgxRangeModule

The `NgxRangeModule` provides a reusable range slider component for Angular applications. It includes the `NgxRangeComponent`, a highly customizable Angular component for creating simple and double range-based sliders. It provides flexibility for setting minimum, maximum, and step values and emits events for value changes.

## Features

✅ Supports both **simple** and **double** range types.

🎯 Pointer-based dragging (mouse, touch, pen)

🔢 Configurable `min`, `max`, and `step` values.

🟢 Optional tick marks

🎨 Dynamic styling using CSS custom properties.

🧱 Built using Angular signals

## API

### Inputs

| Name    | Type                   | Default    | Description                                             |
| ------- | ---------------------- | ---------- | ------------------------------------------------------- |
| `type`  | `'simple' \| 'double'` | `'simple'` | Slider mode. `simple` uses one thumb, `double` uses two |
| `min`   | `number`               | `0`        | Minimum allowed value                                   |
| `lower` | `number`               | `25`       | Lower bound (double mode)                               |
| `value` | `number`               | `50`       | Current value (simple mode)                             |
| `upper` | `number`               | `75`       | Upper bound (double mode)                               |
| `max`   | `number`               | `100`      | Maximum allowed value                                   |
| `step`  | `number`               | `1`        | Step increment                                          |
| `marks` | `boolean`              | `false`    | Displays step markers on the track                      |

All numeric inputs accept `number` or numeric `string` values.

### Outputs

| Name     | Type          | Description                              |
| -------- | ------------- | ---------------------------------------- |
| `change` | `RangeChange` | Emits current values (pointer up / drag) |
| `input`  | `number`      | Emits dragged thumb value                |

### Styling

```css
ngx-range {
  --progress-color: white;
  --track-height: 0.5rem;
  --thumb-height: 1.5rem;
  --thumb-width: 1.5rem;
  --mark-color: gray;
  --mark-color-lower: red;
  --mark-color-upper: blue;
}
```

## Usage

```ts
import { NgxRangeModule, RangeChange } from 'ngx-uic/range';

@Component({
    selector: 'app-root',
    imports: [NgxRangeModule], // <- Add here
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    onChange(value: RangeChange): void {
        console.log(value);
    }
}
```

### Single thumb

```html
<ngx-range [min]="0" [value]="50" [max]="100" (change)="onChange($event)" />
```

### Dual thumb

```html
<ngx-range type="double" [min]="0"[lower]="20" [upper]="80" [max]="100" [step]="5" (change)="onChange($event)" />
```

## Accessibility Notes

* Uses native `input[type=range]` internally (hidden) for semantic value handling
* Pointer events support mouse, touch, and pen
* Keyboard interaction is not provided by default
