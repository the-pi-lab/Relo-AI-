# ChatFlow AI — Cinematic 3D Landing Page
## Master Storyboard, Art Direction, Motion System & AI Build Prompt

> **Purpose:** This document is the single source of truth for an AI coding/design agent. Give this entire file to the AI and instruct it to build the landing page exactly according to this specification.
>
> **Important:** The references below are **visual/interaction specimens**, not templates to copy. The final website must feel original and must not look like a collage of borrowed components.

---

# 1. PROJECT OBJECTIVE

Build a completely original, premium, cinematic, highly interactive **3D landing page for ChatFlow AI**.

The experience must feel less like a conventional SaaS website and more like a **short interactive product film controlled by the user's scroll and cursor**.

The central visual metaphor is:

**A real smartphone → Instagram conversation → ChatFlow automation → intelligent decision/gating → automated DM → backend/infrastructure → Meta ecosystem → measurable business result.**

The user should feel that they are physically travelling through the ChatFlow system.

This is NOT:

- a generic SaaS dashboard
- a static hero with a floating phone
- a collection of glass cards
- a normal marketing page with random 3D objects
- a template assembled from UI libraries
- a simple Three.js scene with text over it

It must be a **narrative 3D interface**.

The page should communicate:

> **ChatFlow turns social conversations into automated business workflows.**

The visual storytelling should make the automation understandable even before the user reads the copy.

---

# 2. CORE CREATIVE DIRECTION

## Visual Personality

The website should feel:

- cinematic
- futuristic
- premium
- technological
- minimal
- tactile
- dimensional
- sophisticated
- slightly mysterious
- highly polished
- intentionally designed

Avoid:

- excessive neon
- cyberpunk clichés
- cheap gradients
- random floating cubes
- excessive particles
- generic AI robot imagery
- cheesy "AI futuristic" visuals
- excessive glassmorphism
- huge meaningless 3D text
- overuse of glowing borders
- template-like SaaS sections

The visual language should sit somewhere between:

- premium product film
- Apple-style product storytelling
- high-end WebGL portfolio
- interactive product demo
- modern AI infrastructure visualization

but it must remain **distinctly ChatFlow**.

---

# 3. TECHNOLOGY DIRECTION

Use a modern React architecture.

Preferred stack:

- React
- Vite
- TypeScript
- Tailwind CSS
- Three.js
- React Three Fiber
- @react-three/drei
- GSAP
- ScrollTrigger
- Theatre.js
- Framer Motion / Motion where appropriate
- Lenis or an equivalent smooth-scroll solution
- Lucide React
- optional postprocessing only where it materially improves the scene

Use WebGL/Three.js for the actual 3D world.

Use DOM/CSS for:

- navigation
- readable marketing copy
- buttons
- accessibility
- text-heavy UI
- forms if needed
- responsive mobile layouts

Do NOT render every piece of text as a 3D object.

---

# 4. ROLE OF EACH TECHNOLOGY

## Three.js

Use Three.js as the fundamental 3D rendering engine.

Responsibilities:

- smartphone model
- 3D interface surfaces
- cables/connectors
- automation nodes
- particles
- network visualization
- environment
- lighting
- depth
- camera
- 3D transitions

---

## React Three Fiber

Use R3F to structure the Three.js scene as React components.

Create reusable components such as:

```text
Experience
├── CameraRig
├── Environment
├── Phone
├── PhoneScreen
├── InstagramUI
├── MessageParticles
├── WorkflowGraph
├── WorkflowNode
├── FollowGate
├── DMMessage
├── Infrastructure
├── MetaNetwork
├── Analytics
└── SceneLighting
```

---

## GSAP + ScrollTrigger

GSAP should control major scroll choreography.

Use it for:

- camera movement
- phone rotation
- object translation
- scale changes
- timeline sequencing
- section transitions
- parallax
- pinning
- reveal timing

The scroll should feel like a cinematic timeline.

---

## Theatre.js

Use Theatre.js where precise artistic animation control is useful.

Good candidates:

- camera choreography
- phone rotation
- large hero object positioning
- transition timing
- cinematic keyframes

The goal is not to use Theatre.js everywhere.

Use it where it makes iteration easier.

---

## Framer Motion / Motion

Use Motion for DOM/UI animation:

- navbar appearance
- buttons
- text
- menus
- badges
- UI micro-interactions
- modal transitions
- card entrances

Do not use it as a replacement for the Three.js camera timeline.

---

## Tailwind CSS

Use Tailwind for layout and responsive styling.

Keep the visual system consistent.

---

# 5. UI LIBRARY STRATEGY

The following libraries are **reference/component resources**, not mandatory sources for copying entire pages:

- Vengeance UI
- Animate UI
- UI Verse
- Forge UI
- UI-Lora
- 21st.dev

Study these libraries for useful interaction patterns and primitives.

Potential uses:

### Vengeance UI

Use for inspiration or selected primitives involving:

- liquid-metal interactions
- sophisticated buttons
- scroll-driven effects
- particles
- 3D-inspired UI
- text effects

### Animate UI

Use for:

- entrance animations
- navigation transitions
- modal behavior
- UI motion
- micro-interactions

### UI Verse

Use selectively for:

- button concepts
- toggles
- inputs
- small interaction patterns

Do NOT make the page look like a random collection of UI Verse components.

### Forge UI

Use for:

- polished marketing blocks
- animated cards
- interaction patterns
- responsive UI structures

### UI-Lora

Use as a source of UI/interaction inspiration where suitable.

### 21st.dev

Use as a reference for:

- WebGL experiences
- 3D cards
- scroll morphing
- cursor effects
- interactive visual systems

---

# 6. CRITICAL LIBRARY RULE

Do NOT blindly paste components from all these libraries.

Bad implementation:

```text
Vengeance button
+
UI Verse card
+
Animate UI navbar
+
Forge card
+
21st.dev 3D object
+
random Three.js particles
=
website
```

That produces a Frankenstein design.

Instead:

```text
ChatFlow Art Direction
        ↓
Interaction System
        ↓
Custom 3D Components
        ↓
Selective Library Primitives
        ↓
Unified Motion Language
```

Everything must look as though it was designed by one creative team.

---

# 7. PAGE STRUCTURE

The landing page should behave as a continuous cinematic experience.

Suggested structure:

```text
SCENE 00 — BLACK / SIGNAL
        ↓
SCENE 01 — PHONE ARRIVAL
        ↓
SCENE 02 — INSTAGRAM CONVERSATION
        ↓
SCENE 03 — MESSAGE DETECTION
        ↓
SCENE 04 — AUTOMATION IGNITION
        ↓
SCENE 05 — WORKFLOW GRAPH
        ↓
SCENE 06 — FOLLOW GATE
        ↓
SCENE 07 — AUTOMATED DM
        ↓
SCENE 08 — INFRASTRUCTURE
        ↓
SCENE 09 — META NETWORK
        ↓
SCENE 10 — ANALYTICS / RESULT
        ↓
SCENE 11 — FINAL CHATFLOW REVEAL
```

Do not make every scene a completely separate page.

It should feel like one continuous world.

---

# 8. GLOBAL CAMERA PHILOSOPHY

The camera is the storyteller.

Do not simply move the camera vertically.

The camera should:

- orbit
- dolly
- zoom
- rotate
- move between objects
- change focal depth
- move through network structures
- approach UI surfaces
- pull away from details
- transition from physical device to abstract infrastructure

The user's scroll controls the cinematic timeline.

Conceptually:

```text
scroll 0%
    camera wide
        ↓
scroll 10%
    phone enters
        ↓
scroll 20%
    camera approaches screen
        ↓
scroll 30%
    Instagram conversation
        ↓
scroll 40%
    message transforms into workflow
        ↓
scroll 50%
    workflow expands
        ↓
scroll 60%
    follow gate decision
        ↓
scroll 70%
    DM dispatch
        ↓
scroll 80%
    backend infrastructure
        ↓
scroll 90%
    Meta network
        ↓
scroll 100%
    final ChatFlow reveal
```

The exact numerical mapping can be adjusted during implementation, but the narrative sequence must remain.

---

# 9. SCENE 00 — BLACK / SIGNAL

## Goal

Start with almost nothing.

The first impression should be extremely clean.

Background:

- deep black
- subtle atmospheric gradient
- barely visible grain
- extremely subtle volumetric light

A small animated signal appears.

Possible visual:

```text
.
.
.
        CONNECTING...
```

Then:

```text
CHATFLOW
```

or a minimal system-status indicator.

Do not overdo this.

The purpose is anticipation.

---

# 10. SCENE 01 — 3D PHONE ARRIVAL

## Hero Object

A physically convincing smartphone must appear.

This is one of the most important elements in the entire website.

The phone should not simply fade in.

It should physically enter the scene.

### Initial State

Phone:

- off-screen / deep background
- rotated approximately 20–35 degrees
- slightly tilted
- low opacity
- small scale
- soft depth-of-field

As scrolling begins:

```text
phone:
scale      0.72 → 1
rotation   dramatic → controlled
position   background → foreground
opacity    0 → 1
```

The movement should have physical inertia.

---

# 11. PHONE MATERIAL DESIGN

The phone should look premium.

Use:

- metallic frame
- realistic glass
- subtle reflections
- screen emission
- soft bevels
- controlled roughness
- realistic shadow

Avoid:

- cartoon geometry
- low-poly phone
- glowing sci-fi frame
- unrealistic floating object

The phone can be custom-built using simple geometry if a complete external 3D model is unnecessary.

Potential construction:

```text
rounded box body
+
beveled metal frame
+
front glass plane
+
camera bump
+
side buttons
+
screen surface
```

The screen should be a separate plane so that the interface can be controlled independently.

---

# 12. PHONE ANIMATION

The phone should react to scroll.

Example:

```text
Scroll:
0–15%
    phone approaches

15–25%
    phone rotates toward viewer

25–35%
    camera moves closer

35–45%
    phone becomes dominant

45–55%
    camera begins entering screen space
```

The phone should also have subtle idle movement:

- very small floating motion
- micro rotation
- light breathing effect

Never make it wobble like a cheap 3D demo.

---

# 13. SCENE 02 — INSTAGRAM CONVERSATION

The camera reaches the phone.

The screen becomes the world.

Show a realistic social-media conversation interface.

The UI should be recognizable but not a pixel-perfect clone of Instagram.

Create an abstracted social DM interface.

Example:

```text
┌─────────────────────────┐
│  @creator               │
│                         │
│     Hey! Is this       │
│     available?         │
│                         │
│  Yes — absolutely.     │
│                         │
│     How does it work?  │
│                         │
│  ↓                      │
│  [Send message...]      │
└─────────────────────────┘
```

Messages should appear naturally.

Use:

- rounded bubbles
- avatar
- typing indicator
- timestamps
- subtle motion

---

# 14. MESSAGE EVENT

One particular message becomes important.

For example:

```text
"How do I get access?"
```

or another product-relevant message.

When the user scrolls:

- message highlights
- surrounding UI subtly dims
- a thin signal originates from it
- signal leaves the phone
- the camera follows it

This is the transition from:

**conversation → automation**

---

# 15. SCENE 03 — MESSAGE DETECTION

The message should transform into a data/event object.

Example visual:

```text
Instagram DM
      ↓
EVENT DETECTED
      ↓
CHATFLOW
```

The message bubble can become:

```text
EVENT
message.received
```

Then:

```text
intent: inquiry
source: social
user: visitor
```

Use small technical metadata.

This gives the product a sense of real infrastructure without making it unreadable.

---

# 16. SCENE 04 — AUTOMATION IGNITION

The event emits a bright but restrained signal.

The signal travels into a workflow system.

Visually:

```text
[DM EVENT]
     │
     └──────────────→ [CHATFLOW ENGINE]
                              │
                              ↓
                         [DECISION]
```

The camera pulls away from the phone.

The phone remains visible in the background.

The automation system expands into the surrounding 3D space.

This is a major cinematic transition.

---

# 17. SCENE 05 — WORKFLOW GRAPH

This is the main 3D system visualization.

Build a spatial workflow graph.

Nodes:

```text
TRIGGER
   ↓
MESSAGE RECEIVED
   ↓
CHECK PROFILE
   ↓
FOLLOW GATE
   ↓
QUALIFY
   ↓
SEND DM
   ↓
TRACK
```

Each node should be a custom 3D object.

Do not use flat HTML cards floating randomly.

---

# 18. WORKFLOW NODE DESIGN

Each node can contain:

- small icon
- title
- tiny status
- subtle border
- glass/metal material
- internal glow
- connection points

Example:

```text
╭──────────────────╮
│  ◎  TRIGGER      │
│                  │
│  Message received│
│       ACTIVE     │
╰──────────────────╯
```

But in 3D.

Nodes should have:

- rounded geometry
- bevels
- slight extrusion
- realistic lighting
- translucent materials
- subtle reflections

---

# 19. CONNECTOR ANIMATION

Connections are extremely important.

