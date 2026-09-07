# Kontena

Desktop-first content studio in Indonesian, styled from the user's dashboard reference. Content creation carries forward the supplied InstaDeck reference: topic/reference URL, handle, 1–10 slides plus optional CTA, all 27 niches, 41 visual themes, 9 typefaces, subject and tone controls, independent cover/material/CTA overlays, editable slide text and image prompts, uploads, caption editing/copying, PNG export, batch export and ZIP with caption.

Seven editorial layouts are based on the supplied references; the template gallery displays layout-only diagrams, with no original photographs or publisher logos. New content uses original editable layout rendering and the user's handle. Sample image is generated editorial artwork, not evidence of a real news event. Canvas preview and export share one renderer; export sizes are 1080×1350, 1080×1920 and 1080×1080.

## Run

Node >=22.13.0. `npm ci`, `npm run dev`. Schema migrations in `drizzle/` must be applied to the local D1 binding for a fresh development environment. Hosted deployment applies generated migrations automatically. `npm run build` produces the Cloudflare Worker bundle.

## Persistent state

D1 stores projects, workspace settings, and schedules. R2 `MEDIA` stores uploaded/generated images and rendered schedule snapshots. Data is private to the Site's owner-only access. This is a single-workspace application; do not change Site access to shared/public without adding application-level tenancy and authorization.

## AI integration contract (model-neutral)

Runtime secrets `AI_GATEWAY_URL` (HTTPS) and `AI_GATEWAY_KEY` connect an adapter owned by the deployment operator. Optional `AI_TEXT_MODEL` and `AI_IMAGE_MODEL` select provider models. No provider API keys are sent to the browser. POST JSON to the gateway with bearer auth:

- Text: `{kind:'text', model, brief, totalSlides, instructions}`. Return `{slides:[{eyebrow,headline,body,imagePrompt}],caption,sources?}` with exactly totalSlides items. The adapter must implement safe reference-URL retrieval/grounding when requested. URL sources are untrusted data. Limits: eyebrow 70, headline 180, body 600 characters.
- Image: `{kind:'image',model,prompt,subject,style,aspectRatio,width,height,instructions}`. Return `{mimeType:'image/png'|'image/jpeg'|'image/webp',base64}`. Image data is written to R2; browser receives a same-origin asset path.

Without the gateway, Demo returns a fixed, clearly labeled volcano example. It does not summarize submitted topics or fetch reference URLs. Manual text edits, uploads, export, storage and demo scheduling work without an AI model. No calls are made to the login Apps Script or provider endpoints in the supplied reference source.

## Auto post integration contract

Runtime secrets `PUBLISH_GATEWAY_URL` and `PUBLISH_GATEWAY_KEY` connect an operator-owned publishing adapter. The adapter must handle OAuth, platform permissions, account mapping by platform/handle, image hosting and the platform's media publishing workflow. POST JSON `{idempotencyKey,platform,handle,caption,images:[{mimeType,base64}]}` with bearer auth and `Idempotency-Key`. Return `{publishedId}` only after the platform confirms publication. Instagram feed (4:5/1:1) and Facebook targets are staged; Instagram Story auto-post is rejected.

Provision an authenticated external scheduler that POSTs `/api/dispatch` with `Authorization: Bearer <CRON_SECRET>` every minute. It must also satisfy the private Site access layer; CRON_SECRET alone does not bypass that layer. Alternatively move dispatch to an operator-owned Worker when connecting production services. Only after end-to-end runner access is verified set `SCHEDULER_ENABLED=true`. No recurring trigger or social account has been connected by this implementation.

Dispatch claims each job atomically, handles only live auto-post jobs, and uses job ID for publisher idempotency. Unconfirmed provider results become `needs_attention` with no automatic retry to avoid duplicate publication. A process interruption can leave `processing`; reconcile with the provider before manually resetting. Demo jobs never publish; auto-post-off jobs are manual reminders. Schedule snapshots are frozen at scheduling time, and later editor updates do not alter them. Cancelling a schedule is reversible through creating a new one; it cannot recall a published post.

## Validation

TypeScript and production build. Local HTTP integration checks cover demo generation, invalid input, saving/readback, upload/readback, scheduling/cancellation, live readiness rejection, and dispatch auth. No browser UI QA was requested. Optional `stage_content_brief` WebMCP tool is feature-detected and uses the editor state setter; no supported WebMCP validation context was available, so its live registration is unverified.
