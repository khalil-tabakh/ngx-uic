# NgxRangeComponent

## API

### Selectors

```ts
@Component({
    selector: 'ngx-range'
})
```

### Inputs

| Name       | Type                   | Default     | Description                            | Note                                                                                         |
| ---------- | ---------------------- | ----------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `max`      | `number`               | `100`       | Maximum allowed value                  | Must be higher than `min`                                                                    |
| `mark`     | `number \| number[]`   | `[]`        | Displays step markers on the track     | Could be _discrete_ (`number[]`) or _uniform_ (`number`) values                              |
| `min`      | `number`               | `0`         | Minimum allowed value                  | Must be lower than `max`                                                                     |
| `relative` | `number`               | `undefined` | Change progress bar starting point     | `type` must be `single`                                                                      |
| `split`    | `number \| number[]`   | `[]`        | Split the track into multiple segments | Could be _discrete_ (`number[]`) or _uniform_ (`number`) values                              |
| `step`     | `number \| number[]`   | `1`         | Allowed values                         | Could be _continuous_ (`0` or `NaN`), _discrete_ (`number[]`) or _uniform_ (`number`) values |
| `type`     | `'single' \| 'double'` | `'single'`  | Range mode                             | `single` uses one thumb, `double` uses two                                                   |

💡 All numeric inputs with the `number` type accept numeric `string` values.

### Models

| Name    | Type     | Default | Description   | Note                    |
| ------- | -------- | ------- | ------------- | ----------------------- |
| `lower` | `number` | `25`    | Lower value   | `type` must be `double` |
| `upper` | `number` | `75`    | Upper value   | `type` must be `double` |
| `value` | `number` | `50`    | Current value | `type` must be `single` |

### Outputs

| Name     | Type    | Note                  |
| -------- | ------- | --------------------- |
| `change` | `Event` | Emits on pointer up   |
| `input`  | `Event` | Emits on pointer move |

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
    onChange(...values: number[]): void {
        console.log(...values);
    }

    onInput(...values: number[]): void {
        console.log(...values);
    }
}
```

### Single thumb

```html
<ngx-range type="single" min="20" max="80" value="60" step="0" (change)="onChange(range.value())" #range />
```

### Double thumb

```html
<ngx-range type="double" min="10" max="90" lower="20" upper="80" [step]="[10, 40, 90]" (input)="onInput(range.lower(), range.upper())" #range />
```

### Relative progress

```html
<ngx-range relative="50" />
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

## Accessibility Notes

* Uses native `input[type=range]` internally (hidden) for semantic value handling
* Pointer events support mouse, touch, and pen