Use:

- curves
- tubes
- thin lines
- particles traveling along paths

When a workflow executes:

```text
node activates
    ↓
connector lights
    ↓
particle travels
    ↓
next node activates
```

This should visually communicate execution.

Example:

```text
[TRIGGER] =====●=====> [FOLLOW GATE]
                     =====●=====> [SEND DM]
```

The particle should move in the direction of execution.

---

# 20. SCENE 06 — FOLLOW GATE

This is the key business logic moment.

The workflow reaches:

```text
FOLLOW GATE
```

Create a visually dramatic decision node.

Possible UI:

```text
┌──────────────────────┐
│ FOLLOW GATE          │
│                      │
│ User follows account?│
│                      │
│      YES       NO    │
└──────────────────────┘
```

But instead of a normal card, make it a 3D decision mechanism.

For example:

- rotating split node
- two glowing pathways
- branching particle streams

The "YES" branch becomes active.

The "NO" branch fades into darkness.

---

# 21. SCENE 07 — AUTOMATED DM

The successful path travels back toward a message bubble.

The camera follows the signal.

The bubble is generated automatically.

Example:

```text
CHATFLOW
────────────────────
Automation completed.

Hey! 👋
Thanks for connecting.

Here's the information
you requested.
```

The message should appear as though the system just generated it.

Use:

- typing animation
- cursor
- message delivery indicator
- subtle particle burst

Then show:

```text
DELIVERED
```

---

# 22. SCENE 08 — INFRASTRUCTURE REVEAL

Now reveal what powers the workflow.

The camera moves backward.

The previous workflow becomes one small part of a larger infrastructure.

Create a 3D network:

```text
                 ┌── DATA
                 │
CHATFLOW ────────┼── AUTOMATION
                 │
                 ├── EVENTS
                 │
                 └── USERS
```

The network should feel like a living system.

---

# 23. INFRASTRUCTURE VISUAL LANGUAGE

Use:

- floating nodes
- thin connections
- small data particles
- translucent structures
- subtle depth
- controlled bloom
- soft volumetric lighting

But maintain restraint.

The network should communicate:

**scale + reliability + intelligence**

not:

**random futuristic background.**

---

# 24. SCENE 09 — META NETWORK

The infrastructure expands into a larger ecosystem.

The central ChatFlow engine connects to social/business channels.

Conceptually:

```text
                 SOCIAL
                    │
                    │
MESSAGES ───── CHATFLOW ───── AUTOMATION
                    │
                    │
                  USERS
                    │
                 ANALYTICS
```

Do not create an official-looking Meta logo unless the required branding assets/licensing are appropriate.

Use abstract channel representations where necessary.

The goal is to communicate ecosystem connectivity.

---

# 25. SCENE 10 — ANALYTICS / RESULT

The network collapses into a clean performance visualization.

The user should see the business outcome.

Possible metrics:

```text
AUTOMATIONS
12,482

MESSAGES PROCESSED
94,210

RESPONSE TIME
0.4s

CONVERSIONS
+38%
```

These numbers should animate.

Do not make fake claims unless the product actually has those metrics.

If real product metrics are unavailable, use clearly illustrative values or configurable placeholders.

---

# 26. ANALYTICS ANIMATION

Example:

```text
12,482
```

animates from:

```text
0 → 12,482
```

Graph:

```text
▁▂▂▃▄▅▆▆▇██
```

should build progressively.

Use a 3D graph surface if it looks natural.

The camera slowly stabilizes.

The chaotic infrastructure becomes a clean system.

This symbolizes:

**complexity → simplicity**

---

# 27. SCENE 11 — FINAL CHATFLOW REVEAL

Everything converges.

The phone:

- moves into the background

The workflow:

- collapses into a small central object

The network:

- contracts

Signals:

- converge toward one point

The ChatFlow logo/wordmark becomes the final visual anchor.

Possible final composition:

```text
                 ✦

             CHATFLOW AI

      Automate conversations.
      Turn attention into action.

          [ Get Started ]

              ↓

         Scroll to explore
```

Keep the ending clean.

Do not add unnecessary cards.

---

# 28. FINAL CTA

The CTA should feel like the natural conclusion of the story.

Primary:

**Start for Free**

Secondary:

**See How It Works**

Buttons should use a premium liquid/metal/glass treatment.

Button interaction:

- hover sheen
- slight scale
- cursor attraction
- subtle magnetic movement
- soft glow
- press depth

Use Motion or GSAP for DOM interaction.

---

# 29. NAVIGATION

The navigation should remain minimal.

Recommended:

```text
CHATFLOW

Product
How It Works
Integrations
Pricing

                    Sign In
                    Start for Free
```

On desktop:

- transparent / glass-metal treatment
- subtle backdrop blur
- thin border
- floating over scene

On scroll:

- slightly compress
- reduce transparency
- maintain readability

On mobile:

- hamburger
- full-screen animated navigation

The navigation must never overpower the 3D story.

---

# 30. HERO TYPOGRAPHY

Typography should be editorial and premium.

Recommended system:

UI:

```text
Inter
```

Display accent:

```text
Instrument Serif
```

Possible hero:

```text
Turn every
conversation into
an opportunity.
```

or:

```text
Your conversations
can work for you.
```

The final copy must accurately reflect the actual ChatFlow product.

Use serif selectively.

Do NOT turn the whole page into a serif editorial website.

---

# 31. TEXT ANIMATION

Hero headline:

- line mask reveal
- slight vertical movement
- opacity
- blur-to-sharp

Example:

```text
opacity: 0 → 1
y: 35px → 0
filter: blur(8px) → blur(0)
```

Animation should feel expensive and deliberate.

---

# 32. CURSOR SYSTEM

Desktop should have a custom cursor system.

Normal:

- small dot
- subtle trailing ring

Interactive element:

- ring expands
- text/icon may appear

3D object:

- subtle magnetic response

Button:

- cursor attraction

Link:

- underline / highlight

Do not make the cursor obnoxious.

No huge circle covering the page.

---

# 33. MAGNETIC BUTTONS

Buttons can react to cursor position.

Concept:

```text
cursor approaches
       ↓
button slightly follows
       ↓
cursor leaves
       ↓
button returns with spring
```

Use spring physics.

Do not make movement exceed roughly a few pixels.

---

# 34. SCROLL PHYSICS

The website must not feel like a normal page where elements simply translate according to scroll.

Use:

- smooth scrolling
- inertia
- interpolation
- spring-like transitions
- velocity-aware movement
- easing

Important:

**scroll controls the story, not just the page position.**

