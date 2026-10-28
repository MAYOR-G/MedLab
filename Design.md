# MedLab — Design System & UX Specification

**Document:** DESIGN.md  
**Version:** 1.0  
**Status:** Approved visual direction; ready for implementation planning  
**Product:** MedLab — Family Medical Records & AI Health Assistant  
**Visual direction:** B — Calm Clinical Blue  
**Reference:** Apple Health-inspired  
**Theme:** Light only  
**Navigation:** Hybrid — desktop sidebar, mobile bottom navigation  
**Density:** Balanced  

---

## 1. Visual Direction & Design Principles

### 1.1 Product vision

MedLab is a private, family-oriented medical records application that helps people organize medical documents, understand their contents, review health information over time, and share selected records securely.

The interface must make sensitive medical information feel manageable without trivializing its importance. It should feel calm, dependable, contemporary, and personal.

The experience combines:
- The clarity and restrained visual language of Apple Health.
- The information hierarchy of a high-quality medical records portal.
- The usability of a modern productivity application.
- The warmth of a family-oriented product.
- The transparency and caution expected of an AI-assisted health experience.

MedLab must not look like a hospital administration dashboard, a financial analytics application, or a generic AI chatbot.

### 1.2 Core design principles

#### Principle 1: Calm before complexity

Use restrained colors, generous whitespace, short explanatory labels, and clear visual hierarchy.

Avoid:
- Dense dashboards full of unrelated metrics.
- Excessive gradients, glowing accents, and decorative illustrations.
- Large numbers of competing cards.
- Unnecessary charts or health scores.
- Alarmist language and attention-grabbing red elements.

The user should immediately understand where their records are and what action they can take next.

#### Principle 2: Medical information must remain understandable

Medical documents often contain unfamiliar terminology, abbreviations, reference ranges, and technical language.

Design the reading experience in layers:
1. Original document and its metadata.
2. Brief AI-generated summary.
3. Plain-language explanation.
4. Important findings and relevant limitations.
5. Historical comparisons when sufficient data exists.
6. Relevant sources and an explanation of uncertainty.

Keep the original document available as the source of truth. AI-generated explanations must be visually distinguished from clinician-authored content and original laboratory findings.

Never visually imply that an AI interpretation is a confirmed diagnosis.

#### Principle 3: Privacy is visible

Security must be reflected in the interface, not hidden exclusively in technical infrastructure.

Make the following clear wherever relevant:
- Which family member a record belongs to.
- Who can access a record.
- Whether a record is private or shared.
- What information a share link exposes.
- When a share link expires.
- Whether an action changes access or permanently removes information.

Destructive actions and changes to permissions require explicit confirmation.

Avoid exposing sensitive medical information in notification previews, unnecessary page titles, URLs, or public-facing interfaces.

#### Principle 4: Family-centered, not account-confusing

A family account may contain several people's records. The current member context must be unmistakable.

Use consistent member identity indicators across:
- Record lists.
- Record detail pages.
- Upload flows.
- AI conversations.
- Historical comparisons.
- Sharing workflows.

Do not rely on color alone to distinguish family members. Combine a name or approved display label with an avatar or initials where appropriate.

Always confirm the target family member before saving an uploaded document.

#### Principle 5: Clear actions, not visual noise

Primary actions should be obvious. Secondary actions should be available but not compete with the main task.

Use filled accent buttons sparingly. Use outlined, neutral, or text actions for secondary operations.

Favor direct labels such as:
- Upload document
- View original
- Read explanation
- Compare results
- Manage access
- Create share link
- Revoke link

Avoid ambiguous labels such as "Process," "Magic," or "Optimize."

#### Principle 6: Progressive disclosure

Present essential information first and secondary detail when requested.

Examples:
- Show the document summary before the full AI explanation.
- Show share-link status before advanced sharing settings.
- Show the most relevant record metadata before technical file details.
- Show a concise comparison before detailed historical observations.

Do not hide information necessary to make a safe decision behind multiple interactions.

### 1.3 Brand personality

| Attribute | Direction |
|---|---|
| Trustworthy | Clear labels, predictable behavior, transparent limitations |
| Calm | Soft neutral backgrounds and restrained blue accents |
| Human | Family context and approachable language |
| Precise | Consistent dates, units, document status, and metadata |
| Private | Explicit access controls and careful information disclosure |
| Intelligent | AI explanations presented as assistance, not authority |

### 1.4 Visual rules

- Use a predominantly white and pale blue-gray interface.
- Use dark navy for primary text and selected navigation.
- Reserve saturated blue for primary actions, focus indicators, and important interactive elements.
- Use thin borders instead of decorative shadows.
- Use medium-radius cards with consistent spacing.
- Use large, readable page headings and compact, clearly grouped metadata.
- Keep charts simple, labeled, and clinically meaningful.
- Avoid unnecessary motion, floating decorative objects, and ornamental gradients.
- Never use a color as the only indication of abnormal findings, permissions, or status.

### 1.5 Design hierarchy

The hierarchy for most authenticated screens is:

1. Application navigation and current family/member context.
2. Page title and concise description.
3. Primary action.
4. Main content.
5. Supporting information and metadata.
6. Secondary actions.

On document detail pages, the original document and its AI-generated explanation should receive the most attention.

On sharing and permission screens, access scope and expiry information take precedence over convenience actions.

---

## 2. Color System & Semantic Tokens

All colors below are approved design values. RGB values use the conventional 0–255 format.

### 2.1 Core palette

| Token | Hex | RGB | Intended use |
|---|---|---|---|
| Primary background | #F7FAFC | 247, 250, 252 | Application canvas |
| Surface / card | #FFFFFF | 255, 255, 255 | Cards, dialogs, menus, navigation |
| Elevated surface | #FFFFFF | 255, 255, 255 | Modals, popovers, floating panels |
| Primary text | #172B4D | 23, 43, 77 | Headings and important content |
| Secondary text | #64748B | 100, 116, 139 | Descriptions, metadata, helper text |
| Tertiary text | #8491A5 | 132, 145, 165 | Low-priority metadata; use cautiously |
| Primary accent | #2563EB | 37, 99, 235 | Primary buttons and active controls |
| Accent hover | #1D4ED8 | 29, 78, 216 | Hovered primary controls |
| Accent pressed | #1E40AF | 30, 64, 175 | Pressed primary controls |
| Accent tint | #EFF6FF | 239, 246, 255 | Selected rows and informational highlights |
| Border | #DCE5EF | 220, 229, 239 | Card borders, dividers, input borders |
| Strong border | #C5D1DF | 197, 209, 223 | Emphasized boundaries |
| Subtle fill | #F1F5F9 | 241, 245, 249 | Hover states and secondary surfaces |
| Input fill | #FFFFFF | 255, 255, 255 | Text inputs and form controls |
| Disabled fill | #E8EDF3 | 232, 237, 243 | Disabled controls |
| Disabled text | #8491A5 | 132, 145, 165 | Disabled labels |

### 2.2 Semantic colors

Semantic colors communicate meaning, not decoration.

| Meaning | Foreground | Background | Border |
|---|---|---|---|
| Success | #166534 | #F0FDF4 | #BBF7D0 |
| Information | #1D4ED8 | #EFF6FF | #BFDBFE |
| Warning | #92400E | #FFFBEB | #FDE68A |
| Error / destructive | #B91C1C | #FEF2F2 | #FECACA |
| Neutral | #475569 | #F1F5F9 | #CBD5E1 |

Use these colors for application feedback, file-processing status, permission changes, and system messages.

