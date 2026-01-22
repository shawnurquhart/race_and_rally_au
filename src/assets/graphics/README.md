# Graphics Assets Directory

This directory contains all graphics assets for the Race & Rally website, organized by category.

## Directory Structure

- `logos/` - Brand logos, website logo, partner logos
- `cars/` - Images of race cars, rally cars, vehicles
- `events/` - Event banners, race event graphics, promotional images
- `sponsors/` - Sponsor logos and branding materials
- `icons/` - UI icons, social media icons, interface elements
- `backgrounds/` - Background images, hero images, textured backgrounds
- `piaa/` - PIAA brand-specific graphics, lighting product images, logos

## Usage Guidelines

1. **File Formats**: Use appropriate formats:
   - PNG for logos and icons with transparency
   - JPEG/JPG for photographs and complex images
   - SVG for scalable vector graphics (preferred for logos/icons)
   - WebP for optimized web delivery (consider converting existing images)

2. **Naming Conventions**:
   - Use kebab-case (e.g., `main-logo.svg`, `race-car-2024.jpg`)
   - Include descriptive names
   - Add size/resolution indicators if multiple versions exist (e.g., `logo-32x32.png`, `logo-64x64.png`)

3. **Optimization**:
   - Compress images before adding
   - Consider responsive image sizes
   - Use appropriate dimensions for intended use

4. **Organization**:
   - Keep related assets together
   - Consider subdirectories for complex categories
   - Maintain consistency across similar assets

## Importing in React Components

You can import graphics assets using relative paths or the configured aliases:

### Using Relative Paths
```typescript
// Example import
import logo from './logos/main-logo.svg';
import carImage from './cars/ford-escort.jpg';
import eventBanner from './events/rally-australia-2024.jpg';

// Usage in JSX
<img src={logo} alt="Race & Rally Logo" />
```

### Using Path Aliases (Recommended)
```typescript
// Using the @graphics alias configured in vite.config.ts and tsconfig.json
import logo from '@graphics/logos/main-logo.svg';
import carImage from '@graphics/cars/ford-escort.jpg';
import eventBanner from '@graphics/events/rally-australia-2024.jpg';

// Other available aliases:
import reactLogo from '@assets/react.svg'; // From src/assets
import component from '@/components/MyComponent'; // From src
```

## Adding New Assets

1. Place the asset in the appropriate category directory
2. Follow naming conventions
3. Optimize the file if necessary
4. Update this README if adding new categories
