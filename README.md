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

## Social accounts and publishing

The sidebar separates Scheduler (auto-post readiness and new schedules), Kalender (status filters, snapshots, caption/account/date edits and explicit retry) and Akun Sosial (connect, verify, disconnect). Meta Facebook Login connects Facebook Pages and Instagram professional accounts linked to a Page. Personal Facebook profiles and Instagram personal accounts are not supported. OAuth uses a single-use state bound to the authenticated Site user and an HttpOnly browser cookie. Tokens and per-owner Meta App Secret are AES-GCM encrypted using `SOCIAL_ENCRYPTION_KEY` (32 random bytes, base64). Do not rotate this key without re-encrypting stored values or reconnecting accounts. No access token is returned to the browser.

Configure App ID and App Secret in Akun Sosial → Pengaturan integrasi. Add the displayed exact `/api/social/callback` URL to Meta Facebook Login's valid redirect URIs. Requested permissions: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish. Complete the applicable Meta app setup, review and permissions before allowing people outside the app's roles. `META_GRAPH_VERSION` defaults to v22.0 and can be configured by the operator. This is a private, single-workspace deployment; connection records and new schedules additionally check authenticated ownership. Full public multi-user tenancy is not implemented for projects/settings/assets.

The native publisher uploads unpublished Facebook photos, then publishes the Page feed. For Instagram, the private Site assets cannot be fetched by Meta. Set `MEDIA_STAGING_URL` and secret `MEDIA_STAGING_KEY` to an operator-owned temporary public image service. The service receives POST `{id,images:[{mimeType:'image/jpeg',base64}],expiresInSeconds:86400}` with bearer auth and `Idempotency-Key: <schedule-id>`, returning `{urls:[<public HTTPS JPEG URL>,...]}` in slide order. It must enforce authentication, idempotency, public URL accessibility and expiration/deletion. It never receives the Meta token. Instagram uses image/carousel containers, polls their processing state on subsequent dispatches and publishes only when ready. This integration accepts up to 10 slides and 2,200 caption characters; Instagram Story 9:16 is not implemented. Scheduling renders JPEG; studio downloads remain PNG.

Provision an external scheduler that POSTs `/api/dispatch` with `Authorization: Bearer <CRON_SECRET>` every minute. It must also satisfy the private Site access layer using the owner-approved Sites service credential; CRON_SECRET alone does not bypass that layer. Only after runner access is verified set `SCHEDULER_ENABLED=true`. No recurring trigger, staging service, real Meta app or social account has been configured by this implementation. The UI reports these missing prerequisites and prevents live scheduling.

Dispatch atomically claims one due live auto-post job per invocation and reuses staged containers between polling attempts. Confirmed results alone become Success (`published`). Errors/uncertain results become Failed / Perlu diperiksa (`needs_attention`), without automatic retries. A process interruption can leave `processing`; reconcile with the provider before manually resetting. Demo jobs never publish and remain demo schedules. Auto-post-off jobs are manual reminders. Editing a scheduled job updates its caption/account/time; images stay frozen unless the user explicitly refreshes them from saved studio content. Processing/Success jobs are read-only. A failed retry requires the user to first confirm that the original was not published, then reschedule. Editing studio content does not modify a remote published post.

## Validation

TypeScript and production build. Local HTTP integration checks also cover encrypted configuration, OAuth state/cookie/replay rejection, account ownership, schedule snapshot preservation and editing, published/processing locks, explicit failed retry and disconnect. Base checks cover demo generation, invalid input, saving/readback, upload/readback, scheduling/cancellation, live readiness rejection, and dispatch auth. No browser UI QA was requested. Optional `stage_content_brief` WebMCP tool is feature-detected and uses the editor state setter; no supported WebMCP validation context was available, so its live registration is unverified.
