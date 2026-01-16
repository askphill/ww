# Wakey - Monorepo

E-commerce storefront for [wakey.care](https://www.wakey.care)

## Stack

- **Framework**: Shopify Hydrogen (React Router 7)
- **Runtime**: Shopify Oxygen
- **Styling**: Tailwind CSS v4
- **Monorepo**: Turborepo + pnpm

## Getting Started

```bash
pnpm install
pnpm dev:website
```

## Packages

| Package                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `@wakey/ui`              | Design system components (Button, Stars, Accordion, etc.) |
| `@wakey/hooks`           | Shared React hooks                                        |
| `@wakey/tailwind-config` | Shared Tailwind v4 theme                                  |

## Icons

We use [Centralicons](https://centralicons.com/) for our icon library. Icons are wrapped as React components in `@wakey/ui`:

- `BagIcon` - Shopping bag
- `AddBagIcon` - Shopping bag with plus (add to bag)
- `CheckoutIcon` - Secure checkout lock
- `HamburgerIcon` - Menu toggle
- `CrossIcon` - Close/dismiss
- `SmileyIcon` - Loading indicator

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation.
