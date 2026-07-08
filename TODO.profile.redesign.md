# TODO — Profile page redesign (CosmoVision)

> Scope: `/profile` only. No routing/auth changes. No backend integration yet (use placeholder data where necessary).

## 0. Audit & setup
- [x] Review current `AI-driven-Cosmovision/FRONTEND/src/pages/Profile.jsx` implementation.
- [x] Review existing supporting components/layout patterns (PageShell, Navbar, Protected routing).
- [x] Review available backend schema/endpoints relevant to profile data (identify what can be used later).

## 1. Reusable components (UI-only; placeholder data)
- [ ] Create `src/pages/profile/components/ProfileHeader.jsx`
  - Identity (avatar initials), display name, explorer tier placeholder, primary CTA
- [ ] Create `src/pages/profile/components/CosmicPassportPanel.jsx`
  - Bio/location/timezone placeholders + editable placeholders (no backend)
- [ ] Create `src/pages/profile/components/TelemetryGrid.jsx`
  - Stat tiles for: saved observatories, saved journal notes, journey milestones, AI observatory hint (placeholder)
- [ ] Create `src/pages/profile/components/MissionSummaryCard.jsx`
  - Short “what to do next” narrative + CTA placeholder
- [ ] Create `src/pages/profile/components/JourneyProgress.jsx`
  - Visual progress bar + textual progress (derived from placeholder counts)
- [ ] Create `src/pages/profile/components/SectionTitle.jsx`
  - Consistent section headers with eyebrow label
- [ ] Create `src/pages/profile/components/Card.jsx` or reuse existing glass card style wrapper if available
- [ ] Create `src/pages/profile/components/EmptyStatePremium.jsx`
  - Premium empty states for lists

## 2. Hero section and Cosmic Passport
- [ ] Replace/compose the current Profile header with the new `ProfileHeader` + `CosmicPassportPanel`
- [ ] Ensure typography + spacing match existing theme style tokens

## 3. Mission Summary and Journey Progress
- [ ] Implement `TelemetryGrid` + `MissionSummaryCard`
- [ ] Implement `JourneyProgress` using placeholder milestone counts

## 4. Personal Space Library
- [ ] Create `PersonalSpaceLibrary.jsx`
  - Cards/lists for: Saved Observatories (placeholder), Saved Journal Notes (placeholder)
  - Add “View all” placeholder CTAs
- [ ] Create `InterestGalaxyVisualization.jsx` placeholder (visual only)

## 5. Build Interest Galaxy visualization
- [ ] Create `InterestGalaxyVisualization.jsx`
  - Galaxy dots/bubbles visualization driven by placeholder “favorite categories”
  - Use SVG/canvas or div-based layout (no backend)
  - Respect reduced motion preference

## 6. Build Exploration Timeline
- [ ] Create `ExplorationTimeline.jsx`
  - Placeholder timeline events (saved observatory, saved note, recommendation)
  - Include date formatting utility if needed

## 7. Build Achievements
- [ ] Create `AchievementsPanel.jsx`
  - Achievements grid with icons + badge style (placeholder)

## 8. Build AI Observatory
- [ ] Create `AiObservatoryPanel.jsx`
  - “Tonight’s suggested sky” panel
  - Show placeholder weather/visibility and personalized text
  - Add “Plan observation” CTA placeholder

## 9. Build Settings section
- [ ] Create `ProfileSettingsPanel.jsx`
  - Toggles/selects as placeholders:
    - email alerts, event reminders, temp unit, distance unit, time format
  - UI-only (no backend yet)

## 10. Assemble final Profile page (UI complete, still no backend)
- [ ] Update `AI-driven-Cosmovision/FRONTEND/src/pages/Profile.jsx` to use the new components
- [ ] Add tabbed hub structure:
  - Personal Observatory
  - Cosmic Passport
  - Space Journal
  - Journey Log
- [ ] Ensure modular component relationships
- [ ] Validate responsive layout manually (mobile/tablet/desktop)
- [ ] Validate accessibility basics (keyboard focus, ARIA for tabs)

## 11. Stop point before backend integration
- [ ] Do NOT wire real APIs.
- [ ] Ensure placeholders are clearly marked (e.g., `mockProfileData`).
- [ ] Stop and wait for next instruction.

