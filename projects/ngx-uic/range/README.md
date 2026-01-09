# NgxRangeModule

The `NgxRangeModule` provides a reusable range slider component for Angular applications. It includes the `NgxRangeComponent`, a highly customizable Angular component for creating simple and double range-based sliders. It provides flexibility for setting minimum, maximum, and step values and emits events for value changes.

## Features

✅ Simple & Double slider modes

🎯 Pointer-based interaction

⌨️ Keyboard navigation support

🔢 Flexible value configuration

📍 Discrete & custom step values

🟢 Optional tick marks

🧩 Segmented track support

📐 Custom progress origin

🎨 Dynamic styling

🧱 Built using Angular signals

## API

### Inputs

| Name     | Type                   | Default     | Description                                             | Note                                                                       |
| -------- | ---------------------- | ----------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `type`   | `'simple' \| 'double'` | `'simple'`  | Slider mode. `simple` uses one thumb, `double` uses two | -                                                                          |
| `min`    | `number`               | `0`         | Minimum allowed value                                   | Must be lower than `max`                                                   |
| `lower`  | `number`               | `25`        | Lower bound                                             | `type` must equal `double`                                                 |
| `value`  | `number`               | `50`        | Current value                                           | `type` must equal `simple`                                                 |
| `upper`  | `number`               | `75`        | Upper bound                                             | `type` must equal `double`                                                 |
| `max`    | `number`               | `100`       | Maximum allowed value                                   | Must be higher than `min`                                                  |
| `origin` | `number`               | `0`         | Change progress bar starting point                      | -                                                                          |
| `offset` | `number`               | `1`         | Keyboard increase/decrease stepping                     | `step` must equal `[]` or `0`                                              |
| `step`   | `number \| number[]`   | `1`         | Allowed values                                          | `[]` & `0` <=> continuous<br>`number` <=> uniform<br>`number[]` <=> custom |
| `splits` | `number[]`             | `[]`        | Split the track into multiple segments                  | -                                                                          |
| `marks`  | `number \| number[]`   | `undefined` | Displays step markers on the track                      | `[]` & `0` & `""` show marks on every _discrete_ `step`                    |

All numeric inputs with the `number` type accept numeric `string` values.

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
<ngx-range min="20" max="80" value="60" (change)="onChange($event)" />
```

### Dual thumb

```html
<ngx-range type="double" min="10" max="90" step="5" lower="20" upper="80" (change)="onChange($event)" />
```

### Relative progress

```html
<ngx-range origin="50" (change)="onChange($event)" />
```

## Accessibility Notes

* Uses native `input[type=range]` internally (hidden) for semantic value handling
* Pointer events support mouse, touch, and pen
* Keyboard interaction is provided by default
