# NgxOptionDirective

`NgxOptionDirective` designates an element as a selectable option within an `NgxSelectComponent`. It manages selection state, active state, pointer interaction, and ARIA attributes while supporting both single and multiple selection modes.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxOption]',
    exportAs: 'ngxOption'
})
```

### Inputs

| Name       | Type      | Default     | Description                      |
| ---------- | --------- | ----------- | -------------------------------- |
| `disabled` | `boolean` | `false`     | Disables selection of the option |
| `value`    | `T`       | `undefined` | Value associated with the option |

💡 `boolean` inputs also accept boolean attribute syntax.

### Properties

| Name       | Type              | Description                                        |
| ---------- | ----------------- | -------------------------------------------------- |
| `element`  | `HTMLElement`     | The host option element                            |
| `selected` | `Signal<boolean>` | Indicates whether the option is currently selected |

## Usage

### Basic option

```html
<menu ngxPopup>
    <li ngxOption value="fr">France</li>
    <li ngxOption value="jp">Japan</li>
    <li ngxOption value="us">United States</li>
</menu>
```

### Disabled option

```html
<menu ngxPopup>
    <li ngxOption value="fr">France</li>
    <li ngxOption value="jp" disabled>Japan</li>
    <li ngxOption value="us">United States</li>
</menu>
```

Disabled options:

* cannot be selected.
* cannot become the active option.
* are skipped during keyboard navigation.

### Custom value

```html
<menu ngxPopup>
    <li ngxOption [value]="country">{{ country.name }}</li>
</menu>
```

Any value type may be associated with an option.

## Accessibility

### Pointer interaction

| Action                                   | Behavior                               |
| ---------------------------------------- | -------------------------------------- |
| Pointer enters the option                | Makes the option the active descendant |
| Pointer is released on the option        | Selects or toggles the option          |
| Pointer is released on a disabled option | Selection is prevented                 |

In single-selection mode, clicking an option replaces the current selection.
In multiple-selection mode, clicking an option toggles its selection.

### Active state

When the pointer enters an enabled option, it becomes the popup's active descendant.

The active option is synchronized with the popup through the `aria-activedescendant` attribute, allowing assistive technologies to announce the currently focused option during keyboard navigation.

# Behavior

The directive automatically:

* Registers itself with the parent `NgxSelectComponent`.
* Generates a unique `id` if none is provided.
* Tracks whether the option is selected.
* Tracks whether the option is the active descendant.
* Updates the popup's active option when hovered.
* Toggles its selection when clicked.
* Prevents interaction when disabled.

# Notes

* Must be used inside an `NgxSelectComponent`.
* Options are discovered automatically by the parent select.
* A unique `id` is generated automatically when needed.
* Selection state stays synchronized with the parent select.
* The directive fully supports both single- and multiple-selection modes.
* Active state is synchronized with the popup using the ARIA Active Descendant pattern.