**Medical interpretation rule:** application status colors must not be treated as a clinical classification system. An upload success indicator is not equivalent to a medically normal result. Any clinical status must be grounded in the source report, appropriate reference ranges, units, and relevant context.

### 2.3 Navigation colors

| Element | Color |
|---|---|
| Sidebar background | #FFFFFF |
| Sidebar border | #DCE5EF |
| Navigation label | #475569 |
| Navigation icon | #64748B |
| Active navigation background | #EFF6FF |
| Active navigation text | #1D4ED8 |
| Active navigation icon | #2563EB |
| Navigation hover background | #F1F5F9 |
| Mobile navigation background | #FFFFFF |
| Mobile navigation top border | #DCE5EF |

Active states must remain clear without relying solely on blue. Use a background tint and a distinct icon/text treatment.

### 2.4 Medical document and AI colors

| Element | Color |
|---|---|
| Original document container | #FFFFFF |
| AI explanation background | #F0F7FF |
| AI explanation border | #D6E8FF |
| AI label | #1D4ED8 |
| Source citation background | #F1F5F9 |
| Clinical reference-range note | #F8FAFC |
| Missing information notice | #FFFBEB |
| Uncertain interpretation notice | #FFFBEB |

AI content should be identifiable by a restrained blue-tinted panel and an explicit label such as "AI-generated explanation."

Do not use the AI accent to suggest that generated text has been clinically verified.

### 2.5 Color application rules

- Use primary text for most content; do not render all body text in secondary gray.
- Use accent blue for actionable controls, links, selection, and focus.
- Do not use the accent for every icon, badge, heading, or decorative element.
- Maintain adequate contrast for all normal and small text.
- Keep disabled controls visibly disabled but readable.
- Ensure destructive actions remain recognizable without relying on red alone.
- Do not use semantic success colors to represent normal medical findings unless the clinical meaning and context are explicitly established.

### 2.6 Contrast requirements

Target WCAG 2.2 AA:
- Normal text: contrast ratio of at least 4.5:1.
- Large text: at least 3:1.
- Meaningful interface boundaries and visual control states: at least 3:1 against adjacent colors where required.
- Focus indicators: clearly visible against surrounding surfaces.

Muted text and tertiary metadata must be contrast-tested before release. If a color fails, darken it rather than reducing the font size or relying on users to zoom.

---

## 3. Typography System

### 3.1 Font family

**Primary font:** Inter  
**Fallbacks:** system UI sans-serif fonts appropriate to the user's operating system.

Inter is selected for legibility, neutral character, and consistent rendering across browsers and platforms.

Use the same primary font throughout the application. Avoid introducing decorative fonts or multiple unrelated typefaces.

### 3.2 Font weights

| Role | Weight |
|---|---:|
| Display / major page heading | 650–700 |
| Page heading | 600–650 |
| Section heading | 600 |
| Card heading | 550–600 |
| Body text | 400–450 |
| Supporting text | 400 |
| Emphasized labels | 500–600 |
| Button labels | 550–600 |
| Metadata | 400–500 |

Do not use light-weight typography for essential medical data or small labels.

### 3.3 Type scale

| Token | Size | Line height | Typical use |
|---|---:|---:|---|
| Display | 36 px | 44 px | Optional landing-page headline |
| H1 | 30 px | 38 px | Main authenticated page heading |
| H2 | 24 px | 32 px | Major section heading |
| H3 | 20 px | 28 px | Card group or page subsection |
| H4 | 18 px | 26 px | Card title or dialog heading |
| Body large | 16 px | 26 px | Medical explanations and important descriptions |
| Body | 14 px | 22 px | Default application content |
| Body small | 13 px | 20 px | Supporting descriptions |
| Label | 13 px | 18 px | Form labels and compact controls |
| Caption | 12 px | 18 px | Secondary metadata |
| Micro-label | 11 px | 16 px | Rare, nonessential metadata only |

Avoid using 11–12 px for instructions, medical caveats, or important permission details.

Medical summaries should default to 15–16 px body text where space permits, with comfortable line spacing and short paragraphs.

### 3.4 Heading rules

- Each page should have one clear H1.
- Use descriptive section headings.
- Preserve a logical hierarchy; do not select heading levels solely for their visual size.
- Avoid all-uppercase headings for normal content.
- Keep headings short enough to scan.
- Use sentence case for page and section headings.

Preferred:
- "Your medical records"
- "Family members"
- "Recent lab results"
- "AI-generated explanation"
- "Manage sharing access"

Avoid:
- "WELCOME BACK!!!"
- "AI MAGIC"
- "YOUR HEALTH COMMAND CENTER"

### 3.5 Medical data typography

For dates, measurement values, units, and reference ranges:
- Use consistent number formatting.
- Keep values and units together.
- Do not truncate clinically meaningful numbers or units.
- Distinguish measured values from reference ranges.
- Preserve source precision where relevant.
- Display dates unambiguously, such as "26 Oct 2026," and include the source's date where available.
- Respect the user's configured locale for dates, decimal separators, and units where supported.

A monospaced font is optional for technical identifiers, file sizes, or diagnostic codes. It should not be used for long medical explanations.

### 3.6 Readability rules

- Body copy should generally be 14 px or larger.
- Prefer 60–80 characters per line for long-form explanations on desktop.
- Use a narrower reading column for medical summaries.
- Avoid long unbroken paragraphs.
- Use lists for separate findings and instructions.
- Do not communicate important distinctions solely through italics or font weight.
- Support browser zoom without clipping text or controls.

---

## 4. Spacing, Layout Grid & Elevation System

### 4.1 Spacing scale

Use a consistent spacing system based on four-pixel increments.

| Token | Value | Typical use |
|---|---:|---|
| XS | 4 px | Icon-label separation, tiny adjustments |
| S | 8 px | Related inline elements |
| M | 12 px | Compact form and metadata groups |
| L | 16 px | Default internal component spacing |
| XL | 24 px | Card padding and section spacing |
| 2XL | 32 px | Major content group spacing |
| 3XL | 40 px | Page section separation |
| 4XL | 48 px | Large layout gaps |
| 5XL | 64 px | Major page-level whitespace |

The default card padding is 24 px on desktop and 16–20 px on mobile.

Spacing should communicate relationships: tightly group related content and create larger gaps between distinct tasks.

### 4.2 Layout grid

Use a responsive, 12-column conceptual grid on desktop, an eight-column layout on tablet, and a four-column layout on mobile.

| Viewport | Layout behavior |
|---|---|
| Large desktop: 1440 px and above | Spacious content region; fixed navigation |
| Desktop: 1024–1439 px | Standard content width and sidebar |
| Tablet: 768–1023 px | Reduced gutters; compact navigation treatment |
| Mobile: below 768 px | Single-column content and bottom navigation |

Suggested page gutters:
- Large desktop: 40 px.
- Standard desktop: 32 px.
- Tablet: 24 px.
- Mobile: 16 px.

These are design targets rather than fixed constraints. Content must remain usable at intermediate widths.

### 4.3 Application shell

Desktop layout:
- Left navigation sidebar: approximately 248 px wide.
- Main content: remaining viewport width.
- Main content maximum width: approximately 1440 px.
- Narrow reading content: approximately 760–900 px.
- Document and AI comparison views may use a wider content area when needed.

Keep the sidebar stable while the main content scrolls, except where the viewport requires a different arrangement.

Do not let long medical documents force the entire application layout to become excessively wide.

### 4.4 Cards

