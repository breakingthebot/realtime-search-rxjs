# AGENTS.md — Build Standards & Conventions

This file defines the non-negotiable standards for every project in this repository.
All code generated, reviewed, or modified must conform to these rules without exception.

---

## Architecture

- **Atomic files always.** Every file does one thing. No monolithic files under any circumstances.
- **Separation of concerns.** UI, logic, data, and configuration live in separate files and folders.
- **Modular structure.** Build for reuse. If something is used twice, it becomes its own module.
- **No dead code.** Remove unused imports, variables, functions, and commented-out blocks before committing.
- **Flat over nested** where possible. Deep nesting is a signal to refactor.

---

## File & Folder Structure

Every project follows this base structure — adapt per stack but maintain the pattern:

```
project-name/
├── src/
│   ├── components/       # UI components (frontend)
│   ├── services/         # Business logic, API calls
│   ├── models/           # Data models / schemas
│   ├── utils/            # Reusable helper functions
│   ├── config/           # App configuration (no secrets)
│   └── main entry file
├── tests/                # All test files mirror src structure
├── .env.example          # Template showing required env vars (no values)
├── .gitignore            # Always includes .env, venv, node_modules
├── README.md             # Required on every project
└── requirements.txt      # or package.json — always kept current
```

---

## Security

- **No keys, tokens, secrets, or credentials in any file. Ever.**
- All secrets live in environment variables only — loaded at runtime from the terminal environment or a `.env` file that is never committed.
- `.env` is always in `.gitignore` before the first commit. No exceptions.
- Provide `.env.example` with variable names and no values so others know what's needed.
- Never log sensitive data. Sanitize all inputs before processing or storing.
- Use HTTPS for all external API calls.
- Validate and sanitize all user inputs — assume all input is hostile.
- # ADDED: Default data posture is store nothing. Process in memory, push to the destination API, retain zero user data unless the feature requires persistence. If storage is required, store the minimum.
- # ADDED: Every README includes a "Data Handling" section stating what is collected, stored, and shared. This doubles as privacy policy source material for app submissions.

---

## Sensitive Data Redaction & Commit Hygiene
# ADDED SECTION

- Every saved API output (JSON dumps, audit reports, fixtures, field-library samples) is redacted BY DEFAULT: replace merchant IDs, record IDs, hrefs, and any PII with placeholders (MERCHANT_ID, ITEM_ID_1, CUSTOMER_ID_1). Raw output requires an explicit `--raw` flag, is written outside the repo tree, and is never committed.
- Before EVERY commit, scan the diff for token-like strings: long base64/hex runs, "Bearer ", "api_key", "token=", "secret", and 13-character Clover-style record IDs. On any hit: STOP, do not commit, and flag it for review.
- A secret that has EVER been committed, pasted into a chat, or included in any shared file is burned. Removing it from the file is not enough — flag it for rotation immediately and say so explicitly.
- Example code and docs use obviously fake placeholders only (YOUR_API_TOKEN, MERCHANT_ID). Never copy real values "temporarily" — temporary values get committed.
- Merchant IDs and record IDs are treated as sensitive even from sandbox. The habit is the product; sandbox trains what production executes.

---

## Virtual Environments

- **Always set up a virtual environment before writing a single line of Python.**
- Use `venv` as the default:
```bash
  python -m venv venv
  source venv/bin/activate        # Mac/Linux
  venv\Scripts\activate           # Windows
```
- Virtual environment folder (`venv/`) is always in `.gitignore`.
- Freeze dependencies immediately after installing:
```bash
  pip freeze > requirements.txt
```
- Update `requirements.txt` every time a new package is added.
- For Node projects, `node_modules/` is always in `.gitignore`. Use `package.json` and `package-lock.json`.
- # ADDED: Before adding any new dependency, check its last-updated date and download stats. Avoid abandoned or low-adoption packages unless there's no viable alternative.

---

## Code Quality & Best Practices

- **Clarity over cleverness.** Code is read more than it is written. Write for the next person.
- Follow the language's standard style guide:
  - Python: PEP 8
  - JavaScript/TypeScript: ESLint + Prettier defaults
  - PHP: PSR-12
