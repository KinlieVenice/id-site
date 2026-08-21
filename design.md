---
name: Studio Precision
colors:
  surface: '#faf9ff'
  surface-dim: '#ccdaff'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d8e2ff'
  on-surface: '#051a3e'
  on-surface-variant: '#434654'
  inverse-surface: '#1d3054'
  inverse-on-surface: '#edf0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#535f73'
  on-secondary: '#ffffff'
  secondary-container: '#d4e0f8'
  on-secondary-container: '#576377'
  tertiary: '#7b2600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d7e3fb'
  secondary-fixed-dim: '#bbc7de'
  on-secondary-fixed: '#101c2d'
  on-secondary-fixed-variant: '#3b475b'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#faf9ff'
  on-background: '#051a3e'
  surface-variant: '#d8e2ff'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 320px
  toolbar-height: 56px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is built for a professional ID photo editing environment. The brand personality is utilitarian, precise, and unobtrusive, acting as a neutral frame for user content. The design style follows a **Corporate / Modern** approach with a "Studio" aesthetic—prioritizing clarity, tool-like density, and functional hierarchy. It aims to evoke a sense of reliability and expert control, ensuring users feel confident in the compliance and quality of their generated identification photos. High whitespace is used not for decoration, but to separate distinct functional zones (Canvas vs. Controls).

## Colors
The palette is dominated by cool grays and crisp whites to maintain a "Studio" environment. 
- **Primary (Action Blue):** Reserved for the main call-to-action and active tool states.
- **Secondary:** Used for secondary actions and iconographic support.
- **Neutral:** A deep navy-gray for primary text and high-contrast labels.
- **Status:** 'Success' (Green) is used for compliance checks (e.g., "Face detected"), while 'Warning' (Amber) signals potential issues with photo quality or dimensions.
- **Surfaces:** The canvas area should use a slightly darker neutral background to make the white photo paper stand out, while the sidebar uses a clean white surface with subtle borders.

## Typography
The system utilizes **Inter** for its exceptional legibility at small sizes and its neutral, systematic feel. 
- **Headlines:** Used sparingly for page titles and major sidebar sections.
- **Body:** The 14px size is the workhorse for labels and descriptions. 
- **Labels:** Uppercase bold labels are used for "Category" headers in the property inspector (e.g., "DIMENSIONS", "COLOR CORRECTION").
- **Mono:** A secondary monospaced font (JetBrains Mono) is used for technical readouts like X/Y coordinates and pixel dimensions to emphasize the "tool-like" nature of the editor.

## Layout & Spacing
This design system uses a **Fixed Sidebar + Fluid Canvas** model. 
- **The Sidebar:** Fixed at 320px on the right, housing all editing controls. It uses a vertical stack with 24px spacing between major tool groups and 8px spacing between individual inputs.
- **The Canvas:** A fluid area that centers the photo. It includes a mandatory 40px safe-area margin to ensure UI overlays never touch the photo edges.
- **Grid:** Inside the sidebar, a 4-column sub-grid is used for dense control layouts (like 2x2 grid for margin offsets).
- **Mobile:** On small screens, the sidebar transitions to a bottom sheet, and the canvas scales to fit the remaining vertical space.

## Elevation & Depth
Depth is signaled through **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows.
- **Level 0 (Base):** The canvas background (Cool Gray).
- **Level 1 (Surface):** The Sidebar and Top Toolbar (White). These are separated from the canvas by a 1px border (`#DFE1E6`).
- **Level 2 (Popovers):** Tooltips and dropdown menus use a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.08)) to float above the workspace.
- **Active State:** Selected tools or active input fields use a 2px primary blue inner-stroke to denote focus and precision.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a professional, "software-tool" aesthetic that feels modern but not overly playful. 
- **Inputs and Buttons:** Use the base 4px (0.25rem) radius.
- **Photo Frames:** The crop area or photo preview should maintain sharp corners (0px) to accurately represent the physical print cut, while the UI container around it remains rounded.
- **Segmented Controls:** Use a "Pill" shape only for the internal toggle indicators to clearly differentiate them from standard buttons.

## Components
- **Segmented Controls:** Used for switching between preset ID sizes (e.g., 2x2", 35x45mm). They should have a subtle gray background with a white "floating" segment for the active selection.
- **Drag-and-Drop Zones:** Large empty states with a dashed border (`#6B778C`) and a centered "Upload" icon. On drag-over, the background tints to a light version of the Primary Blue.
- **Buttons:** 
  - *Primary:* Solid Action Blue with white text.
  - *Secondary:* Ghost style with a gray border; becomes blue only on hover.
- **Input Fields:** Labeled on top in `label-bold` style. Include "suffix" units (e.g., "px" or "mm") pinned to the right side of the field.
- **Property Sidebar:** Tools should be grouped in collapsible "Accordions" to manage vertical space.
- **Status Chips:** Small, high-contrast pills located at the top of the sidebar to indicate "AI Compliance" status (e.g., "Lighting: Pass", "Background: Fail").