Default card specification:
- Background: #FFFFFF.
- Border: 1 px solid #DCE5EF.
- Radius: 16 px.
- Padding: 24 px desktop; 16–20 px mobile.
- No default shadow.
- Optional subtle shadow only for overlays or clearly floating surfaces.

Cards should group related information, not become the default container for every label or sentence.

Avoid nested cards unless the hierarchy genuinely requires them.

### 4.5 Border radius

| Component | Radius |
|---|---:|
| Small badges | 6–8 px |
| Inputs | 10–12 px |
| Standard buttons | 10–12 px |
| Cards | 16 px |
| Large feature panels | 20 px |
| Dialogs | 20 px |
| Avatar | Circular |
| Compact status indicators | Pill or 6 px |
| Mobile bottom navigation | Follow the device-safe-area layout; no oversized floating pill by default |

Use rounded controls consistently without making the entire application look playful.

### 4.6 Elevation

Use elevation sparingly.

| Layer | Treatment |
|---|---|
| Page canvas | No shadow |
| Standard card | Border only |
| Hovered card | Optional subtle background change |
| Dropdown / popover | Light shadow and border |
| Modal / dialog | Moderate shadow and border |
| Mobile bottom navigation | Border and optional very subtle separation |

Avoid strong drop shadows, neumorphism, glassmorphism, and persistent floating action buttons unless a specific interaction justifies them.

### 4.7 Icons

Use a consistent outline icon family with consistent stroke weight and optical sizing.

Typical sizes:
- 16 px: compact inline actions.
- 18 px: standard buttons and form adornments.
- 20 px: navigation and common actions.
- 24 px: prominent feature or empty-state icons.

Icons must have text labels or accessible names when their meaning is not self-evident. Never use an icon alone for a destructive or security-sensitive action without an accessible label and appropriate confirmation.

### 4.8 Page density

Balanced density is the default:
- Keep key information visible without requiring excessive scrolling.
- Allow whitespace around headings and major sections.
- Use compact metadata rows where appropriate.
- Avoid oversized dashboard cards that reduce useful content.
- Do not compress medical explanations to fit a dashboard.

Prioritize readability over maximizing the number of records shown at once.

---

## 5. Reusable Component Specifications

### 5.1 Buttons

#### Primary button

Purpose: the main action in a view.

Appearance:
- Blue background: #2563EB.
- White label.
- Radius: 10–12 px.
- Medium or semibold text.
- Height target: 44 px.
- Comfortable horizontal padding.

States:
- Default: #2563EB.
- Hover: #1D4ED8.
- Pressed: #1E40AF.
- Focus: visible high-contrast focus indicator.
- Disabled: disabled fill and text tokens.
- Loading: preserve the button's dimensions, indicate progress, prevent duplicate submission.

Use one primary action per visual region where possible.

Examples:
- Upload document.
- Save changes.
- Generate explanation.
- Create share link.

#### Secondary button

Purpose: an important action that is not the primary action.

Appearance:
- White background.
- Dark navy label.
- One-pixel border: #DCE5EF.
- Same radius and height as primary buttons.

Examples:
- Cancel.
- View original.
- Edit details.

#### Tertiary button

Purpose: low-emphasis actions.

Appearance:
- Transparent background.
- No persistent border.
- Dark or accent-colored label.
- Clear hover and focus states.

Examples:
- View all.
- Show details.
- Learn more.

#### Destructive button

Purpose: revoke access, remove a family member, or initiate a destructive operation.

Appearance:
- Use the semantic error color.
- Reserve filled destructive styling for the final destructive action.
- Do not position it adjacent to unrelated primary actions without sufficient separation.

Examples:
- Revoke share link.
- Delete record.
- Remove member.

Destructive actions must have explicit labels and suitable confirmation. The confirmation should explain the consequence and whether recovery is possible.

### 5.2 Cards

#### Record card

Required information where available:
- Document title or source filename.
- Document type.
- Relevant family member.
- Document date.
- Upload or processing status.
- Optional brief AI summary.
- Clear action to open the record.

Rules:
- Use a small document-type icon.
- Do not display a full medical interpretation in a compact card.
- Avoid exposing sensitive details in hover-only content.
- Do not use an unknown document date as the upload date.
- Clearly distinguish document date from upload date.

#### Family member card

Include:
- Display name.
- Avatar or initials.
- Relationship label if provided and appropriate.
- Record count only when accurate and useful.
- Available management actions according to the viewer's permissions.

Never suggest that a family member is independently authorized to access another member's records merely because they appear in the same family.

#### AI explanation panel

Include:
- Label: "AI-generated explanation."
- Brief summary.
- Expanded explanation when requested.
- Relevant source references where available.
- Uncertainty or missing-context notice when necessary.
- Clear action to view the original report.

Do not style this panel like a doctor's signed assessment.

#### Historical comparison card

Include:
- Test or measurement name.
- Value and unit.
- Measurement date.
- Previous value or trend where comparable data exists.
- Reference range and source, if available.
- Caveat when dates, methods, units, or sources are not directly comparable.

Never create a trend chart when there is insufficient reliable data.

### 5.3 Badges and status labels

Use small, low-emphasis badges with readable text.

Examples:
- Uploaded
- Processing
- Ready
- Failed
- Private
- Shared
- Expired
- Revoked

Rules:
- Use neutral colors for routine states.
- Use semantic colors for genuine system success, warning, or error.
- Always include a text label.
- Do not rely on color alone.
- Avoid unnecessary status badges on every item.

A failed AI explanation must not make the original uploaded document appear unavailable if the document itself remains accessible.

### 5.4 Inputs

Inputs include text fields, search, select controls, date controls, file selection, and text areas.

Appearance:
- White fill.
- One-pixel border: #DCE5EF.
- Radius: 10–12 px.
- Minimum target height: 44 px for common controls.
- Persistent, programmatically associated labels.
- Visible focus state.
- Clear error and helper-text placement.

Rules:
- Never rely on placeholders as the only labels.
- Preserve valid user-entered data when validation fails.
- Explain how to correct an error.
- Mark required fields clearly.
- Do not clear an entire form because one field is invalid.
- Do not show success feedback before the server confirms the operation.

### 5.5 Search

Search should be easy to discover from the records interface.

Support the search and filter capabilities defined by the product scope, such as:
- Document title.
- Document type.
- Family member.
- Relevant date or date range.
- Available categories.

Do not imply that search indexes document contents or medical terminology unless that capability is actually implemented.

Search behavior:
- Show a clear loading state.
- Preserve the query while loading.
- Show a useful no-results message.
- Provide a way to clear filters.
- Avoid leaking previous search results across account or family-context changes.

### 5.6 Modals and dialogs

Use dialogs for focused tasks that require confirmation or a small amount of input.

Examples:
- Confirm deletion.
- Revoke a share link.
- Add or invite a family member.
- Confirm access changes.
- Choose the contents of a share link.

Rules:
- Provide a descriptive title.
- Explain consequences before destructive actions.
- Include a clear cancel action.
- Use a single obvious confirmation action.
- Prevent accidental background interaction.
- Support keyboard navigation and Escape dismissal where appropriate.
- Restore focus to the initiating control when closed.
- On mobile, use a full-screen or near-full-screen treatment when a small modal would be cramped.

Do not place long medical explanations inside small dialogs.

### 5.7 Tables and structured lists

Use structured tables for desktop data where comparison across columns is useful.

Examples:
- Historical lab values.
- Document metadata.
- Share-link history.
- Family access records, when supported.