---

# 35. CAMERA MOTION PRINCIPLES

Avoid constant movement.

Use:

### Slow cinematic movement

For:

- entering scenes
- establishing shots
- infrastructure

### Faster movement

For:

- message detection
- workflow execution
- decision branch

### Slow stabilization

For:

- analytics
- final reveal

This creates rhythm.

---

# 36. DEPTH OF FIELD

Use subtle depth of field.

Foreground:

- sharp

Background:

- slightly blurred

Transition:

- focus changes with camera

Do not blur everything.

Text rendered in DOM must remain readable.

---

# 37. LIGHTING

Base:

- black environment

Primary:

- soft white light

Secondary:

- cool neutral light

Accent:

- extremely restrained brand accent

Lighting should create:

- edge highlights
- metallic reflections
- depth
- glass reflections

Avoid:

- rainbow lighting
- excessive neon
- nightclub aesthetic

---

# 38. MATERIAL SYSTEM

Use a consistent material language.

### Metal

```text
metalness: high
roughness: medium/low
```

### Glass

```text
transmission
low opacity
high-ish roughness control
environment reflection
```

### UI surface

```text
dark translucent
thin border
subtle reflection
```

### Signal

```text
emissive
small bloom
```

Keep materials physically plausible.

---

# 39. PARTICLE SYSTEM

Particles should represent:

- messages
- data
- execution
- network traffic

Not decoration.

Particle behavior:

```text
event created
     ↓
particle emitted
     ↓
travels along workflow
     ↓
node activated
     ↓
next particle
```

Use instancing for performance.

Do not create thousands of independent React objects.

---

# 40. TRANSITION SYSTEM

Every major scene must have a visual reason for the transition.

Examples:

### Phone → Workflow

Message becomes a signal.

### Workflow → Infrastructure

Nodes expand outward.

### Infrastructure → Meta network

Connections multiply.

### Network → Analytics

Connections collapse into metrics.

### Analytics → Final CTA

Metrics converge into the ChatFlow identity.

This creates a single visual story.

---

# 41. SECTION TEXT

Do not place huge paragraphs over the 3D scene.

Use concise copy.

Example structure:

```text
01
CONVERSATION

Every message is
a potential workflow.
```

Then:

```text
02
AUTOMATION

Build once.
Execute automatically.
```

Then:

```text
03
OUTCOMES

Turn conversations
into measurable action.
```

Text should appear as part of the scene.

---

# 42. SCROLL LABEL SYSTEM

Optional small fixed UI:

```text
01 / 05
CONVERSATION
```

This can update as the user progresses.

Example:

```text
01 / CONVERSATION
02 / AUTOMATION
03 / DECISION
04 / INFRASTRUCTURE
05 / OUTCOME
```

Keep it subtle.

---

# 43. PROGRESS INDICATOR

Add a minimal vertical progress indicator.

Possible:

```text
01
│
│
│
05
```

The active progress line grows with scroll.

This gives the user orientation.

---

# 44. RESPONSIVE DESIGN

The desktop experience can be highly cinematic.

Mobile must still feel intentional.

Do NOT simply shrink desktop.

## Desktop

Use:

- full WebGL
- large phone
- camera movement
- 3D workflow
- particles
- network

## Tablet

Reduce:

- particle count
- camera distance
- graph complexity
- UI density

## Mobile

Prioritize:

- readable DOM content
- simplified 3D
- phone-centered scenes
- fewer workflow nodes
- fewer particles
- shorter camera movements

If WebGL performance is poor:

- simplify geometry
- lower DPR
- reduce postprocessing
- disable nonessential effects

---

# 45. PERFORMANCE REQUIREMENTS

This website must look cinematic without becoming unusable.

Implement:

- adaptive DPR
- frustum culling
- instanced particles
- lazy-load heavy 3D assets
- dispose unused geometries/materials
- avoid unnecessary React re-renders
- avoid creating objects inside render loops
- use refs for high-frequency animation
- throttle expensive DOM work
- use IntersectionObserver where appropriate

Target:

```text
60 FPS on capable desktop hardware
```

Gracefully degrade on weaker devices.

---

# 46. WEBGL FALLBACK

If WebGL is unavailable:

Show a polished 2D experience.

Do NOT show:

- broken canvas
- empty black area
- console errors visible to users

Fallback can use:

- CSS gradients
- static phone illustration
- DOM workflow animation
- simple transitions

The page must remain usable.

---

# 47. ACCESSIBILITY

The 3D experience must not sacrifice accessibility.

Provide:

- semantic HTML
- keyboard navigation
- focus states
- aria labels
- meaningful button labels
- readable contrast
- reduced-motion mode

For:

```css
@media (prefers-reduced-motion: reduce)
```

disable:

- camera-heavy motion
- cursor trails
- excessive particles
- large scroll choreography

Keep the content accessible.

---

# 48. LOADING EXPERIENCE

3D assets should not cause a blank screen.

Show a minimal loader.

Example:

```text
CHATFLOW
INITIALIZING EXPERIENCE
██████████░░░░░░
```

Or:

```text
LOADING SYSTEM
```

Loader should disappear when:

- critical assets loaded
- WebGL initialized
- first frame rendered

Keep it under-styled.

---

# 49. AUDIO

Do NOT autoplay sound.

If audio is ever added:

- user initiated
- muted by default
- accessible controls

The visual experience must work perfectly without sound.

---

# 50. MOBILE MENU

Use a clean full-screen overlay.

Animation:

```text
backdrop blur
+
opacity
+
links stagger
```

Menu items:

```text
Product
How It Works
Integrations
Pricing
```

CTA at bottom.

Escape closes the menu.

Clicking a navigation link closes it.

Resize to desktop closes it.

---

# 51. MICRO-INTERACTIONS

Use micro-interactions only where meaningful.

Examples:

- buttons
- nav pills
- workflow nodes
- message bubbles
- cursor
- CTA
- progress indicator

Every interaction should reinforce the product concept.

---

# 52. UI COMPONENT DESIGN LANGUAGE

Create a custom design system.

Tokens:

```text
--bg: #000000
--surface: #080808
--surface-elevated: #101010
--text: #ffffff
--muted: #8f8f8f
--border: rgba(255,255,255,.14)
--border-strong: rgba(255,255,255,.28)
```

Accent should be minimal and brand-specific.

Use:

- 4–12px radius for utility UI
- rounded larger containers only where appropriate
- 1px borders
- subtle shadows
- glass only when useful

---

# 53. LIQUID-METAL UI

For selected controls, use a refined liquid-metal effect.

