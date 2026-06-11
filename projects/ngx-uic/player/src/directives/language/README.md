# NgxLanguageDirective

The `NgxLanguageDirective` provides language selection for media managed by `NgxPlayerComponent`.

It automatically discovers available languages from media sources, allows switching between language variants, and preserves playback position when changing tracks.

The directive supports both audio-only and video playback scenarios and can be used for multilingual content, dubbed media, alternate commentary tracks, and localized streams.

## API

### Selectors

```ts
@Directive({
    selector: '[ngxLanguage]',
    exportAs: 'ngxLanguage'
})
```

### Properties

| Name        | Type                        | Description                 |
| ----------- | --------------------------- | --------------------------- |
| `language`  | `WritableSignal<string>`    | Currently selected language |
| `languages` | `Signal<readonly string[]>` | Available media languages   |

## Usage

### Active Language

```html
<div ngxLanguage #ngxLanguage="ngxLanguage">
    Current: {{ ngxLanguage.language() }}
</div>
```

### Language Selector

```html
<div ngxLanguage #ngxLanguage="ngxLanguage">
    @for (lang of ngxLanguage.languages(); track lang) {
        <button
            [class.active]="lang === ngxLanguage.language()"
            (click)="ngxLanguage.language.set(lang)">
            {{ lang }}
        </button>
    }
</div>
```

### Example

```html
<ngx-player [video]="video">
    <video #video>
        <source src="podcast-en.mp3" lang="en" />
        <source src="podcast-fr.mp3" lang="fr" />
        <source src="podcast-es.mp3" lang="es" />
    </video>
    <div class="language">
        <button popovertarget="language" ngxLanguage #ngxLanguage="ngxLanguage">
            <span class="material-icons md-light">record_voice_over</span>
        </button>
        <fieldset id="language" popover>
            @for (language of ngxLanguage.languages(); track language) {
                <label>
                    <input
                        type="radio"
                        name="language"
                        [checked]="language === ngxLanguage.language()"
                        (change)="ngxLanguage.language.set(language)"
                    />
                    <span>{{ language }}</span>
                </label>
            }
        </fieldset>
    </div>
</ngx-player>
```

## Behavior

### Language Discovery

The directive automatically collects all media sources with a valid `lang` attribute.

```html
<source lang="en" />
<source lang="fr" />
<source lang="en-US" />
<source lang="fr-CA" />
```

⚠️ Sources without a `lang` attribute are ignored

### Active Language Detection

When media loads:

* The current source language becomes the active language
* The `language` signal is automatically updated
* The selected language is synchronized with the media element's `lang` attribute

⚠️ Audio sources take precedence when both audio and video elements are present

### Language Switching

When a language is selected:

* Sources matching the language are kept
* Sources with other languages are removed from the media element
* Media is reloaded when necessary
* Playback resumes from the previous position

### Playback Preservation

When changing languages:

* The current playback position is saved
* Media sources are updated
* Playback position is restored after loading metadata

This allows seamless language changes without losing progress.

## Accessibility Notes

* Compatible with standard language-selection controls
* Supports keyboard-accessible menus and buttons
* Uses native HTML language identifiers
* Can be integrated with screen-reader-friendly interfaces
* Works with localized and multilingual media content