Rules:
- Use clear column headings.
- Keep date and value relationships unambiguous.
- Preserve units alongside measurements.
- Use a mobile-friendly alternative when a table becomes too wide.
- Never hide essential values solely in horizontal overflow.
- Do not use row color alone to communicate medical meaning.

### 5.8 Toasts and inline feedback

Use toasts for short, non-sensitive confirmation messages.

Examples:
- "Changes saved."
- "Share link revoked."
- "Document uploaded."

Use inline feedback for:
- Form validation.
- AI limitations.
- Failed processing.
- Access errors.
- Important warnings that users must understand before proceeding.

Avoid including diagnoses, test results, or other sensitive medical details in toast messages or operating-system notifications.

### 5.9 File upload component

The upload experience should support the document formats approved for the MVP, including PDF files and supported image formats.

Include:
- Drag-and-drop area on compatible desktop devices.
- Browse-files action.
- Supported file types.
- Maximum file size.
- Selected filename and size.
- Upload progress.
- Retry action for recoverable failures.
- Family-member assignment.
- Document category and date fields where supported.
- Processing status after upload.

The actual maximum file size and accepted MIME types must be defined in the implementation configuration and enforced on the server.

Rules:
- Validate file type, size, and upload permissions.
- Do not trust a filename or client-provided MIME type as the only security check.
- Never treat a successful upload as proof that AI analysis succeeded.
- Preserve the original file if an optional AI-processing step fails.
- Warn users before abandoning an in-progress upload.
- Make the destination family member visible before the final upload.

### 5.10 Document viewer

The viewer should support the actual file formats available in the MVP.

Include:
- Document title.
- Source filename where appropriate.
- Family member.
- Document date and upload date where available.
- Preview or viewing area.
- Download original action.
- Back-to-records navigation.
- AI explanation access.
- Sharing controls when authorized.

For PDFs and images, keep the viewer visually distinct from the AI explanation panel.

If an embedded preview is unsupported or fails, provide a clear download or open-original action when the user's permissions allow it.

Never expose a private storage URL as a substitute for a controlled download flow.

### 5.11 Share-link component

Share links require a higher standard of clarity than ordinary links.

Display:
- Link status.
- Creation date.
- Expiration date and time, including timezone where relevant.
- The documents or categories included.
- Available actions: copy, inspect, or revoke.
- Confirmation that revocation prevents future access after the change takes effect.

During link creation, require the owner to select what is shared and choose an expiration duration.

The design must support short durations such as one minute, one hour, or two days if permitted by product rules.

Do not create a link until the user has reviewed the selected content and expiry.

An expired or revoked link must not display the protected content.

### 5.12 AI assistant component

The AI assistant should look like a focused health-information tool, not an entertainment chatbot.

Include:
- Clear conversation history within the applicable privacy scope.
- A concise input area.
- Optional document attachment or document selection where supported.
- Loading and failure states.
- Source references where available.
- Appropriate safety notices.
- Clear actions to open relevant saved records.

Distinguish:
1. User-provided information.
2. Original document content.
3. AI-generated explanation.
4. External medical references.

Do not imply that the assistant can access every family document unless it has actually retrieved those documents and the user has permission to access them.

Do not silently send unrelated family medical records to the AI provider.

### 5.13 Charts and result visualizations

Charts should be introduced only when they improve understanding.

Requirements:
- Display units.
- Display measurement dates.
- Identify the source of the data.
- Use clear labels and accessible text alternatives.
- Explain whether reference ranges are available.
- Distinguish missing data from zero values.
- Avoid misleading scales.
- Use a restrained visual style.

For historical comparisons, only compare measurements that are sufficiently compatible. Explain relevant limitations when the test method, unit, or context differs.

---

## 6. Navigation & Form UX Rules

### 6.1 Desktop navigation

Use a persistent left sidebar.

Recommended structure:

**Main**
- Overview
- Medical records
- AI health assistant
- Search

**Family**
- Family members

**Account**
- Settings

Use a consistent icon and label for each navigation item.

The active route should have:
- A light-blue background.
- Blue icon and label.
- A clearly visible active state.
- Accessible current-page semantics.

The sidebar may include a family or member context selector when needed. Keep this separate from account settings and make its effect explicit.

### 6.2 Mobile navigation

Use a compact bottom navigation for the most frequently used destinations.

Recommended items:
- Home
- Records
- Assistant
- Family
- Settings or More

Choose the final item count based on usability testing. Do not cram every desktop destination into the bottom bar.

Requirements:
- Respect device safe areas.
- Ensure controls are large enough to tap.
- Keep labels visible where space permits.
- Provide an obvious active state.
- Ensure the navigation does not obscure primary page actions, file controls, or form submission buttons.
- Hide or adapt the bottom bar when it obstructs a critical full-screen document viewer or keyboard interaction.

Secondary settings and detailed management pages can remain accessible through a secondary navigation view.

### 6.3 Navigation behavior

- Preserve the user's intended destination during authentication when safe.
- Use clear breadcrumbs on deep record and settings pages where they help orientation.
- Keep record detail navigation consistent.
- Preserve filters and search context when returning to the records list.
- Do not switch the selected family member without communicating the change.
- Confirm before discarding unsaved form data.
- Never use navigation changes to imply that a failed save succeeded.

### 6.4 Family context rules

The currently selected family member must be clear in every workflow where ownership matters.

Before saving a document:
- Show the destination member.
- Allow correction before submission.
- Confirm the final assignment in the resulting record detail.

Before using family records in AI:
- Make the scope clear where necessary.
- Enforce the same authorization rules as the records interface.
- Avoid returning data from a member the user cannot access.

### 6.5 Form design

Forms should use a simple vertical structure.

Order fields according to the user's task, not internal database structure.

For record metadata, the sequence should generally be:
1. Destination family member.
2. Document or report title, if editable.
3. Document type or category.
4. Document date, if known.
5. Optional supporting details.

Do not require users to supply information that can safely be extracted from the document unless the information is necessary or extraction is uncertain.

### 6.6 Validation

Validation should:
- Run at an appropriate time, such as on blur or submission.
- Identify the specific invalid field.
- Explain what needs to change.
- Preserve other valid fields.
- Move focus to the first relevant error when appropriate.
- Provide an accessible relationship between the field and error message.

Avoid showing errors before the user has a reasonable opportunity to interact with a field.

### 6.7 Unsaved changes

For forms or editing workflows:
- Indicate unsaved changes when relevant.
- Warn before leaving if meaningful changes would be lost.
- Offer explicit actions to stay or discard.
- Do not show this warning for forms with no changes.
- Do not imply that a change has been saved until persistence is confirmed.

### 6.8 Authentication UX

Support email authentication and Google sign-in as approved in the product scope.

Include:
- Sign-in.
- Account creation.
- Password recovery where applicable.
- Clear validation.
- Loading and provider-error states.
- Session-expiry handling.
- Sign-out confirmation where appropriate.

Do not expose whether a sensitive account exists through unnecessarily specific authentication error messages.

Google authentication failures should offer a safe retry or alternate sign-in path.

### 6.9 Permission UX

Use explicit, plain-language explanations of access.

Before sharing:
- Identify the intended content.
- Identify whether the link is unlisted.
- Explain that anyone possessing the link may be able to access the selected content, subject to the implemented access controls.
- Display expiry information.
- Provide a final review before creation.

Do not use the term "private link" to imply identity verification when the link is only protected by possession of an unlisted URL.

---

## 7. UI Feedback States

Every major data-dependent screen must define loading, success, empty, error, and permission-denied states as applicable.

### 7.1 Loading

Use restrained skeletons for page layouts and lists.

