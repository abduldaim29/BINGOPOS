# CRM & Customer Segments

Back to the documentation index: `docs/README.md`

## Purpose

Customer segmentation, campaign automation, and reminders to improve engagement and collection.

## Current Features

### Customer Segments
- Manual: admin adds customer to segment
- Auto: segment based on rules (High Spender, Frequent Buyer, Inactive, Credit Customer, Overdue)
- Rule config: spending threshold, frequency, last purchase, receivables status
- Segment membership track: source (manual/auto), matched_at

### Campaigns
- Create campaign with audience filter (segment)
- Process campaign: generate log per customer
- Campaign types: reminder, promo, follow-up
- Share invoice via WhatsApp link
- Direct WhatsApp delivery if WhatsApp Gateway is active and device is connected
- Cancel campaign if needed

### Reminders
- Due-soon receivable reminder (3 days before due date)
- Overdue receivable reminder
- Repeat order reminder for customers who haven't purchased in a long time

## Database

- `customer_segments`               — master segment
- `customer_segment_memberships`    — pivot customer ↔ segment
- `customer_campaigns`              — campaign definition
- `customer_campaign_logs`          — per-customer campaign tracking
- `crm_reminders`                   — reminder definitions

## Pages and Routes

| Route | Function |
|-------|----------|
| `customer-segments.*` | CRUD segments |
| `crm-campaigns.*` | CRUD campaigns + process/cancel |
| `crm-reminders.index` | List reminders |

## Permission

| Permission | For what |
|-----------|-----------|
| `customer-segments-access` | View segments |
| `customer-segments-create` | Create segment |
| `customer-segments-update` | Edit segment |
| `customer-segments-delete` | Delete segment |
| `crm-campaigns-access` | View campaigns |
| `crm-campaigns-create` | Create campaign |
| `crm-campaigns-update` | Edit, process, cancel campaign |
| `crm-campaigns-delete` | Delete campaign |
| `crm-reminders-access` | View reminders |

## Campaign Flow

1. Create segment (manual/auto)
2. Create campaign → select audience filter
3. Process campaign → system generate log per customer
4. Choose delivery: direct WhatsApp, link `wa.me`, or manual follow-up
5. Process campaign sends directly if service is available; if not, logs can be handled manually
6. Mark sent/skip per log according to delivery results
