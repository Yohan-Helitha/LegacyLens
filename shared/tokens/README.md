# shared/tokens

Single source of truth for the **Monsoon Coast** design system used across all LegacyLens apps.

## Palette

| Token | Hex | Role | Weight |
|---|---|---|---|
| `--color-dominant` | `#EDEFEE` | Background / surface | 60 % |
| `--color-secondary` | `#0F5C5C` | Brand teal, headings, primary actions | 30 % |
| `--color-accent` | `#E8792E` | Mango orange, CTAs, highlights | 10 % |
| `--color-text` | `#202426` | Body copy | — |

## Files

| File | Use in |
|---|---|
| `colors.css` | Angular (`styles.scss`), plain HTML, any CSS |
| `colors.ts` | React Native / Expo, TypeScript modules |

## Usage

### React Native / Expo
```ts
import { MonsoonCoast } from '../../shared/tokens/colors';

const styles = StyleSheet.create({
  container: { backgroundColor: MonsoonCoast.dominant },
  heading:   { color: MonsoonCoast.secondary },
  cta:       { backgroundColor: MonsoonCoast.accent },
});
```

### Angular (already wired via `styles.scss`)
```scss
.my-component {
  background: var(--color-dominant);
  color:      var(--color-secondary);
  border:     1px solid var(--color-secondary-subtle);
}
```

### Plain HTML / CSS
```html
<link rel="stylesheet" href="path/to/shared/tokens/colors.css">
<style>
  body { background: var(--color-dominant); color: var(--color-text); }
</style>
```