Base:

```css
background:
  linear-gradient(
    135deg,
    rgba(255,255,255,.14),
    rgba(255,255,255,.04) 45%,
    rgba(0,0,0,.55)
  );
```

Add:

- subtle highlight
- thin border
- blur
- animated sheen

Do not apply this to everything.

The rarity of the effect makes it feel premium.

---

# 54. STORYBOARD — COMPLETE TIMELINE

## 0–8%

BLACK.

Small system signal.

ChatFlow identity begins appearing.

Camera is distant.

---

## 8–18%

Phone begins entering.

Slow rotation.

Soft light catches the metal edge.

User starts to understand the product is mobile/social.

---

## 18–28%

Camera moves toward phone.

Screen becomes visible.

Conversation interface appears.

Messages animate in.

---

## 28–38%

One message becomes highlighted.

Signal emerges from message.

Text changes from:

```text
MESSAGE
```

to:

```text
EVENT DETECTED
```

Camera follows signal.

---

## 38–50%

Signal enters ChatFlow engine.

Workflow graph expands.

Nodes appear one by one.

Connections activate sequentially.

---

## 50–62%

Workflow reaches:

```text
FOLLOW GATE
```

Two branches appear.

YES path activates.

NO path dims.

---

## 62–72%

Signal continues.

DM node activates.

Camera travels along connector.

Automated message is generated.

Typing indicator.

Message delivered.

---

## 72–84%

Camera pulls back dramatically.

Workflow becomes part of larger infrastructure.

Data nodes appear.

Network grows.

---

## 84–92%

Infrastructure expands into ecosystem.

Multiple channels connect.

Particles move through network.

---

## 92–97%

Everything begins collapsing.

Network → metrics.

Metrics animate.

Performance visualization stabilizes.

---

## 97–100%

Everything converges.

ChatFlow identity becomes dominant.

Final CTA.

Minimal background.

End on confidence, not spectacle.

---

# 55. HERO COPY DIRECTION

Potential hero:

```text
Turn conversations
into automated action.
```

Supporting copy:

```text
ChatFlow transforms social conversations into intelligent,
automated workflows that respond, qualify, and engage —
without manual intervention.
```

Primary CTA:

```text
Start for Free
```

Secondary:

```text
See It in Action
```

The implementation agent should replace placeholder claims/copy with the actual approved ChatFlow messaging if provided.

---

# 56. PRODUCT STORY IN ONE SENTENCE

The entire animation should communicate:

> A customer sends a message → ChatFlow detects the event → evaluates the user → executes the workflow → sends the right response → records the outcome.

If the user understands this sequence after scrolling through the page, the experience has succeeded.

---

# 57. WHAT MAKES THIS DIFFERENT

The page must not simply show:

```text
3D phone
+
3D cards
+
3D particles
```

Instead, the 3D elements must **transform into one another**.

The same signal should travel through the entire story.

The same message should evolve:

```text
message
→ event
→ trigger
→ workflow
→ decision
→ action
→ result
```

This continuity is the signature visual concept.

---

# 58. AI CODING AGENT — NON-NEGOTIABLE RULES

You are an expert creative developer, 3D interaction designer, motion designer, and senior frontend engineer.

Build the ChatFlow AI landing page described in this document.

## RULE 1

Do not produce a generic SaaS template.

## RULE 2

Do not use random 3D assets just to make the page look futuristic.

## RULE 3

Every 3D object must have a narrative purpose.

## RULE 4

Do not blindly combine components from Vengeance UI, Animate UI, UI Verse, Forge UI, UI-Lora, or 21st.dev.

Use them selectively and restyle them into the ChatFlow design system.

## RULE 5

The primary visual system must be custom Three.js/R3F.

## RULE 6

The scroll must control the cinematic sequence.

## RULE 7

The camera must participate in storytelling.

## RULE 8

The phone must be a genuine 3D object, not a flat screenshot inside a CSS box.

## RULE 9

The workflow must execute visually.

## RULE 10

Particles must represent data/events, not decoration.

## RULE 11

Transitions between scenes must be continuous.

## RULE 12

Do not create excessive sections merely to fill space.

## RULE 13

Do not use stock illustrations.

## RULE 14

Do not use a generic AI robot.

## RULE 15

Do not use excessive neon/cyberpunk styling.

## RULE 16

Do not use WebGL effects that destroy readability.

## RULE 17

Do not autoplay audio.

## RULE 18

Implement reduced-motion support.

## RULE 19

Implement a WebGL fallback.

## RULE 20

The final result must look like a custom product experience, not an AI-generated template.

---

# 59. REQUIRED PROJECT ARCHITECTURE

Suggested structure:

```text
src/
├── components/
│   ├── Navbar.tsx
│   ├── HeroCopy.tsx
│   ├── CTA.tsx
│   ├── ProgressIndicator.tsx
│   ├── SceneLabel.tsx
│   └── Cursor.tsx
│
├── three/
│   ├── Experience.tsx
│   ├── CameraRig.tsx
│   ├── Phone.tsx
│   ├── PhoneScreen.tsx
│   ├── InstagramScene.tsx
│   ├── WorkflowGraph.tsx
│   ├── WorkflowNode.tsx
│   ├── Connector.tsx
│   ├── FollowGate.tsx
│   ├── DMMessage.tsx
│   ├── Infrastructure.tsx
│   ├── Network.tsx
│   ├── Analytics.tsx
│   ├── Particles.tsx
│   └── Lighting.tsx
│
├── hooks/
│   ├── useScrollProgress.ts
│   ├── useMousePosition.ts
│   ├── useReducedMotion.ts
│   └── useWebGLCapability.ts
│
├── animations/
│   ├── cameraTimeline.ts
│   ├── workflowTimeline.ts
│   └── transitions.ts
│
├── styles/
│   └── globals.css
│
├── App.tsx
└── main.tsx
```

Refactor if a better architecture is appropriate, but preserve separation between DOM/UI and WebGL systems.

---

# 60. STATE MODEL

Create a clear scene-state system.

Example:

```ts
type Scene =
  | "intro"
  | "phone"
  | "conversation"
  | "event"
  | "workflow"
  | "followGate"
  | "dm"
  | "infrastructure"
  | "network"
  | "analytics"
  | "final";
```

The current scene can be derived from normalized scroll progress.

Use this state to control:

- text
- lighting
- object visibility
- camera
- particle behavior
- labels
- UI state

Avoid scattered magic numbers throughout components.

---

# 61. NORMALIZED SCROLL SYSTEM

Create:

```ts
progress = 0 → 1
```

