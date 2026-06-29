# NgxPopupDirective

`NgxPopupDirective` designates an element as the popup for an `NgxSelectComponent`. It provides popup management, keyboard navigation, active option tracking, and ARIA listbox semantics while supporting both native `<dialog>` elements and the HTML Popover API.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxPopup]',
    exportAs: 'ngxPopup'
})
```

### Models

| Name       | Type      | Default | Description                                   |
| ---------- | --------- | ------- | --------------------------------------------- |
| `expanded` | `boolean` | `false` | Indicates whether the popup is currently open |

### Properties

| Name      | Type                                      | Description                                              |
| --------- | ----------------------------------------- | -------------------------------------------------------- |
| `active`  | `Signal<NgxOptionDirective \| undefined>` | The currently active option used for keyboard navigation |
| `element` | `HTMLElement`                             | The popup element                                        |

## Usage

### Custom popup

```html
<ngx-select>
    <button ngxTrigger>...</button>
    <menu ngxPopup>
        <li ngxOption>Option 1</li>
        <li ngxOption>Option 2</li>
    </menu>
</ngx-select>
```

### Dialog popup

```html
<ngx-select>
    <button ngxTrigger>...</button>
    <dialog ngxPopup>
        <ul>
            <button ngxOption>Option 1</button>
            <button ngxOption>Option 2</button>
        </ul>
    </dialog>
</ngx-select>
```

⚠️ Using `<dialog>` wil prevent background scrolling.

## Accessibility

### Keyboard interaction

The directive implements the ARIA Listbox keyboard pattern.

| Key              | Action                              |
| ---------------- | ----------------------------------- |
| <kbd>↓</kbd>     | Move to the next enabled option     |
| <kbd>↑</kbd>     | Move to the previous enabled option |
| <kbd>Enter</kbd> | Select the active option            |

When the popup opens, the first option becomes active automatically.

Disabled options are skipped during navigation.

### Pointer interaction

Clicking an option:

* selects the option;
* closes the popup in single-selection mode;
* keeps the popup open in multi-selection mode.

### Popover API

Any non-dialog element automatically becomes a popover.

```html
popover="auto"
```

The directive also configures a unique `position-anchor` so the popup can be positioned relative to its trigger.

### Dialog

When the host element is a native dialog, the directive automatically configures it for modal behavior.

```html
closedby="any"
```

## Behavior

The directive automatically:

* Registers itself with the parent `NgxSelectComponent`.
* Generates a unique `id` if none is provided.
* Focuses the popup when opened and blurs it when closed.
* Keeps the active option synchronized with `aria-activedescendant`.
* Marks the associated form control as touched when the popup closes.
* Configures the popup as either a native dialog or a popover.

## Notes

* Must be used inside an `NgxSelectComponent`.
* Exactly one popup is expected per select.
* A unique popup `id` is generated automatically when needed.
* The popup receives focus when opened.
* The first option becomes active each time the popup opens.
* Compatible with both native `<dialog>` elements and the HTML Popover API.
* Automatically synchronizes its expanded state with the popup's native `toggle` event.