Good loading states:
- A few record-card placeholders.
- A document viewer placeholder.
- A concise loading label for a focused operation.
- A progress indicator for uploads or processing.

Rules:
- Preserve layout dimensions to minimize layout shift.
- Avoid endless animated skeletons.
- Respect reduced-motion preferences.
- Communicate long-running work when possible.
- Distinguish uploading from AI processing.
- Never use a spinner as the only indication of a long-running process without context.

### 7.2 Empty states

Empty states should explain what is missing and offer an appropriate next step.

#### No records

Heading: "Your records start here"

Supporting text: "Upload a medical report or scan to keep it organized in MedLab."

Primary action: "Upload document"

#### No family members

Heading: "Set up your family"

Supporting text should explain how family members are managed and what access means.

Primary action: the approved member-management action.

Do not imply that adding a person automatically grants that person access.

#### No search results

Heading: "No matching records"

Supporting text: "Try another search or remove some filters."

Action: "Clear filters"

#### No AI history

Heading: "Start a health conversation"

Supporting text: explain that users can ask questions or select an authorized medical document.

Action: "Ask a question"

#### No historical comparison

Explain that there are not enough comparable measurements to produce a meaningful comparison.

Do not fabricate a trend, score, or baseline.

### 7.3 Upload states

Support:
- File selection.
- Validation.
- Upload in progress.
- Upload success.
- Processing in progress.
- Analysis success.
- Analysis failure.
- Upload failure.
- Retry.

Use separate statuses for the file and its AI-generated explanation.

Example:
- File: Uploaded.
- Explanation: Processing.

If the explanation fails, the record remains available when the original upload succeeded.

### 7.4 AI states

#### Ready

Show the prompt area and useful examples without overwhelming the user.

#### Generating

Indicate that the assistant is preparing a response.

Do not imply that the response is medically verified merely because processing is complete.

#### Partial or uncertain result

Explain when the document is incomplete, unreadable, ambiguous, or missing relevant context.

Do not invent missing values or infer a diagnosis from insufficient evidence.

#### Failed

Provide a short explanation and a retry action.

Preserve the user's input when possible.

#### No reliable source available

Make clear that a statement could not be adequately supported. Avoid presenting unverified claims with the same confidence as source-backed information.

### 7.5 Error states

Errors must be understandable and actionable.

| Situation | UX response |
|---|---|
| Network failure | Explain that the request could not be completed and offer retry |
| Invalid upload | Explain the supported type or size constraint |
| Expired session | Ask the user to sign in again and preserve safe navigation context |
| Permission denied | Explain that the current account cannot access the requested resource |
| Record not found | Show a not-found state without revealing sensitive information |
| AI provider unavailable | Explain temporary unavailability and offer retry when appropriate |
| File preview failure | Offer another supported viewing method or authorized download |
| Save failure | Preserve form data and make the unsaved state clear |
| Share-link creation failure | Do not display a valid-looking link; allow a safe retry |
| Revocation failure | Keep the current status visible and do not claim access has been revoked |

Avoid exposing stack traces, internal service details, database identifiers, tokens, or provider credentials.

### 7.6 Permission-denied states

When access is denied:
- Do not render the protected content.
- Do not expose sensitive metadata unnecessarily.
- Provide a neutral explanation.
- Offer a safe return path.
- Do not suggest bypassing access controls.

The same rule applies to expired and revoked share links.

### 7.7 Success states

Success messages must reflect confirmed server outcomes.

Examples:
- "Document uploaded."
- "Changes saved."
- "Share link created."
- "Share link revoked."

For asynchronous operations, distinguish completion of the initial request from completion of the background task.

### 7.8 Offline and interrupted workflows

If offline or interrupted behavior is not supported, state that the operation could not be completed and provide a retry path.

Do not claim that medical documents are safely available offline unless an explicitly designed and secured offline capability exists.

Avoid caching sensitive document content in a way that exposes it after logout or on a shared device.

---

## 8. Micro-Interactions & Motion Guidelines

### 8.1 General approach

Motion should explain a change in state or help users understand navigation.

The product should feel responsive without being animated for its own sake.

### 8.2 Timing

Recommended motion ranges:
- Hover and focus transitions: 100–160 ms.
- Button press feedback: 80–140 ms.
- Tooltip appearance: 150–200 ms.
- Popover or menu entrance: 140–200 ms.
- Modal entrance and exit: 160–220 ms.
- Page-level transitions: 180–240 ms when needed.

Use simple ease-out transitions for entrances and restrained ease-in transitions for exits.

Avoid long or spring-heavy animations for routine medical tasks.

### 8.3 Approved interactions

- Buttons subtly change background on hover and press.
- Navigation items transition to the active tint.
- Cards may change border or background on hover.
- Upload progress updates smoothly.
- Dialogs fade and move a small distance into place.
- Expandable explanations reveal content predictably.
- Successful actions display a concise confirmation.
- Loading indicators communicate ongoing work.

### 8.4 Avoid

- Bouncing cards.
- Animated medical values that imply changing measurements.
- Confetti for routine medical operations.
- Decorative parallax.
- Persistent pulsing status indicators.
- Excessive blur and glass effects.
- Motion that delays access to medical information.

### 8.5 Reduced motion

Respect the operating system's reduced-motion preference.

When reduced motion is requested:
- Remove nonessential movement.
- Replace animated transitions with immediate state changes or minimal fades.
- Keep progress indicators understandable.
- Preserve functional feedback.

### 8.6 Sensitive transitions

For member switching, record deletion, permission changes, and share-link revocation:
- Use direct state changes and clear confirmation.
- Never rely on animation to communicate completion.
- Keep the resulting status visible.
- Do not conceal access-control failures behind optimistic transitions.

---

## 9. Responsive Behavior & Breakpoints

### 9.1 Breakpoints

Use these conceptual breakpoints as the initial responsive design system.

| Breakpoint | Width | Layout |
|---|---:|---|
| Small mobile | Below 480 px | Single column, compact spacing |
| Mobile | 480–767 px | Single column, bottom navigation |
| Tablet | 768–1023 px | Adaptive sidebar or compact navigation |
| Desktop | 1024–1439 px | Persistent sidebar |
| Large desktop | 1440 px and above | Persistent sidebar and wider content region |

These values are starting points. Actual layout changes must be driven by content fit, not device names alone.

### 9.2 Mobile principles

- One primary column for most pages.
- Keep page titles and main actions easy to reach.
- Use bottom navigation for primary destinations.
- Stack form fields vertically.
- Make file selection straightforward without requiring drag-and-drop.
- Use responsive document previews.
- Keep important medical values and units together.
- Avoid multi-column card layouts that produce narrow text.
- Ensure the keyboard does not obscure the active input or submission action.

### 9.3 Tablet principles

- Use a compact or collapsible sidebar when space is limited.
- Preserve clear navigation.
- Use two-column layouts only when both columns remain readable.
- Stack document and explanation panels when their widths become insufficient.
- Avoid forcing desktop tables into narrow screens.

### 9.4 Desktop principles

- Maintain consistent alignment across pages.
- Use available space for meaningful comparison and document review.
- Avoid excessively wide paragraphs.
- Keep the sidebar stable.
- Use two-panel layouts when they improve a specific task, especially original document versus AI explanation.

### 9.5 Document detail responsiveness

Desktop:
- Use a two-column or split-pane arrangement when practical.
- Keep the original document and explanation visually distinct.
- Allow the document pane to scroll independently only when this improves usability.