- Use meaningful names. Variables, functions, and files should describe what they do.
- Functions do one thing. If a function is doing two things, split it.
- Keep functions short — if it doesn't fit on one screen, consider refactoring.
- Use constants for any value that appears more than once.
- Handle all errors explicitly. No silent failures. No bare `except` or empty `catch` blocks.
- # ADDED: External API calls retry with exponential backoff on 429/5xx (max 3 attempts). Never retry 4xx client errors.
- # ADDED: Batch operations handle partial failure explicitly — report which items succeeded, which failed and why. Never abort a batch silently, never discard completed items on a mid-batch failure.

---

## Debugging Standards

- Every module includes basic logging from the start — not added later when things break.
- Use structured logging (not just `print` or `console.log`) in any production-facing code.
- Log at appropriate levels: DEBUG, INFO, WARNING, ERROR.
- Include context in error messages — what was being attempted, what failed, what the inputs were.
- In development, errors surface loudly. In production, errors log quietly and fail gracefully.
- Write code that makes the failure point obvious — no swallowing errors and returning empty results.
- # ADDED: Log every external API call: endpoint, status code, duration. Log response bodies only on non-2xx.
- # ADDED: Never log personal data (names, emails, phones, PINs). Log the row number or record ID that failed, never the data inside it.
- # ADDED: Every user-facing error has a matching log entry with more detail than the user sees.
- # ADDED: Wrap multi-step operations with a request_id included in every related log entry, so one operation can be traced end to end.

---

## Input Validation & Batch Data
# ADDED SECTION

- Validate all external input at the boundary before any processing or write — user uploads, form fields, API responses, webhook payloads.
- For file/spreadsheet input: validate every row, collect all problems, report them together. Never fail on the first error.
- Watch for spreadsheet-specific corruption: stripped leading zeros, numbers converted to scientific notation, trailing whitespace, empty rows, shifted columns.
- Deduplicate before submission — define the uniqueness key per record type and check against both the input set and existing destination records.
- Show validated data in a preview/confirmation step before any bulk write. Errors block the upload; warnings flag but allow.
- User-facing validation messages say three things: what happened, which item or row, and what to do next.

---

## API Integration Standards
# ADDED SECTION

- OAuth 2.0 for all production apps. Hardcoded API tokens are sandbox-only and never ship.
- Environment (sandbox vs production) is set by config or env var — never a code edit. Verify no sandbox URLs or test tokens remain before any release.
- Request only the API permissions the feature actually uses. Note the justification for each in the README — app review requires it anyway.
- Prefer webhooks over polling where the platform supports them. Verify webhook signatures on receipt.
- Handle pagination on every list endpoint — never assume one page.
- Honor Retry-After headers and back off on 429s.
- Record any undocumented behavior, surprise fields, or API quirks in the field library the same day they're found.
- # ADDED: Before writing ANY API call inside a loop (create/update/delete of multiple records), check the platform docs for a bulk/batch equivalent first (search: "bulk", "batch", "multiple" — e.g. Clover's POST /v3/merchants/{mId}/bulk_items). If one exists, use it and state in the build summary which bulk endpoint was used. If none exists, say so explicitly, then implement the loop with chunking (default ≤100 records per request), backoff, and per-record accounting.
- # ADDED: Never ship a write loop without rate-limit handling. A loop that works for 5 test records and dies on 500 real ones is a bug, not a draft.
- # ADDED: After ANY change to the integration layer (auth, tokens, scopes, client code, endpoints), verify both reads AND writes against the live sandbox before marking the task done — run the capability prober or equivalent live probe. "It compiles and reads fine" is not verification; the read/write token bug shipped exactly that way.

---

## Testing Standards
# ADDED SECTION

- Every service and utility function gets at least one test before a feature is marked "done."
- Default test framework per language: `pytest` (Python), `vitest` (JS/TS frontend), `jest` (Node backend) unless the project already has one in place.
- AI writes tests automatically for new logic-bearing code (services, utils, models). UI-only components are exempt unless asked.
- Tests live in `tests/` and mirror the `src/` structure (already defined above) — don't deviate from this.
- A build is not "done" until its tests pass, not just until it runs once manually.
- # ADDED: Mock all external APIs in tests — tests never hit real endpoints.
- # ADDED: Every handled failure mode gets a test: API 4xx/5xx responses, malformed input, partial batch failure.
- # ADDED: Batch-input projects include one "chaos" fixture — a deliberately broken input file exercising every validation rule at once.

---

## Notes & Documentation

