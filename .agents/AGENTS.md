# Master UI/UX Direction: Basko Premium Local Grocery OS

## Product feel
Build the app to feel like a **premium curated grocery network**, not a cheap kirana ordering app.

The design language should feel:
- Premium
- Calm
- Fast
- Trustworthy
- Local
- Curated
- Operationally sharp
- High-end but not flashy

The app should have the feel of:
- Apple-level clarity
- Blinkit-level speed
- Instamart-level familiarity
- Notion/Superhuman-level polish
- Boutique grocery curation

Avoid:
- Overcrowded marketplace feel
- Too many colors
- Cheap discount-heavy UI
- Messy kirana catalogue look
- Generic SaaS dashboard look

Use a visual system like:
- Background: warm off-white / soft ivory
- Primary accent: deep green / black / muted gold
- Cards: rounded, elevated, soft shadows
- Typography: bold headings, clean body text
- Product cards: image-forward, clean price hierarchy
- Store cards: premium location-aware “buckets”
- Scanner app: dark/utility mode with high contrast
- Vendor app: command-center style with sharp hierarchy

---

# Consumer App UX Direction

## Core consumer concept
The consumer is not just buying from “one app.” They are entering a **local grocery network**. Each nearby store should behave like a **store bucket**.
A bucket means a geographically serviceable grocery store with its own catalog, pricing, inventory, delivery time, offers, and vendor-side operations.

The consumer can:
- Set location
- See nearby store buckets
- Select one active store
- Switch stores anytime
- Search within selected store
- (Future) Compare availability across nearby stores
- (Future) Order from multiple overlapping stores

**For MVP, multi-store availability is disabled visually, but architecture remains ready.**

## Consumer onboarding flow
1. **Brand welcome**: Premium splash. CTA: "Set my delivery location".
2. **Location permission**: Ask elegantly.
3. **Manual location**: Search address / society / sector.
4. **Store bucket discovery**: Show "Stores serving your location" as premium bucket cards.

## Store Buckets Architecture in UI
At any time the consumer has: `activeStoreId`, `deliveryLocationId`, `serviceableStores[]`, `cartGroups[]`.
Top header shows active store. Switching store reloads catalog and scopes search.

## Multi-Store Ordering UX (Future)
Consumer can add items from multiple stores. Cart becomes grouped. Checkout creates one parent order and multiple child orders.
**For MVP**: Build data model support, disable UI checkout for multi-store. Show "coming soon".

## Search UX
Search is scoped to active store. Response shape should support `activeStoreResults` and `nearbyStoreSuggestions` (disabled for now).

## Consumer App Main Screens
- **Home**: Delivery location, Active store bucket, Search bar, Category pills, Fresh today, Daily essentials.
- **Product card**: Premium hierarchy (Brand small uppercase, Product name bold, Pack size muted, Price strong).
- **Store selector modal**: Serving now, Coming soon, Suggest a store.

---

# Scanner App UX Direction

The scanner app should feel: Fast, Sharp, Industrial, Dark-mode capable, Low cognitive load, Big buttons, High contrast, Offline-safe.

## Scanner app core UX rules
- No analytics, owner reports, supplier pricing, GST editing, product publishing without approval, or destructive stock changes without manager approval.
- The scanner app submits reality. The vendor app approves risky reality.

---

# Vendor App UX Direction

The vendor app should feel like a **premium command center**.
Clear hierarchy, Role-based navigation, Actionable dashboards.

## Hierarchy
Organization Owner -> Store Owner -> Store Managers -> Inventory/POS/Delivery Staff -> Scanner Devices.

## Vendor App Navigation
Dashboard, Orders, POS, Inventory, Scanner Activity, Products, Approvals, Suppliers, Purchase Orders, Labels, Staff, Analytics, Settings.

## Vendor Approvals Center
Dedicated screen for: New products, Unknown barcodes, Stock adjustments, GRN mismatches, Write-offs, Price changes, GST changes, Refunds.
This prevents scanner mistakes from corrupting the catalog.

## Vendor Staff Management UX
Owner can invite staff by phone, assign roles/stores/permissions, manage devices.

## Vendor Store Settings UX
Store profile, GSTIN, FSSAI, Address, Service radius (with map preview), Delivery settings, POS settings.

---

# Design System Rules

Create a premium design system for Basko.
Use:
- warm ivory backgrounds
- deep grocery green as primary
- matte black for strong text/actions
- muted gold or lime accent sparingly
- soft grey dividers
- rounded cards
- clean shadows
- strong typography
- large product imagery
- calm spacing
- premium store bucket cards
- no cluttered marketplace banners

---

# Final Build Principle

Build Basko as a premium local grocery network.
- Consumer app: curated and luxurious.
- Stores: location-based grocery buckets.
- Selected store: customizes catalog, search, cart, pricing, and availability.
- Multi-store ordering: architecturally ready but disabled in MVP.
- Search: active-store scoped now, cross-store aware later.
- Vendor app: role-based command center.
- Scanner app: fast operational execution tool.
- Backend: source of truth. No client app owns inventory logic. Every action must be store-scoped, role-checked, and auditable.