Mobile:
- Use a single-column layout.
- Present a clear way to switch between the original document and explanation.
- Keep download and navigation controls accessible.
- Avoid shrinking a full report into an unreadable miniature.
- Keep the member identity and document title visible.

### 9.6 Tables and charts

- Replace wide tables with stacked rows or a focused horizontal comparison where appropriate.
- Preserve units and measurement dates.
- Provide text alternatives for chart information.
- Do not require horizontal scrolling to access the only representation of an essential medical value.

### 9.7 Touch targets

Aim for at least 44 × 44 CSS pixels for primary interactive targets, with adequate separation between adjacent controls.

Small inline actions may be visually compact only when their effective interactive target remains accessible and easy to use.

### 9.8 Zoom and reflow

At browser zoom and narrow viewport sizes:
- Do not clip essential content.
- Avoid horizontal page scrolling except for justified, accessible data views.
- Keep dialogs within the viewport.
- Preserve keyboard access to all controls.
- Ensure form labels and error messages remain visible.

---

## 10. Accessibility

### 10.1 Compliance target

Target WCAG 2.2 Level AA across core user journeys.

Accessibility is a product requirement, not a final visual-polish task.

### 10.2 Semantic structure

Use meaningful page and content structure:
- One primary page heading.
- Logical heading hierarchy.
- Navigation landmarks.
- Main content landmark.
- Properly labeled forms.
- Semantic buttons and links.
- Accessible dialog behavior.
- Table headers for tabular data.

Visual appearance must not replace semantic meaning.

### 10.3 Keyboard navigation

All essential functions must work with a keyboard.

Requirements:
- Logical tab order.
- Visible focus indicators.
- No keyboard traps.
- Accessible dropdown and dialog behavior.
- Keyboard-accessible file selection.
- Keyboard-accessible record actions.
- Focus restoration after modal dismissal.
- A skip-navigation mechanism where appropriate.

### 10.4 Focus appearance

Use a clearly visible focus indicator with sufficient contrast against the surrounding background.

Do not remove browser focus styling unless an equally visible replacement is provided.

Focus must not be hidden beneath sticky headers, sidebars, or bottom navigation.

### 10.5 Screen readers

- Associate every form field with its label.
- Associate validation errors with their fields.
- Give icon-only controls accessible names.
- Announce important asynchronous status changes appropriately.
- Identify the active navigation destination.
- Describe file upload progress.
- Label charts and provide text summaries.
- Keep decorative icons out of the accessibility tree where appropriate.
- Do not announce every minor animation or repeated visual update.

### 10.6 Color independence

Never rely exclusively on color to communicate:
- Medical status.
- Abnormal findings.
- Upload completion.
- Processing errors.
- Active navigation.
- Permission state.
- Link expiry.
- Form validation.

Use text, icons, labels, or patterns as appropriate.

### 10.7 Accessible medical content

Medical explanations should:
- Use readable font sizes.
- Maintain adequate contrast.
- Use descriptive headings.
- Keep related values and units together.
- Avoid abbreviations without explanation when possible.
- Present uncertainty in plain language.
- Avoid relying on color-coded charts alone.
- Offer access to the original report where authorized.

### 10.8 Forms and errors

- Provide persistent labels.
- Identify required fields.
- Explain errors clearly.
- Preserve entered data.
- Use appropriate status announcements.
- Avoid communicating success only through a brief color change.
- Move focus to relevant errors when helpful.

### 10.9 Motion and animation

Respect reduced-motion settings.

Do not use flashing or rapidly changing content to attract attention.

Provide sufficient time for users to read notices and understand permission changes.

### 10.10 Accessibility and security

- Do not expose sensitive information through accessible names that unnecessarily reveal it in public or shared contexts.
- Ensure authentication controls remain accessible.
- Ensure access-denied states do not expose protected document contents.
- Keep confirmation dialogs understandable to screen-reader users.
- Make share-link expiry and access scope available as text, not only through visual indicators.

---

## 11. Page-by-Page Layout Blueprint

This section defines the intended visual structure for the core MedLab pages. Route names are proposed design references and must be reconciled with the approved PRD and final routing plan before implementation.

### 11.1 Public landing page

**Proposed route:** `/`

Purpose: explain MedLab's value and provide entry points to authentication.

Layout:
1. Minimal header with MedLab identity and sign-in action.
2. Hero section with a clear statement about organizing family medical records.
3. Short supporting explanation.
4. Primary call to action to get started.
5. Feature overview: document organization, understandable explanations, historical comparisons, controlled sharing.
6. Privacy and security explanation.
7. Footer with appropriate legal and product links.

Visual guidance:
- White or pale blue-gray background.
- Dark navy headline.
- Restrained blue accent.
- Simple product imagery or genuine interface previews.
- No exaggerated medical claims or artificial health-score graphics.

Avoid claiming regulatory compliance, diagnostic accuracy, or security certifications without verification.

### 11.2 Sign-in page

**Proposed route:** `/login`

Purpose: allow returning users to authenticate.

Layout:
1. MedLab identity.
2. Heading: "Welcome back."
3. Brief instruction.
4. Email and password fields.
5. Sign-in action.
6. Google sign-in action.
7. Password recovery link.
8. Account creation link.
9. Small privacy reassurance.

Keep the form centered within a comfortable-width container.

Use inline validation and preserve a safe return destination when authentication succeeds.

### 11.3 Account creation page

**Proposed route:** `/signup`

Purpose: create a MedLab account.

Layout:
1. MedLab identity.
2. Heading: "Create your account."
3. Required account fields.
4. Password guidance where applicable.
5. Relevant terms and privacy notices.
6. Primary create-account action.
7. Google sign-in option.
8. Existing-account link.

Keep the form focused. Do not request extensive family or medical information during initial account creation unless the approved onboarding flow requires it.

### 11.4 Password recovery

**Proposed route:** `/forgot-password`

Purpose: support account recovery.

Layout:
1. Heading explaining recovery.
2. Email field.
3. Send recovery instructions action.
4. Confirmation state.
5. Return-to-sign-in link.

Use privacy-conscious response wording that does not unnecessarily reveal whether an account exists.

### 11.5 Onboarding

**Proposed route:** `/onboarding`

Purpose: help a new user establish the initial family context and understand the product.

Layout:
1. Brief welcome.
2. Clear explanation of family-account ownership.
3. Initial profile or owner setup as required.
4. Optional initial family-member setup where approved.
5. Short introduction to document uploads.
6. Continue-to-dashboard action.

Keep onboarding short. Avoid forcing users to upload a medical document before they can explore the application.

Explain the difference between managing a family account and granting a person access to it.

### 11.6 Overview dashboard

**Proposed route:** `/app`

Purpose: provide a useful starting point for the authenticated user.

Layout:
1. Page title: "Overview."
2. Current family context.
3. Primary action: "Upload document."
4. Recent records section.
5. Family overview.
6. Recent processing activity or relevant updates, if available.
7. Helpful entry point to the AI assistant.

Possible cards:
- Recent records.
- Family members.
- Documents awaiting processing.
- Recently viewed records, if supported.

Rules:
- Do not invent health scores or risk metrics.
- Do not fill the dashboard with decorative statistics.
- Show only data the current user is authorized to access.
- Use a helpful empty state for new accounts.
- Keep record counts accurate and clearly scoped.

### 11.7 Medical records list

**Proposed route:** `/app/records`

Purpose: browse, organize, and locate saved medical documents.

Layout:
1. Page title and concise description.
2. Primary upload action.
3. Search field.
4. Filters for supported categories, family members, and dates.
5. Record list or responsive card grid.
6. Pagination or incremental loading when needed.