Then define scene ranges.

Example:

```text
intro          0.00–0.08
phone          0.08–0.18
conversation   0.18–0.28
event          0.28–0.38
workflow       0.38–0.50
followGate     0.50–0.62
dm             0.62–0.72
infrastructure 0.72–0.84
network        0.84–0.92
analytics      0.92–0.97
final          0.97–1.00
```

Use interpolation instead of abrupt jumps.

---

# 62. CAMERA TIMELINE

Create a dedicated camera timeline.

Example conceptual keyframes:

```text
KEYFRAME 01
position: (0, 1, 8)
rotation: (0, 0, 0)

KEYFRAME 02
position: (0.4, 0.6, 5.5)
rotation: (0.05, 0.2, 0)

KEYFRAME 03
position: (0, 0.2, 3)
rotation: (0, 0, 0)

KEYFRAME 04
position: (2, 1, 5)
rotation: (0.1, -0.4, 0)

KEYFRAME 05
position: (0, 3, 10)
rotation: (-0.15, 0.3, 0)

KEYFRAME 06
position: (0, 0, 15)
rotation: (0, 0, 0)

KEYFRAME 07
position: (0, 1, 7)
rotation: (0, 0, 0)
```

These are starting points, not rigid values.

The final camera should be tuned artistically.

---

# 63. 3D PHONE IMPLEMENTATION

Create the phone from reusable geometry.

Requirements:

- rounded body
- bevelled edges
- screen glass
- camera module
- side controls
- realistic materials
- soft reflections
- physically plausible lighting

Use `RoundedBoxGeometry` or equivalent where appropriate.

Screen should be an independent surface.

The screen UI can be a texture/render target or carefully positioned 3D/DOM hybrid.

---

# 64. WORKFLOW IMPLEMENTATION

Create a data-driven graph.

Example:

```ts
const nodes = [
  {
    id: "trigger",
    title: "Message Received",
    type: "trigger"
  },
  {
    id: "profile",
    title: "Check Profile",
    type: "condition"
  },
  {
    id: "follow",
    title: "Follow Gate",
    type: "decision"
  },
  {
    id: "dm",
    title: "Send DM",
    type: "action"
  },
  {
    id: "track",
    title: "Track Result",
    type: "analytics"
  }
];
```

Connections should also be data-driven.

This makes the scene maintainable.

---

# 65. WORKFLOW EXECUTION ENGINE

Implement an animation state:

```text
idle
→ active
→ executed
```

Each node:

```text
inactive
→ receives signal
→ illuminates
→ pulses
→ becomes executed
```

Connector:

```text
inactive
→ signal starts
→ particle travels
→ connector activates
```

This should be controlled by the master scroll timeline.

---

# 66. SCREEN / PHONE TRANSITION

The most important transition:

When camera approaches the phone screen, the screen should visually become a larger world.

Technique options:

### Option A

Screen texture fades into a 3D environment.

### Option B

Camera physically passes through a screen plane.

### Option C

Screen UI becomes full-screen DOM/WebGL composition.

Choose the technique that produces the smoothest cinematic result.

The transition must NOT visibly look like:

```text
zoom → hard cut → new section
```

It should feel like:

```text
camera enters phone
→ world expands
```

---

# 67. NETWORK TRANSITION

When workflow finishes:

```text
workflow nodes
↓
connections extend
↓
graph scales outward
↓
camera pulls back
↓
graph becomes network
```

Reuse the same objects where possible.

Do not destroy the old scene and create a completely unrelated one.

Visual continuity matters.

---

# 68. ANALYTICS TRANSITION

Network:

```text
many nodes
many connections
```

collapses into:

```text
few clean metrics
```

This creates a visual payoff.

Chaos:

```text
complex automation infrastructure
```

becomes:

```text
simple business outcome
```

---

# 69. HERO DOM LAYOUT

Recommended:

```text
main
└── cinematic stage
    ├── WebGL canvas
    ├── fixed navigation
    ├── scene copy
    ├── progress indicator
    └── CTA
```

Canvas should cover the cinematic stage.

DOM overlays should use appropriate z-index.

Avoid accidentally blocking pointer events on the canvas.

---

# 70. RESPONSIVE CAMERA

Define separate camera profiles.

Desktop:

```text
large environment
wide framing
full workflow
```

Tablet:

```text
medium environment
reduced graph
```

Mobile:

```text
close framing
vertical composition
simplified graph
```

Do not merely use CSS to resize the desktop composition.

---

# 71. TOUCH SUPPORT

On mobile:

- disable custom cursor
- use touch scrolling
- preserve scroll-driven animation
- reduce expensive effects
- avoid hover-dependent functionality

All essential interactions must remain accessible.

---

# 72. REDUCED MOTION

When:

```css
prefers-reduced-motion: reduce
```

the experience should:

- remove smooth camera choreography
- remove cursor trails
- reduce particles
- minimize transitions
- keep all content visible
- preserve logical scene ordering

---

# 73. SEO / DOCUMENT

Use:

```html
<html lang="en">
```

Title:

```text
ChatFlow AI — Turn Conversations Into Automated Action
```

Include:

- meta description
- Open Graph metadata
- favicon
- semantic headings
- accessible navigation

Use the actual approved title if provided by the product team.

---

# 74. SECURITY / EXTERNAL ASSETS

Do not invent external URLs.

If assets are needed:

- use supplied assets
- use local assets
- use approved CDN URLs
- otherwise generate procedural geometry

Never fabricate URLs.

---

# 75. VISUAL QA CHECKLIST

Before considering the implementation complete, verify:

### Composition

- Is the hero immediately visually impressive?
- Is the phone clearly visible?
- Does the 3D environment have depth?
- Is the composition balanced?

### Motion

- Does scrolling actually control the story?
- Does the camera move?
- Do nodes execute?
- Do particles communicate data flow?
- Are transitions continuous?

### Product storytelling

Can a first-time visitor understand:

```text
message
→ trigger
→ workflow
→ decision
→ automated response
→ outcome
```

without reading a giant paragraph?

### UI

- Is navigation readable?
- Are buttons premium?
- Do hover states feel intentional?
- Is typography consistent?

### Performance

- No unnecessary re-renders
- No massive particle counts
- No memory leaks
- No console spam
- No frame-rate collapse during transitions

### Responsive

- desktop
- laptop
- tablet
- mobile

must all be intentionally designed.

---

# 76. ANTI-GENERIC CHECKLIST

Reject the implementation if it contains:

- random floating cubes
- random spheres everywhere
- generic glowing grid floor
- generic AI brain
- random neon blue/purple lighting
- excessive glass cards
- generic dashboard screenshot
- stock 3D phone
- meaningless particle storms
- huge "AI" text floating in space
- copied template sections
- unrelated animations
- visual effects that have no product meaning

If an effect looks impressive but does not explain or reinforce ChatFlow, remove it.

---

# 77. DESIGN QUALITY BAR

The implementation should feel like a website that could be shown as a premium WebGL showcase.

Quality bar:

```text
NOT:
"Here is a SaaS website with some 3D."

YES:
"Here is an interactive cinematic explanation of how the product works."
```

The 3D system itself is the storytelling mechanism.

---

# 78. MASTER AI PROMPT — READY TO PASTE

## BEGIN PROMPT

You are an expert creative frontend engineer, WebGL engineer, interaction designer, motion designer, UX designer, and product storyteller.

Build a production-quality, original cinematic 3D landing page for **ChatFlow AI**.

The page must feel like an interactive product film controlled by the user's scroll.

The central story is:

**A social message enters ChatFlow → ChatFlow detects the event → automation begins → the user passes through a Follow Gate → an automated DM is sent → the workflow connects to infrastructure → the system scales across a network → the complexity resolves into measurable outcomes → the experience concludes with the ChatFlow CTA.**

This is the single most important requirement.

Do not build a generic SaaS website.

Do not build a static hero with a phone floating beside it.

Do not build a collection of unrelated cards.

Build one continuous cinematic world.

---

## TECH STACK

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- Three.js
- React Three Fiber
- @react-three/drei
- GSAP
- ScrollTrigger
- Theatre.js where useful
- Motion / Framer Motion for DOM animations
- Lucide React
- Lenis or equivalent smooth scrolling

Use R3F/Three.js for the 3D world.

Use DOM/CSS for readable text and traditional UI.

---

## IMPORTANT DESIGN REFERENCES

Use the following as inspiration/reference resources:

- Vengeance UI
- Animate UI
- UI Verse
- Forge UI
- UI-Lora
- 21st.dev
- Three.js
- Theatre.js
- R3F

Do not copy their pages.

Do not mechanically combine their components.

Study their interaction quality, motion techniques, 3D patterns, button treatments, scroll behavior, and component ideas.

Then create a unified ChatFlow design system.

The final page must look custom-built.

---

## VISUAL STYLE

Use a premium cinematic aesthetic.

Primary background:

```text
#000000
```

Use:

- black
- near-black surfaces
- white
- soft grey
- restrained brand accent
- metallic highlights
- subtle glass
- controlled bloom

Avoid:

- excessive neon
- cyberpunk
- generic AI imagery
- random 3D objects
- cheap gradients
- excessive glassmorphism

The experience should feel sophisticated and tactile.

---

## PAGE STORY

Implement these scenes in one continuous scroll-controlled experience:

1. Black / Signal
2. 3D Phone Arrival
3. Social Conversation
4. Message Detection
5. Automation Ignition
6. Workflow Graph
7. Follow Gate
8. Automated DM
9. Infrastructure
10. Meta/social ecosystem visualization
11. Analytics / Outcome
12. Final ChatFlow reveal

Do not use hard cuts between scenes.

Objects should transform into the next concept.

---

## PHONE

Create a premium 3D smartphone.

It must have:

- rounded body
- bevels
- metallic frame
- glass screen
- camera module
- realistic material response
- reflections
- subtle shadow
- independent screen surface

Animate it into the scene.

Initial:

```text
small
distant
rotated
slightly transparent
```

Then:

```text
scale increases
rotation settles
camera approaches
screen becomes visible
```

The phone must feel physically present.

Do not use a flat CSS rectangle pretending to be a phone.

---

## PHONE SCREEN

Create a realistic social-media conversation interface.

Use abstracted Instagram-style interaction language without making an unauthorized pixel-perfect clone.

Show:

- avatar
- messages
- typing indicator
- timestamps
- input area
- message states

A key message must become the narrative trigger.

Example:

```text
"How do I get access?"
```

The actual copy may be replaced with approved ChatFlow messaging.

---

## MESSAGE → EVENT

When the user scrolls:

The message becomes highlighted.

Everything else becomes slightly quieter.

A signal originates from the message.

The signal leaves the phone.

Show subtle technical metadata:

```text
EVENT DETECTED
message.received
source: social
intent: inquiry
```

The signal must lead into the ChatFlow automation system.

---

## WORKFLOW

Create a 3D workflow graph.

Nodes:

```text
MESSAGE RECEIVED
CHECK PROFILE
FOLLOW GATE
QUALIFY
SEND DM
TRACK RESULT
```

Use custom 3D nodes.

Each node should have:

- depth
- rounded/beveled geometry
- dark translucent material
- thin edge
- icon
- title
- status

Connections should be curved 3D paths.

When execution occurs:

```text
node activates
→ connector activates
→ particle travels
→ next node activates
```

The user must be able to visually understand workflow execution.

---

## FOLLOW GATE

Make the Follow Gate a cinematic decision point.

Display:

```text
FOLLOW GATE

Does the user follow?

YES       NO
```

Create two physical 3D paths.

The YES path activates.

The NO path becomes dim.

The active particle travels through YES.

This is a key moment.

---

## AUTOMATED DM

The successful workflow path returns to a message surface.

Generate an automated response.

Use:

- typing animation
- cursor
- message bubble
- delivery indicator
- subtle completion signal

Example:

```text
CHATFLOW

Hey! 👋
Thanks for connecting.

Here's the information
you requested.
```

Do not claim product functionality that has not been approved.

---

## INFRASTRUCTURE

After the DM completes, pull the camera back.

The workflow should become part of a larger 3D infrastructure.

Show:

```text
CHATFLOW ENGINE
     │
 ┌───┼────┐
 │   │    │
DATA EVENTS USERS
 │   │    │
 └───┼────┘
     │
 ANALYTICS
```

Use:

- nodes
- connectors
- data particles
- depth
- lighting
- subtle volumetric effects

Everything must feel connected to the previous workflow.

---

## NETWORK

Expand the infrastructure into a broader social/business ecosystem.

Represent:

- conversations
- users
- automation
- analytics
- channels

as interconnected systems.

Do not use random logos just for decoration.

The network should communicate scale.

---

## ANALYTICS

The network should gradually collapse into clean performance metrics.

Potential placeholder metrics:

```text
AUTOMATIONS
12,482

MESSAGES PROCESSED
94,210

RESPONSE TIME
0.4s

CONVERSIONS
+38%
```

