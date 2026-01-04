# React Components Skill

> Wiedza o budowaniu biblioteki komponentów React.

## Stack

- **React** 17+/18+/19 (peer dependency)
- **TypeScript** 5.7+
- **Tailwind CSS** (peer dependency)
- **Vite** (bundler)

## Struktura pakietu

```
packages/react-ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAnimation.ts
│   │   └── index.ts
│   └── index.ts          # Main export
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Component Pattern

```typescript
// Button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-md font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

## Export Pattern

```typescript
// index.ts
export { Button, type ButtonProps } from './components/Button';
export { useAnimation } from './hooks/useAnimation';
```

## Package.json

```json
{
  "name": "@tomaszjarosz/react-ui",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "react": ">=17",
    "tailwindcss": ">=3"
  }
}
```

## Build

```bash
# Single package
cd packages/react-ui && bun run build

# All packages
bun run build
```

## Testing

```bash
# Unit tests
bun test

# With coverage
bun test --coverage
```

## Best Practices

1. **Peer dependencies**: React, Tailwind as peer deps
2. **Tree shaking**: Named exports, no default exports
3. **Types**: Export all types alongside components
4. **Accessibility**: Use proper ARIA attributes
5. **Styling**: Use Tailwind classes, allow className override
