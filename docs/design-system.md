# Design System: UniJobs Connect

Este sistema de diseño unifica estilos y componentes para garantizar consistencia visual, mantenibilidad y escalabilidad. Está basado en variables CSS (tokens), clases reutilizables y componentes React.

## Objetivos
- Consistencia visual en toda la app.
- Actualizaciones globales editando tokens en un solo lugar.
- Componentes con estados estándar (hover, active, disabled).
- Diseño responsive para diferentes dispositivos.

## Estructura
- Tokens y estilos base: `styles/design-system.css`
- Componentes UI: `components/ui/`
  - `Button.tsx`
  - `Container.tsx`
- Documentación y ejemplos: `pages/DesignSystem.tsx` y esta guía.

## Tokens (variables CSS)
Edita los colores, tipografías, espaciados y sombras en `styles/design-system.css` (sección `:root`).

Ejemplos:
- Colores: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-text`, `--color-bg`, `--color-border`.
- Tipografía: `--font-sans`, `--font-size-md`, `--line-height-normal`, `--weight-semibold`.
- Espaciado: `--space-2`, `--space-4`, `--space-6`, `--space-8`.
- Bordes y sombras: `--radius-md`, `--border-width`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`.

Cambiar `--color-primary` actualiza inmediatamente el color de botones primarios y elementos que lo usen.

## Tipografía
Estilos semánticos para `h1` a `h6`, además de `.subtitle` y `.text-body`.

Ejemplo HTML:
```html
<h1>Título H1</h1>
<p class="subtitle">Subtítulo de sección</p>
<p class="text-body">Texto de párrafo estándar.</p>
```

## Botones
Componentes y clases con variantes y estados.

Uso en React:
```tsx
import Button from "../components/ui/Button";

<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="action">Acción</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="primary" size="sm">Pequeño</Button>
<Button variant="primary" size="lg">Grande</Button>
<Button variant="primary" disabled>Disabled</Button>
<Button variant="secondary" loading>Loading</Button>
```

Uso con clases (HTML):
```html
<button class="btn btn--primary btn--md">Primario</button>
<button class="btn btn--secondary btn--sm" disabled>Disabled</button>
```

## Contenedores
`Container` aplica anchuras máximas por breakpoint y padding horizontal.

```tsx
import Container from "../components/ui/Container";

<Container>
  <h2>Sección</h2>
  <p>Contenido...</p>
</Container>
```

## Grid y layout
Clases para grid y responsive:

```html
<div class="ui-grid ui-grid--responsive">
  <div class="ui-card">Item 1</div>
  <div class="ui-card">Item 2</div>
  <div class="ui-card">Item 3</div>
</div>
```

- `ui-grid--responsive` define 1/2/3 columnas según `sm`, `md`, `lg`.
- Usa `ui-card` para superficies con borde, radio y sombra estándar.

## Espaciado
Utilidades mínimas: `.u-mb-2`, `.u-mb-4`, `.u-mb-6`, `.u-p-4`, `.u-p-6`. Amplía según necesidades usando los tokens de `--space-*`.

## Responsive
Breakpoints de referencia: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`. `Container` y `ui-grid--responsive` ya aplican reglas.

## Buenas prácticas
- Usa componentes y clases del sistema en nuevos desarrollos.
- Evita definir colores o tamaños inline; usa tokens.
- Cuando crees nuevos componentes, compón sobre `Button`, `Container` y `ui-card`.
- Documenta nuevas variantes y ejemplos en `pages/DesignSystem.tsx`.

## Roadmap (extensible)
- Añadir `Typography` component para tipografía programática.
- Agregar componentes `Input`, `Select`, `Textarea` con estados y validación.
- Unificar clases de `Card` y migrar superficies existentes.