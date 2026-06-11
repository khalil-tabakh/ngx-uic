# NgxTimePipe

The `NgxTimePipe` formats a duration expressed in seconds into a human-readable time string.

It automatically converts values into `mm:ss` or `hh:mm:ss` format and supports both positive and negative durations.

## API

### Selectors

```ts
@Pipe({
    name: 'ngxTime'
})
```

### Transform

| Method            | Type                       | Description                                               |
| ----------------- | -------------------------- | --------------------------------------------------------- |
| `transform(time)` | `(time: number) => string` | Converts a duration in seconds to a formatted time string |

## Usage

### Media Current Time

```html
{{ player.currentTime | ngxTime }}
```

Example output:

```text
03:42
```

### Media Duration

```html
{{ player.duration | ngxTime }}
```

Example output:

```text
01:27:15
```

### Example

```html
{{ currentTime | ngxTime }} / {{ duration | ngxTime }}
```

Example output:

```text
12:34 / 45:00
```

## Behavior

### Minute and Second Formatting

Durations shorter than one hour are formatted as:

```text
mm:ss
```

Examples:

| Input | Output  |
| ----- | ------- |
| `5`   | `00:05` |
| `65`  | `01:05` |
| `599` | `09:59` |

### Hour Formatting

Durations of one hour or longer are formatted as:

```text
hh:mm:ss
```

Examples:

| Input  | Output     |
| ------ | ---------- |
| `3600` | `01:00:00` |
| `3661` | `01:01:01` |
| `7325` | `02:02:05` |

### Negative Values

Negative durations are prefixed with a minus sign.

Examples:

| Input   | Output      |
| ------- | ----------- |
| `-30`   | `-00:30`    |
| `-65`   | `-01:05`    |
| `-3661` | `-01:01:01` |

### Truncation

Fractional values are truncated to whole seconds.

Examples:

| Input    | Output     |
| -------- | ---------- |
| `65.9`   | `01:05`    |
| `3661.8` | `01:01:01` |

### Zero Padding

Hours, minutes, and seconds are padded with leading zeros when necessary.

Examples:

| Input  | Output     |
| ------ | ---------- |
| `5`    | `00:05`    |
| `65`   | `01:05`    |
| `3661` | `01:01:01` |

## Accessibility Notes

* Produces consistent, screen-reader-friendly time strings
* Suitable for media playback controls and duration displays
* Supports both short and long-form durations
* Handles negative time values gracefully
* Requires no additional configuration