Each record item should show:
- Title.
- Type.
- Family member.
- Document date.
- Processing status.
- Brief summary when available.

Use a table only when comparison across metadata columns is helpful. A responsive list or card layout is preferable on mobile.

### 11.8 Upload document

**Proposed route:** `/app/records/upload`

Purpose: upload and classify a medical document.

Layout:
1. Page title: "Upload document."
2. Short explanation of supported uploads.
3. File-selection area.
4. Selected-file information.
5. Family-member selector.
6. Optional metadata fields.
7. Privacy or processing explanation.
8. Primary upload action.
9. Upload and processing progress states.

The destination family member must be visible before the upload is finalized.

After upload:
- Confirm the file was saved.
- Show processing status separately.
- Provide a link to the record when available.
- Preserve the original if AI analysis fails.

### 11.9 Record detail

**Proposed route:** `/app/records/[recordId]`

Purpose: inspect a saved medical record and its associated information.

Layout:
1. Breadcrumb or back-to-records link.
2. Document title.
3. Family member and document metadata.
4. Primary document actions.
5. Original document viewer.
6. AI-generated explanation panel.
7. Source references and limitations where available.
8. Historical comparison section when supported.
9. Sharing controls when authorized.

Desktop:
- Use a two-column layout where the document and explanation can both remain readable.
- Keep the original report visually distinct.
- Use a narrow reading width for longer explanations.

Mobile:
- Stack the content.
- Provide an obvious way to switch between document and explanation.
- Keep important actions accessible.

If a record has no AI explanation, show an appropriate unavailable, pending, or failed state rather than an empty panel.

### 11.10 Document edit or metadata panel

**Proposed route:** A focused panel or nested route associated with the record detail page.

Purpose: update supported metadata.

Fields may include:
- Title.
- Family-member assignment, if permitted.
- Document category.
- Document date.
- Supporting description.

Rules:
- Make clear which values are user-editable.
- Preserve the original source document.
- Confirm before changing ownership or other consequential metadata.
- Clearly indicate save success or failure.

### 11.11 AI health assistant

**Proposed route:** `/app/assistant`

Purpose: ask health-information questions and receive grounded explanations.

Layout:
1. Page title: "AI health assistant."
2. Concise description of capabilities and limitations.
3. Conversation area.
4. Relevant document-selection or attachment control.
5. Message composer.
6. Source references where available.
7. Safety and uncertainty notices where relevant.

The page should not feel like a generic chatbot with an oversized empty message canvas.

Use a comfortable reading width, structured responses, and clear separation between generated explanations and cited sources.

If the assistant is working with a specific family member's records, make that scope visible where necessary.

### 11.12 Search results

**Proposed route:** `/app/search`, or search integrated into `/app/records`.

Purpose: locate records using supported search and filters.

Layout:
1. Search input.
2. Active filter indicators.
3. Result count where available.
4. Record results.
5. Empty state or error state.

The search interface must not imply that full-text medical document search exists unless the backend actually supports it.

Preserve search context when navigating to a result and returning.

### 11.13 Family overview

**Proposed route:** `/app/family`

Purpose: manage the family members associated with the account.

Layout:
1. Page title: "Family."
2. Explanation of family-account management.
3. Add or manage family member action.
4. Family member list or cards.
5. Relevant access-management information.

Each member item should show only information appropriate to the viewer's permissions.

Do not imply that all listed members can sign in or view records by default.

### 11.14 Family member detail

**Proposed route:** `/app/family/[memberId]`

Purpose: review a family member's profile context and associated medical records.

Layout:
1. Member identity and available profile details.
2. Clear navigation back to the family overview.
3. Member-specific records.
4. Member-scoped search or filters where supported.
5. Authorized management actions.

Keep the selected member visible throughout the page.

Before destructive or access-related actions, explain the consequences.

### 11.15 Family member add or edit flow

**Proposed route:** A focused dialog or page associated with the family section.

Purpose: add or update a family member's supported profile information.

Layout:
1. Clear task title.
2. Minimal required fields.
3. Explanation of the relationship between family membership and access permissions.
4. Save and cancel actions.
5. Validation and confirmation states.

Do not create an independent login or grant record access implicitly unless that is an explicit product rule.

The permission model must be defined before implementing invitation or delegated-access flows.

### 11.16 Share-link creation

**Proposed route:** A focused dialog or page launched from an authorized record.

Purpose: create a time-limited, unlisted share link for selected content.

Layout:
1. Heading: "Share medical records."
2. Selected family member and source context.
3. Content-selection section.
4. Expiration-duration selector.
5. Short explanation of link-based access.
6. Review summary.
7. Primary create-link action.

The user must know exactly which records are included before confirming.

Display the chosen expiry clearly, including a precise date/time when useful.

Do not create a link on selection alone. Creation must follow an explicit confirmation action.

### 11.17 Share-link management

**Proposed route:** A share-management section associated with records or account settings.

Purpose: review and revoke existing links.

Layout:
1. Page title: "Shared links" or an equivalent clear label.
2. List of available share links.
3. Link status.
4. Expiry.
5. Content included.
6. Copy or inspect action where appropriate.
7. Revoke action.

Rules:
- Clearly distinguish active, expired, and revoked links.
- Avoid showing protected document content in the management list.
- Confirm revocation.
- Update the interface only when the operation's result is confirmed.

### 11.18 Public share-link viewer

**Proposed route:** `/share/[token]`

Purpose: allow an authorized recipient to access the selected content through an unlisted, expiring link.

This is a sensitive public-facing route and must not use the authenticated application's normal family dashboard.

Layout:
1. Minimal MedLab identity.
2. Clear shared-content heading.
3. Limited document metadata appropriate to the link's scope.
4. Selected document viewer or download action.
5. Link expiry or availability information.
6. Minimal privacy and support guidance.

Security requirements:
- Render only content explicitly included in the link.
- Never expose the owner's dashboard or other family records.
- Do not expose account-management controls.
- Treat the token as a secret.
- Do not place sensitive details in page titles or unnecessary browser metadata.
- Avoid third-party embeds or analytics that could receive the token or medical content.
- Prevent search-engine indexing of share pages.
- Avoid caching sensitive content in shared or public caches.
- Ensure expired or revoked links stop granting access.
- Use a neutral unavailable state for invalid, expired, or revoked links without disclosing unnecessary account information.

The backend must enforce access and expiry. Hiding content in the UI is not a security control.

### 11.19 Account settings

**Proposed route:** `/app/settings`

Purpose: provide access to personal account preferences and management.

Layout:
1. Settings heading.
2. Clearly labeled sections.
3. Profile information.
4. Account preferences.
5. Security settings.
6. Family-management entry points where appropriate.
7. Sign-out action.

Keep destructive account actions separated from routine preferences.

### 11.20 Profile settings

**Proposed route:** `/app/settings/profile`

Purpose: update supported profile information.

Layout:
1. Profile heading.
2. Editable fields.
3. Save action.
4. Validation and success feedback.

Do not require unnecessary personal details for the core medical-records workflow.

### 11.21 Security settings

**Proposed route:** `/app/settings/security`

Purpose: manage supported account-security options.

Layout:
1. Security overview.
2. Authentication-related options supported by the chosen identity provider.
3. Session or sign-in controls if available.
4. Password-management entry point where applicable.
5. Clear explanations of consequential changes.

Do not display security controls that are not actually implemented.

### 11.22 Privacy and data management

**Proposed route:** `/app/settings/privacy`

Purpose: explain data handling and provide available data-management actions.

