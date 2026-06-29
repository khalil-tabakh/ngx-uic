# NgxRangeComponent

`NgxRangeComponent` is a highly customizable range slider supporting both single- and double-thumb modes. It integrates seamlessly with Angular forms through both `ControlValueAccessor` and `FormValueControl`, supports keyboard and pointer interaction, and provides extensive styling and customization options.

## API

### Selectors

```ts
@Component({
    selector: 'ngx-range'
})
```

### Inputs

| Name       | Type                   | Default     | Description                                        | Note                                                                                         |
| ---------- | ---------------------- | ----------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `max`      | `number`               | `100`       | Maximum allowed value                              | Must be higher than `min`                                                                    |
| `mark`     | `number \| number[]`   | `[]`        | Displays step markers on the track                 | Could be _discrete_ (`number[]`) or _uniform_ (`number`) values                              |
| `min`      | `number`               | `0`         | Minimum allowed value                              | Must be lower than `max`                                                                     |
| `relative` | `number`               | `undefined` | Change progress bar starting point                 | `type` must be `single`                                                                      |
| `split`    | `number \| number[]`   | `[]`        | Split the track into multiple segments             | Could be _discrete_ (`number[]`) or _uniform_ (`number`) values                              |
| `step`     | `number \| number[]`   | `1`         | Allowed values                                     | Could be _continuous_ (`0` or `NaN`), _discrete_ (`number[]`) or _uniform_ (`number`) values |
| `stride`   | `number`               | `1`         | Number of steps moved by each keyboard arrow press | If `step` is _continuous_, `stride` defines the step size used for keyboard interaction      |
| `type`     | `'single' \| 'double'` | `'single'`  | Range mode                                         | `single` uses one thumb, `double` uses two                                                   |

💡 `number` inputs also accept numeric `string` values.

### Models

| Name       | Type                          | Default          | Description                               | Note                                  |
| ---------- | ----------------------------- | ---------------- | ----------------------------------------- | ------------------------------------- |
| `disabled` | `boolean`                     | `false`          | Disables pointer and keyboard interaction |                                       |
| `value`    | `number` / `[number, number]` | `50` / `[25,75]` | Current slider value                      | The type depends on the selected mode |

### Outputs

| Name     | Type    | Note                                       |
| -------- | ------- | ------------------------------------------ |
| `change` | `Event` | Fired continuously while the value changes |
| `input`  | `Event` | Fired when a value change is committed     |

### Queries

| Name          | Type                                         |
| ------------- | -------------------------------------------- |
| `segmentRefs` | `Signal<readonly ElementRef<HTMLElement>[]>` |
| `sliderRef`   | `Signal<ElementRef<HTMLElement>>`            |
| `thumbRefs`   | `Signal<readonly ElementRef<HTMLElement>[]>` |
| `trackRef`    | `Signal<ElementRef<HTMLElement>>`            |

### Properties

| Name       | Type                                  | Description                         | Note                    |
| ---------- | ------------------------------------- | ----------------------------------- | ----------------------- |
| `hover`    | `Resource<number>`                    | Cursor hovered value                | -                       |
| `marks`    | `Signal<readonly number[]>`           | Track marked values                 | -                       |
| `origin`   | `Signal<numer>`                       | Progress bar starting value         | `type` must be `single` |
| `segments` | `Signal<ReadonlyMap<number, number>>` | Segments starting and ending values | -                       |
| `splits`   | `Signal<readonly number[]>`           | Track splited values                | -                       |
| `steps`    | `Signal<readonly number[]>`           | Allowed values                      | -                       |

## Styling

### Classes

```css
.mark
.mark--lower    // Applied when the mark value is below the lower model or the value model (depending on the type input)
.mark--upper    // Applied when the mark value is above the upper model or the value model (depending on the type input)
.segment
.segment--hover // Applied when the cursor is on a segment
.segment--lower // Applied when the thumb associated to the lower model is on the segment
.segment--upper // Applied when the thumb associated to the upper model is on the segment
.segment--value // Applied when the thumb associated to the value model is on the segment
.slider
.thumb
.track
```

### Properties

```css
--hover-color: rgba(255, 255, 255, 0.5);
--mark-color: gray;
--progress-color: white;
--segment-color: rgba(255, 255, 255, 0.2);
--thumb-color: var(--progress-color, white);
--thumb-height: 1.25rem;
--thumb-width: var(--thumb-height);
--track-height: 0.5rem;
```

## Usage

```ts
import { NgxRangeModule } from 'ngx-uic/range';

@Component({
    selector: 'app-root',
    imports: [NgxRangeModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    filter = signal({ price: 0 })
    price = signal(0);
    priceRange = signal([10, 100]);

    filterSignalForm = form()
}
```

### Single thumb

```ts
volume = signal(0);
```
```html
<ngx-range min="0" max="1" step="0.01" [(value)]="volume" />
```

### Double thumb

```ts
height = signal([150, 180]);
```
```html
<ngx-range type="double" min="100" max="200" [(value)]="height" />
```

### Relative progress

```ts
temperature = signal(0);
```
```html
<ngx-range min="-20" max="20" relative="0" [step]="[-8, -6, -2, 0, 3, 4, 15]" [(value)]="temperature" />
```

### Reactive form

```ts
age = new FormControl(5, { nonNullable: true });
```
```html
<ngx-range min="5" max="100" [formControl]="age" />
```

### Signal form

```ts
filters = form(signal({ price: [0, 100] as [number, number] }), (schema) => {
    min(schema.price as unknown as SchemaPath<number>, 0),
    max(schema.price as unknown as SchemaPath<number>, 1000)
});
```
```html
<ngx-range type="double" [formField]="filters.price" />
```

### Marked track

```html
<ngx-range mark="5" />     <!-- A mark will be displayed on every multiple of 5 -->
<ngx-range [mark]="[5]" /> <!-- Only one mark will be displayed on the value 5 -->
```

### Splitted track

```html
<ngx-range split="20" />     <!-- A split will be displayed on every multiple of 20 -->
<ngx-range [split]="[50]" /> <!-- Only one split will be displayed on the value 50 -->
```

### Keyboard stride

```html
<ngx-range step="5" stride="2" />
```

## Accessibility

### Keyboard

The component follows the ARIA slider pattern:

| Key  | Action          |
| ---- | --------------- |
| ← ↓  | Decrease value  |
| → ↑  | Increase value  |
| Home | Jump to minimum |
| End  | Jump to maximum |

In double-slider mode, keyboard navigation automatically transfers focus to the opposite thumb when attempting to cross it.

### Pointer

* Mouse
* Pen
* Touch

are fully supported.
