# Christmas Tree Shop

A 3D interactive Christmas tree decorator and e-commerce application built with React, Three.js, and TypeScript.

## Features

### 3D Tree Decorator
- Interactive 3D Christmas tree with realistic rendering
- 6 ornament types: Sphere, Cube, Diamond, Gift Box, Snowflake, Heart
- 2 tree toppers: Golden Star, Crystal Snowflake
- 6 scene themes: Winter Wonderland, Classic Christmas, Midnight Magic, Cozy Fireside, Frozen North, Candy Land
- AI-powered theme generation using Gemini
- Real-time snow particles and ambient effects

### E-Commerce
- **3 Tree Sizes:**
  - Petite Pine (4ft) - $149
  - Classic Fir (6ft) - $299
  - Grand Spruce (8ft) - $499
- **Per-item pricing** for ornaments ($5.99 - $9.99) and toppers ($12.99 - $14.99)
- Shopping cart with add/remove/quantity management
- Checkout flow with shipping form
- Order confirmation with delivery estimate
- Free shipping on orders over $500

## Tech Stack

- **Frontend:** React 19, TypeScript
- **3D Graphics:** Three.js, React Three Fiber, React Three Drei
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **AI:** Google Gemini API
- **State:** Custom hooks with Convex-ready architecture

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mmtftr/gemini-christmas-tree-decorator.git
   cd gemini-christmas-tree-decorator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3010 in your browser

## Project Structure

```
├── App.tsx                    # Main application component
├── types.ts                   # TypeScript type definitions
├── components/
│   ├── PineTree.tsx          # 3D tree mesh
│   ├── Ornaments.tsx         # Ornament geometries
│   ├── TreeTopper.tsx        # Star/snowflake toppers
│   ├── Snow.tsx              # Particle snow effect
│   ├── SceneEnvironment.tsx  # Lighting and atmosphere
│   ├── ControlPanel.tsx      # Theme/tree controls + shop
│   ├── DecorationPanel.tsx   # Ornament selection
│   ├── CartIcon.tsx          # Cart button
│   ├── CartDrawer.tsx        # Shopping cart sidebar
│   ├── CheckoutForm.tsx      # Shipping address form
│   └── OrderConfirmation.tsx # Order success modal
├── data/
│   ├── products.ts           # Product catalog with prices
│   ├── themes.ts             # Scene theme configurations
│   ├── treeStore.ts          # Tree state management
│   ├── cartStore.ts          # Cart state management
│   └── sessionStore.ts       # Session ID management
├── convex/
│   ├── cart.ts               # Cart CRUD functions
│   ├── orders.ts             # Order management
│   ├── ai.ts                 # AI theme generation
│   └── session.ts            # Session management
└── services/
    └── geminiService.ts      # Gemini API (deprecated)
```

## Usage

1. **Select a Tree:** Choose from Small, Medium, or Large in the Shop tab
2. **Pick a Theme:** Select a preset theme or generate one with AI
3. **Decorate:** Switch to Decorate mode and click on the tree to place ornaments
4. **Add Topper:** Switch to Topper mode and click the tree top
5. **Checkout:** Click the cart icon, review items, and proceed to checkout

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for AI theme generation |

## Future Enhancements

- Real Stripe integration for payments
- Convex backend for persistent storage
- User accounts and order history
- More ornament types and tree styles
- Social sharing of decorated trees

## License

MIT