- **Every file gets a header comment** — what it does, what it connects to, date created.
- **Every function gets a docstring or JSDoc comment** — what it does, parameters, return value.
- Inline comments explain *why*, not *what*. The code shows what. Comments explain the reasoning.
- Complex logic gets a plain-English explanation above it.
- `TODO:` and `FIXME:` comments are allowed but must include what needs to be done.
- No mystery numbers — use named constants with comments explaining their origin.

Example header:
```python
# services/order_processor.py
# Handles order validation and batch preparation before ERP submission.
# Connects to: models/order.py, utils/validators.py
# Created: 2026-06-02
```

---

## README Requirements

Every repository requires a README.md containing:

```markdown
# Project Name

One sentence describing what this does.

## Stack
- Language / Framework
- Key libraries
- Database (if any)

## Setup
Step by step — assume the reader has never seen this project.

## Environment Variables
List all required variables (no values). Refer to .env.example.

## Running Locally
Exact commands to get it running.

## Deployed
Link to live version if applicable.

## Architecture Notes
Plain English explanation of what you built and why it's structured the way it is.
This is your interview answer — write it while the build is fresh.

## Notes
Anything important about architecture decisions or known limitations.
```

---

## Build Notes Log

- Every project keeps a `BUILD_NOTES.md` at the repo root, separate from `CHANGELOG.md`.
- `CHANGELOG.md` stays short and technical (Keep a Changelog style, one-line bullets per change). `BUILD_NOTES.md` is the plain-English version — written the way you'd explain the iteration to a friend or in an interview.
- At the end of every completed iteration, append a new entry to `BUILD_NOTES.md`. Never edit or delete prior entries — this is an append-only running log. Each entry includes:
  1. **Iteration name/number and date.**
  2. **Plain-English summary** of what was built this iteration.
  3. **File-by-file explanation** — what each new or changed file does and what it connects to.
  4. **Manual test steps** — exact steps to verify the pushed iteration in another terminal/environment.
  5. **Candidate next iterations** considered at this point, each with: Plain English / Benefit / Trade-off / Interview answer.
  6. **Which next iteration was chosen** — filled in once a decision is made, before the next entry is written.
- `BUILD_NOTES.md` is for your own eyes only — add it to `.gitignore` in every project (same as `AGENTS.md`) and never commit or push it.

---

## README Generation

- After each build, explain what you just built in plain conversational language — exactly how you'd tell a friend what it does.
- AI converts that explanation into a professional README.
- Never generate a README without that explanation first.
- The explanation becomes the Architecture Notes section.

---

## Branching & Commits
# ADDED SECTION

- One feature branch per project/build unless explicitly told to create more.
- Never auto-create a new branch mid-task. Stay on the current branch for all iterations of the same build.
- Only branch off for: a genuinely separate feature, a production hotfix, or an explicit user request.
- Commit messages describe what changed and why, in present tense (`Add input validation to signup form`, not `wip` or `update`).
- Squash trivial/exploratory commits before final push if the history is messy.
- Tag milestones that are demo-ready (`git tag v0.1-working`) so there's always a known-good point to roll back to, separate from regular iteration commits.
- Before committing, confirm the app actually runs and the change matches what was described — don't commit on faith.

---

## GitHub Standards

- **Every project gets its own repo.** No dumping multiple projects in one repo.
- **Repo names are descriptive and lowercase with hyphens** — `syllabus-viewer-angular` not `project1`.
- Commit messages are clear and present tense: `Add filtering to course table` not `stuff` or `fix`.
- Commit frequently — small commits with clear messages beat one giant commit.
- Never commit directly to `main` on any project intended for production. Use branches.
- `.gitignore` is the first file created before any code is written.
- Pin best repos to GitHub profile — keep pinned list to 6-8 maximum.
- Every commit should leave the project in a working state.

Standard `.gitignore` minimums:

```
AGENTS.md
BUILD_NOTES.md
.env
venv/
__pycache__/
*.pyc
node_modules/
.DS_Store
*.log
dist/
build/
```

### GitHub Repo Metadata

- AI may update GitHub repository descriptions and topics when given structured input such as JSON with `repo`, `description`, and `topics` fields.
- Match repositories by the repo name exactly as provided. Do not guess from partial names if the repo cannot be found.
- Set the description exactly as given.
- Add requested topics without removing existing topics, except to avoid duplicates during the merge.
- Confirm success or failure for each repo individually so auth issues, typos, or missing repos are obvious immediately.
- Only modify the requested metadata fields. Do not change visibility, branch protection, collaborators, homepage, or any other repo setting unless explicitly asked.