Layout:
1. Privacy explanation.
2. Data and file handling information.
3. Available data export or deletion options when implemented.
4. Recovery or retention explanation where applicable.
5. Links to relevant privacy documentation.

The interface must match the actual backend retention policy. Do not promise a recovery period, permanent deletion, or export capability until it is implemented and verified.

### 11.23 Notifications and processing activity

**Proposed route:** `/app/notifications` only if a notifications feature is approved.

Purpose: show relevant application events without unnecessarily exposing sensitive details.

Possible events:
- Upload completed.
- Processing failed.
- Important account-security event.
- Share-link status change.

Use minimal wording. Do not display detailed lab results or diagnoses in notification previews.

If notifications are not included in the MVP, omit this page rather than building an empty feature.

### 11.24 Not-found page

**Proposed route:** Application-wide 404 state.

Purpose: handle missing or unavailable pages and records.

Layout:
1. Neutral heading: "This page isn't available."
2. Brief explanation.
3. Safe navigation action.

Do not reveal whether a sensitive record exists when the user lacks permission to access it.

### 11.25 Global application error state

Purpose: recover from unexpected application failures.

Layout:
1. Calm error heading.
2. Short explanation.
3. Retry action when appropriate.
4. Return-to-overview action.

Never show internal stack traces or sensitive backend details.

Preserve safe navigation context without exposing medical content.

---

## 12. Cross-Page Consistency Rules

The following rules apply across the entire application.

### 12.1 Medical record identity

Where applicable, a record should consistently show:
- Title.
- Family member.
- Document date.
- Upload date.
- Document type.
- Processing state.
- Original file access.
- AI explanation state.

Do not use one date label to represent multiple different timestamps.

### 12.2 AI content provenance

AI-generated content must be identifiable as AI-generated.

Where available, show:
- The record used as context.
- Relevant source references.
- The date of the original document.
- The limitations of the explanation.
- Whether the content is incomplete or uncertain.

Do not invent sources or imply that an external source was consulted when it was not.

### 12.3 Historical comparison

Only show comparisons when the underlying observations are sufficiently compatible.

Consider:
- Measurement name.
- Units.
- Date.
- Reference range.
- Source.
- Relevant context.

If values are not comparable, explain the limitation rather than forcing them into one chart.

### 12.4 Privacy consistency

The same access rules must apply across:
- Record lists.
- Search results.
- Document viewers.
- AI conversations.
- Historical comparisons.
- Share-link views.
- Family pages.
- Download actions.

A hidden navigation item is not an authorization mechanism.

### 12.5 Destructive operations

For deletion, revocation, and consequential permission changes:
- Explain what will happen.
- State whether the operation is recoverable when known.
- Require explicit confirmation where appropriate.
- Show the resulting status only after server confirmation.
- Provide an appropriate recovery or support path if the operation fails.

### 12.6 No fabricated data

Never use fabricated medical results, family records, diagnoses, or historical measurements in a production interface.

Demonstration data, if used during development, must be clearly labeled as fictional and must not be mixed with real user records.

---

## 13. Design Acceptance Criteria

The design is ready for implementation review when all of the following are satisfied.

### Visual system
- [ ] Calm Clinical Blue palette is applied consistently.
- [ ] Light-only theme is maintained.
- [ ] Typography hierarchy is consistent.
- [ ] Spacing and card treatments are standardized.
- [ ] Semantic status colors are used appropriately.
- [ ] Visual decoration does not compete with medical content.

### Navigation
- [ ] Desktop sidebar is defined.
- [ ] Mobile bottom navigation is defined.
- [ ] Current family-member context is clear.
- [ ] Deep routes provide a safe return path.
- [ ] Navigation does not obscure essential content.

### Medical records
- [ ] Upload and processing states are distinct.
- [ ] Original documents remain visually distinct from AI explanations.
- [ ] Document metadata is clearly labeled.
- [ ] Historical comparisons explain relevant limitations.
- [ ] Empty, loading, failed, and success states are defined.

### AI experience
- [ ] AI-generated content is explicitly labeled.
- [ ] Source references appear when available.
- [ ] Uncertainty and missing-context states are defined.
- [ ] Failed AI processing does not imply file loss.
- [ ] No unsupported diagnostic or clinical-certainty claims are introduced.

### Family and sharing
- [ ] Family ownership and access are not conflated.
- [ ] Selected sharing scope is visible before link creation.
- [ ] Expiry is visible and understandable.
- [ ] Revocation is confirmed by the backend.
- [ ] Public share pages expose only explicitly shared content.

### Security and privacy
- [ ] Permission-denied and expired-link states are defined.
- [ ] Sensitive details are excluded from unnecessary notifications.
- [ ] No secret tokens or private storage URLs are exposed unnecessarily.
- [ ] Destructive operations provide clear confirmation.
- [ ] Design assumptions match the implemented retention and deletion policies.

### Accessibility and responsiveness
- [ ] WCAG 2.2 AA is the target.
- [ ] Focus indicators are visible.
- [ ] Forms have persistent labels.
- [ ] Text and interface contrast are checked.
- [ ] Reduced-motion preferences are respected.
- [ ] Mobile layouts remain usable without horizontal page scrolling.

---

## 14. Assumptions and Decisions Requiring Approval

The following items must be resolved before or during implementation planning. They should not be silently invented by the design or implementation agent.

### Product and permission model
1. Confirm whether family members are profile-only entries, independent accounts, or both.
2. Define the exact permissions for the family owner and any invited members.
3. Confirm whether members can upload, edit, delete, or share records belonging to other members.
4. Confirm whether any member can access AI features independently.

### Sharing
5. Confirm whether share links provide anonymous bearer-token access or require recipient authentication.
6. Confirm which document types and metadata may be included in a link.
7. Confirm whether the owner can revoke a link at any time.
8. Confirm the supported expiry options and minimum allowed expiry.
9. Confirm whether shared documents can be downloaded, viewed only, or both.

### Privacy and retention
10. Define the recoverable-deletion window.
11. Define permanent deletion behavior for files, derived summaries, search indexes, backups, and relevant AI-processing artifacts.
12. Confirm the privacy notice and data-handling commitments for the selected AI provider and model.
13. Confirm the jurisdictions and applicable privacy obligations for the intended launch markets.
14. Define any required account export or account-deletion workflow.

### Medical AI
15. Confirm the trusted-source strategy and which external sources are allowed.
16. Define how source citations are displayed and verified.
17. Confirm which historical comparisons are supported in the MVP.
18. Define how uncertain, incomplete, or potentially urgent information is communicated.
19. Confirm whether the application may offer general health information independently of uploaded records.

### Design and implementation
20. Confirm final route names against the approved PRD.
21. Define upload size limits and supported file types.
22. Confirm the final desktop and mobile navigation items.
23. Confirm whether notifications are included in the MVP.
24. Confirm whether document editing, reprocessing, and AI-summary regeneration are supported.

These decisions affect security, behavior, and user expectations. They must be resolved with product and engineering stakeholders rather than inferred from visual design.

---

## Final Design Principle

MedLab should make medical information easier to manage without making it appear simpler or more certain than it really is.

Every page should reinforce three things:

1. **Clarity:** users understand the document, its status, and their available actions.
2. **Control:** users understand which family member and which permissions are involved.
3. **Trust:** original records, AI-generated explanations, external sources, and uncertainty remain clearly distinguishable.

The interface should feel quiet and dependable. Its quality should come from thoughtful hierarchy, readable content, consistent interaction patterns, and visible privacy controls—not decorative complexity.