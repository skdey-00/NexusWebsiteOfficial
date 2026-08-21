# Team KJSSE Robocon Website

A professional, modern website for Team KJSSE Robocon robotics team, built with TypeScript and Vite.

## Features

- Modern TypeScript setup with strict type checking
- Vite for fast development and optimized production builds
- GSAP animations with ScrollTrigger
- Modular, maintainable code structure
- Hot module replacement (HMR) for development
- Responsive design with mobile-first approach
- Smooth scroll animations and interactions

## Project Structure

```
robocon-site/
├── src/
│   ├── animations/         # GSAP animation modules
│   │   ├── counters.ts
│   │   ├── circular-progress.ts
│   │   ├── hero.ts
│   │   ├── scroll-animations.ts
│   │   ├── spec-bars.ts
│   │   └── index.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions and helpers
│   │   ├── circuit.ts
│   │   ├── form-handler.ts
│   │   ├── navigation.ts
│   │   ├── particles.ts
│   │   ├── title-animation.ts
│   │   └── typewriter.ts
│   └── main.ts             # Main application entry point
├── public/                 # Static assets
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The site will be available at `http://localhost:3000`

### Building for Production

Build the optimized production bundle:
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

### Type Checking

Check TypeScript types without building:
```bash
npm run type-check
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Technology Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling
- **GSAP** - Professional-grade animation library
- **ScrollTrigger** - Scroll-based animations
- **Font Awesome** - Icon library
- **Google Fonts** - Typography (Orbitron, Rajdhani, Roboto)

## Code Features

### Modular Architecture
- Separated concerns with dedicated modules for animations, utilities, and types
- Easy to maintain and extend
- Reusable components

### Type Safety
- Full TypeScript support with strict mode
- Comprehensive type definitions for all modules
- Better IDE support and error detection

### Performance
- Optimized builds with Vite
- Code splitting and tree shaking
- Minimal bundle size

### Animations
- Smooth GSAP animations
- Scroll-triggered effects
- Particle systems
- Typewriter effects
- Counter animations
- Circular progress indicators

## Customization

### Adding New Animations

1. Create a new file in `src/animations/`
2. Export your animation function
3. Import and use in `src/main.ts`

### Adding New Utilities

1. Create a new file in `src/utils/`
2. Export your utility function/class
3. Import where needed

### Modifying Styles

All styles are in `index.html` in the `<style>` tag. For a larger project, consider extracting to a separate CSS file.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run type-check` to ensure no type errors
4. Run `npm run build` to ensure production build works
5. Submit a pull request

## License

ISC

## Contact

Team KJSSE Robocon
- Email: robocon@somaiya.edu
- Location: KJSSE, Somaiya Campus, Vidyanagar, Mumbai - 400077

---

Built with TypeScript, Vite, and GSAP