These are placeholders only.

Do not represent them as real ChatFlow claims unless supplied by the product owner.

Animate numbers.

Animate graphs.

Turn complex infrastructure into simple outcomes.

---

## FINAL REVEAL

Everything converges.

The phone recedes.

Workflow nodes collapse.

Network contracts.

Particles converge.

ChatFlow identity becomes the center.

Final copy:

```text
Turn conversations
into automated action.
```

Supporting copy:

```text
ChatFlow transforms social conversations into intelligent,
automated workflows that respond, qualify, and engage.
```

Primary:

```text
Start for Free
```

Secondary:

```text
See It in Action
```

Use approved product copy if supplied.

---

## CAMERA

Use a dedicated cinematic camera system.

Camera movement must include:

- dolly
- orbit
- approach
- pullback
- depth changes
- controlled rotation
- stabilization

Do not simply translate the camera vertically.

Use normalized scroll progress:

```text
0 → 1
```

Map scene ranges smoothly.

---

## SCROLL

Scrolling must control:

- camera
- phone
- screen
- workflow
- node execution
- particles
- network
- analytics
- copy
- transitions

The page should feel like a film scrubbed by the user's scroll.

Use interpolation/smoothing so motion feels physical.

---

## CURSOR

Desktop:

Create a subtle custom cursor.

Normal:

- small dot
- soft trailing ring

Interactive:

- ring expands
- magnetic response
- subtle highlight

Buttons should have magnetic movement.

Keep it restrained.

---

## UI

Create:

- floating navigation
- scene labels
- progress indicator
- premium CTA buttons

Use liquid-metal/glass treatments selectively.

Do not turn every component into glass.

---

## NAV

Desktop:

```text
CHATFLOW

Product
How It Works
Integrations
Pricing

                  Sign In
                  Start for Free
```

Mobile:

- hamburger
- full-screen menu
- blur backdrop
- staggered links

Keyboard accessible.

Escape closes menu.

---

## TYPOGRAPHY

Use Inter as the primary UI font.

Use Instrument Serif selectively for editorial emphasis.

Possible hero:

```text
Turn every
conversation into
an opportunity.
```

Use large typography but preserve hierarchy.

Do not fill the screen with text.

---

## MOTION

Use:

- GSAP ScrollTrigger for master scene choreography
- Theatre.js for precise 3D animation where useful
- Motion for DOM animation
- spring physics for cursor/buttons
- easing
- interpolation
- subtle inertia

Avoid:

- linear robotic animation
- excessive bouncing
- constant motion
- animation for animation's sake

---

## LIGHTING

Use cinematic lighting:

- soft key light
- rim lights
- environmental reflection
- subtle volumetric atmosphere
- restrained bloom

No rainbow neon.

No excessive glow.

---

## PARTICLES

Particles represent:

- messages
- events
- execution
- data

Use instancing.

Do not create huge numbers of independent React objects.

Particles should move along actual workflow/network paths.

---

## PERFORMANCE

Target smooth performance.

Implement:

- adaptive DPR
- instanced rendering
- efficient geometry
- lazy loading
- resource disposal
- memoization
- refs for high-frequency animation
- minimal React re-renders
- optimized postprocessing

Reduce effects on mobile.

---

## RESPONSIVE

Desktop:

full cinematic 3D.

Tablet:

simplified graph and particle system.

Mobile:

simplified but still premium 3D composition.

Do not merely scale desktop.

Do not break the story.

Touch scrolling must work.

Disable custom cursor on touch devices.

---

## WEBGL FALLBACK

If WebGL is unavailable:

show a polished 2D version.

Never show an empty canvas.

Never show broken WebGL.

---

## REDUCED MOTION

Respect:

```css
prefers-reduced-motion: reduce
```

Reduce or disable:

- camera choreography
- cursor trails
- particles
- large transitions

Keep all content accessible.

---

## ARCHITECTURE

Keep WebGL and DOM concerns separated.

Suggested:

```text
src/
  components/
  three/
  hooks/
  animations/
  styles/
```

Create reusable components:

```text
Experience
CameraRig
Phone
PhoneScreen
InstagramScene
WorkflowGraph
WorkflowNode
Connector
FollowGate
DMMessage
Infrastructure
Network
Analytics
Particles
Navbar
Cursor
ProgressIndicator
SceneLabel
```

Use data-driven workflow nodes and connections.

Do not hardcode every object independently.

---

## STATE

Use a scene state:

```ts
type Scene =
  | "intro"
  | "phone"
  | "conversation"
  | "event"
  | "workflow"
  | "followGate"
  | "dm"
  | "infrastructure"
  | "network"
  | "analytics"
  | "final";
```

Derive it from scroll progress.

Centralize timing values.

Avoid magic numbers scattered across files.

---

## IMPORTANT TRANSITIONS

Implement these transformations:

```text
message
↓
event

event
↓
workflow trigger

workflow
↓
decision

decision
↓
automated action

workflow
↓
infrastructure

infrastructure
↓
network

network
↓
analytics

analytics
↓
ChatFlow identity
```

This continuity is more important than adding more visual effects.

---

## DO NOT

Do not:

- build a generic SaaS template
- use random 3D shapes
- use stock 3D imagery
- use a generic AI brain
- use excessive neon
- use excessive glass
- use random particles
- use random floating cards
- use unrelated animations
- copy Vengeance/UI Verse/21st.dev pages
- fabricate URLs
- autoplay audio
- create fake product claims
- make every element 3D
- sacrifice readability for effects

---

## QUALITY BAR

Before finalizing, ask:

**Does this feel like an interactive cinematic product experience?**

If the answer is no, keep refining.

The final result should make a visitor think:

> "I have never seen a SaaS landing page explain its product like this."

The experience should communicate the product visually before the visitor reads the copy.

The phone, message, event, workflow, decision, DM, infrastructure, network, and analytics must feel like different states of the **same system**.

Build for visual coherence, narrative clarity, performance, responsiveness, accessibility, and production quality.

Do not stop at a technically working prototype.

Iterate until the result looks intentionally art-directed.

## END PROMPT

---

# 79. FINAL IMPLEMENTATION PRINCIPLE

The most important creative rule for the entire project:

> **Do not make a website that contains 3D. Make a 3D experience that happens to contain a website.**

The user should scroll through a visual story rather than scroll through a collection of sections.

The phone is the entry point.

The conversation is the trigger.

The workflow is the mechanism.

The Follow Gate is the decision.

The DM is the action.

The infrastructure is the scale.

The analytics are the proof.

The final ChatFlow identity is the payoff.