---

## Vercel CLI Deployment

- Deploy from terminal: `vercel` for preview, `vercel --prod` for production.
- Never use the dashboard for deployment — CLI keeps everything in version control.
- `vercel env add` for environment variables — never paste keys in the dashboard manually.
- `.vercelignore` mirrors `.gitignore` – same files, same rules.

---

## VS Code Setup

- Use the workspace settings file (`.vscode/settings.json`) per project for consistency.
- Recommended extensions:
  - Python (Microsoft)
  - Pylance
  - ESLint
  - Prettier
  - GitLens
  - Thunder Client (API testing without leaving VS Code)
  - dotenv (syntax highlighting for .env files)
  - Better Comments (color-coded comment types)
- Format on save enabled for all projects.
- Terminal inside VS Code uses the project's virtual environment automatically.

`.vscode/settings.json` base:
```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "python.defaultInterpreterPath": "./venv/bin/python",
  "files.exclude": {
    "**/__pycache__": true,
    "**/node_modules": true
  }
}
```

---

## User Experience

- Every app has a loading state — nothing should feel frozen.
- Every form has validation — catch errors before submission, not after.
- Every error state has a user-facing message — no blank screens, no raw error dumps.
- Empty states are handled — if there's no data, say so clearly.
- Mobile-friendly by default unless explicitly desktop-only.
- Keyboard navigation works on all interactive elements.
- Consistent spacing, typography, and color — pick a system and stick to it.

---

## Build Cadence

- Build incrementally — one component, one service, one feature at a time.
- Each piece must run and be understood before the next piece begins.
- AI explains every file it creates — what it does, what it connects to, why it was structured that way.
- No file gets created without a brief plain-English summary of its purpose.
- After each increment, confirm the build runs clean before proceeding.

---

## Communication Standards

- Before creating any file, state what you're about to create and why.
- After creating any file, summarize what it does in plain English.
- If a decision has more than one valid approach, present the options before proceeding — don't just pick one silently.
- If something already exists that covers this need, point to it instead of creating a duplicate.
- Flag anything that feels like scope creep immediately.

---

## Build Folder Bootstrap

- `Build_1` through `Build_25` under `AI-Clover` are reserved starter folders for separate builds.
- Treat each `Build_*` folder as its own project root with its own local `AGENTS.md`, `.gitignore`, `README.md`, `CHANGELOG.md`, `BUILD_NOTES.md`, and `.env.example`.
- At the start of work in any `Build_*` folder, read that folder's local `AGENTS.md` first and follow it before using the broader root guidance.
- Use `../docs/clover/` as the shared local documentation source of truth when Clover/Codex documentation is needed.
- Keep build work isolated to its own `Build_*` folder unless the user explicitly asks to update shared top-level foundations.

---

## Deployment Checklist

Before any project goes live:

- [ ] `.env` is not in the repo — confirmed in `.gitignore`
- [ ] `.env.example` exists with all required variable names
- [ ] `README.md` is complete and accurate including Architecture Notes
- [ ] All dependencies are in `requirements.txt` or `package.json`
- [ ] App runs clean from a fresh clone with no manual fixes needed
- [ ] No hardcoded URLs, ports, or environment-specific values in code
- [ ] Error states tested — what happens when the API is down, DB is empty, input is bad
- [ ] Deployed URL tested after deployment — not just local
- [ ] Repo is public and pinned if it's a portfolio project
- [ ] Vercel deployment done via CLI not dashboard
- [ ] # ADDED: All tests pass
- [ ] # ADDED: No sandbox URLs or test tokens in production code paths
- [ ] # ADDED: Failure paths are logged, not just the happy path
- [ ] # ADDED: No personal data or secrets appear in logs or error messages
- [ ] # ADDED: Batch operations report partial results (verified with the chaos fixture)
- [ ] # ADDED: No unredacted API outputs (merchant IDs, record IDs, PII) committed anywhere in the repo

---

## The One Rule That Covers Everything

*Write code you'd be comfortable showing to someone you respect.*

If you wouldn't want to explain a decision out loud, reconsider the decision.
