# NgxTriggerDirective

`NgxTriggerDirective` designates an element as the trigger for an `NgxSelectComponent`. It automatically associates the trigger with the select popup, manages the required ARIA attributes, and supports both native dialog commands and the Popover API.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxTrigger]',
    exportAs: 'ngxTrigger'
})
```

### Properties

| Name      | Type          | Description               |
| --------- | ------------- | ------------------------- |
| `element` | `HTMLElement` | The host trigger element. |

## Usage

### Button trigger

```html
<ngx-select #ngxSelect>
    <button ngxTrigger>{{ ngxSelect.selected()?.element.textContent }}</button>
    <menu ngxPopup>
        ...
    </menu>
</ngx-select>
```

### Custom trigger

```html
<ngx-select>
    <div ngxTrigger>{{ ngxSelect.selected()?.element.textContent }}</div>
    <menu ngxPopup>
        ...
    </menu>
</ngx-select>
```

### Input button trigger

```html
<ngx-select>
    <input ngxTrigger type="button" [value]="ngxSelect.selected()?.element.textContent" />
    <menu ngxPopup>
        ...
    </menu>
</ngx-select>
```

## Accessibility

### Keyboard interaction

The trigger supports the following keyboard interaction:

| Key     | Action          |
| ------- | --------------- |
| `Enter` | Opens the popup |

For native `<button>` and `<input type="button">` elements, opening is delegated to the browser's default behavior.

### Popover API

When the popup uses the Popover API, the directive automatically configures:

```html
popovertarget="popup-id"
```

allowing browsers with Popover API support to handle popup opening natively.

### Dialog

When the popup is a `<dialog>`, the directive automatically configures:

```html
command="show-modal"
commandfor="popup-id"
```

allowing native dialog commands to open the popup.

## Behavior

The directive automatically:

* Associates the trigger with the corresponding popup.
* Synchronizes the trigger's anchor with the popup's `position-anchor`.
* Configures native dialog commands when the popup is a `<dialog>`.
* Configures the Popover API when the popup is a popover element.
* Opens the popup when activated.

## Notes

* The directive must be used inside an `NgxSelectComponent`.
* Exactly one trigger is expected for each select.
* The trigger is automatically disabled (or made inert, depending on its type) when the associated select is disabled.
* No additional JavaScript is required to associate the trigger with its popup.
