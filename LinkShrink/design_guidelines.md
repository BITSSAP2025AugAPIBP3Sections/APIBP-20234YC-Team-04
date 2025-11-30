# Design Guidelines: URL Shortening Service

## Design Approach
**Selected Approach:** Design System-inspired (Linear/Notion productivity aesthetic)
**Rationale:** URL shortening is a utility-focused tool where efficiency and clarity trump visual flair. Drawing from modern productivity tools that prioritize clean interfaces and quick task completion.

**Key Principles:**
- Function-first: Every element serves a purpose
- Instant feedback: Clear visual confirmation for actions
- Minimal friction: Shortest path to shortening a URL
- Data clarity: Statistics and URL lists are immediately scannable

---

## Core Design Elements

### Typography
- **Primary Font:** Inter or system font stack via Google Fonts
- **Headings:** 
  - H1: text-4xl font-semibold (main title)
  - H2: text-2xl font-semibold (section headers)
  - H3: text-lg font-medium (card titles)
- **Body:** text-base font-normal
- **Labels:** text-sm font-medium (form labels, metadata)
- **Monospace:** font-mono text-sm (for URLs, short codes)

### Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-6 or p-8
- Section gaps: gap-6 or gap-8
- Element margins: m-2, m-4
- Container max-width: max-w-4xl (keep interface focused, not stretched)

### Component Library

**A. Primary Interface**
1. **URL Input Card** (Hero Section Replacement)
   - Prominent card at page top with p-8
   - Large text input field for original URL
   - Primary "Shorten URL" button
   - Inline validation feedback
   - No background image - clean, focused card design

2. **Result Display**
   - Immediately show shortened URL after creation
   - Large, copyable short URL in monospace font
   - One-click copy button with success state
   - QR code display (small, secondary)
   - Original URL preview (truncated with ellipsis)

**B. URL Management Table**
3. **Recent URLs List**
   - Clean table/card hybrid layout
   - Columns: Short Code, Original URL (truncated), Clicks, Created Date, Actions
   - Hover states on rows
   - Copy button per row
   - Delete action (icon only)
   - Empty state with helpful message

4. **Statistics Cards**
   - Small metric cards in grid (2-3 columns on desktop)
   - Total URLs Created, Total Clicks, Most Popular Link
   - Large number display with text-3xl
   - Icon + label + metric pattern

**C. Navigation & Structure**
5. **Top Navigation**
   - Simple header with logo/title
   - Minimal nav items (if any - this is single-purpose)
   - User account indicator (if auth implemented)

6. **Footer**
   - API documentation link
   - GitHub/source code link
   - Simple copyright text
   - Minimal, unobtrusive

### Form Elements
- **Text Inputs:** Rounded borders (rounded-lg), generous padding (px-4 py-3)
- **Buttons:** 
  - Primary: Solid fill, medium size (px-6 py-3)
  - Secondary: Border style for less important actions
  - Icon buttons: Square with rounded corners for copy/delete
- **Copy Feedback:** Toast notification or inline checkmark animation

### Data Display
- **URL Cards/Rows:** Alternate subtle background on hover
- **Monospace URLs:** Ensure readability, prevent line breaks awkwardly
- **Click Counts:** Badge-style numbers or simple text
- **Timestamps:** Relative time (e.g., "2 hours ago") with tooltip for exact date

### Interactions & States
- **Copy Action:** Instant visual feedback (button changes to checkmark, brief toast)
- **Form Validation:** Inline error messages below input
- **Loading States:** Subtle spinner on button during API calls
- **Empty States:** Friendly illustration or icon with helpful text

---

## Page Structure

**Single-Page Layout:**
1. Header (fixed or static, minimal height)
2. URL Shortening Card (centered, max-w-2xl)
3. Quick Stats Row (if URLs exist)
4. Recent URLs Table/List (scrollable if needed)
5. Footer (minimal)

**Responsive Behavior:**
- Desktop: Two-column stats, full table
- Tablet: Single column stats, simplified table
- Mobile: Stack everything, horizontal scroll table if needed

---

## Images
**Hero Section:** No large hero image - replaced with functional URL input card
**Decorative Elements:** Minimal - only small icons for actions (copy, delete, external link)
**Empty States:** Simple icon or small illustration when no URLs exist yet

---

## Accessibility
- Form labels properly associated
- ARIA labels for icon-only buttons
- Keyboard navigation for all interactive elements
- Focus indicators on inputs and buttons
- High contrast between text and backgrounds