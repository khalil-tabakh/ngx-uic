# NgxSelectComponent

`NgxSelectComponent` is a lightweight, fully customizable select component for Angular. It supports single and multiple selection, integrates seamlessly with Angular Forms through both `ControlValueAccessor` and `FormValueControl`, and allows complete control over the trigger, popup, and option templates.

## API

### Selectors

```ts
@Component({
    selector: 'ngx-select, [ngx-select]',
    exportAs: 'ngxSelect'
})
```

### Inputs

| Name    | Type      | Default | Description                     |
| ------- | --------- | ------- | ------------------------------- |
| `multi` | `boolean` | `false` | Enables multiple selection mode |

💡 `boolean` inputs also accept boolean attribute syntax.

### Models

| Name       | Type                         | Default | Description               | Note                                  |
| ---------- | ---------------------------- | ------- | ------------------------- | ------------------------------------- |
| `disabled` | `boolean`                    | `false` | Disables user interaction | -                                     |
| `value`    | `V \| null` / `readonly V[]` | `null`  | Selected value(s)         | The type depends on the `multi` input |

### Outputs

| Name     | Description                            |
| -------- | -------------------------------------- |
| `change` | Fired after the selection has changed. |
| `input`  | Fired whenever the selection changes.  |

### Queries

| Name      | Type                                    | Description                             |
| --------- | --------------------------------------- | --------------------------------------- |
| `options` | `Signal<readonly NgxOptionDirective[]>` | Available options.                      |
| `popup`   | `Signal<NgxPopupDirective>`             | Popup containing the options.           |
| `trigger` | `Signal<NgxTriggerDirective>`           | Trigger element used to open the popup. |

### Properties

| Name       | Type                                                                                | Description                  | Note                                  |
| ---------- | ----------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------- |
| `selected` | `Signal<NgxOptionDirective \| undefined>` / `Signal<readonly NgxOptionDirective[]>` | Currently selected option(s) | The type depends on the `multi` input |

### Styling

The component itself renders no DOM other than projecting its content.

Styling is entirely delegated to the projected trigger, popup and option elements.

## Usage

### Single selection

```ts
country = signal<string | null>(null);
```
```html
<ngx-select [(value)]="country" #ngxSelect>
    <button ngxTrigger>{{ ngxSelect.selected()?.element.textContent }}</button>
    <menu ngxPopup>
        <li ngxOption value="fr">France</li>
        <li ngxOption value="jp">Japan</li>
        <li ngxOption value="us">United States</li>
    </menu>
</ngx-select>
```

### Multiple selection

```ts
countries = signal<string[]>([]);
```
```html
<ngx-select multi [(value)]="countries" #ngxSelect>
    <button ngxTrigger>{{ ngxSelect.selected()?.map((option) => option.element.textContent).toString() }}</button>
    <menu ngxPopup>
        <li ngxOption value="fr">France</li>
        <li ngxOption value="jp">Japan</li>
        <li ngxOption value="us">United States</li>
    </menu>
</ngx-select>
```

⚠️ Selections preserve the initial option order.

### Reactive form

```ts
country = new FormControl(null);
```
```html
<ngx-select [formControl]="country" #ngxSelect>
    <button ngxTrigger>{{ ngxSelect.selected()?.element.textContent }}</button>
    <menu ngxPopup>
        <li ngxOption value="fr">France</li>
        <li ngxOption value="jp">Japan</li>
        <li ngxOption value="us">United States</li>
    </menu>
</ngx-select>
```

### Signal form

```ts
profile = form(signal({ country: null }));
```
```html
<ngx-select [formField]="profile.country" #ngxSelect>
    <button ngxTrigger>{{ ngxSelect.selected()?.element.textContent }}</button>
    <menu ngxPopup>
        <li ngxOption value="fr">France</li>
        <li ngxOption value="jp">Japan</li>
        <li ngxOption value="us">United States</li>
    </menu>
</ngx-select>
```

### Programmatic selection

```ts
ngxSelect.toggle('jp');
ngxSelect.toggle('jp', true);  // Select
ngxSelect.toggle('jp', false); // Deselect
```

## Accessibility

The component delegates accessibility to its projected content.
