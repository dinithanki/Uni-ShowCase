# UniShowcase Security Report

## Overview

A security review was performed across the backend and frontend. The confirmed vulnerabilities were fixed where code changes were possible. Dependency audits now report zero vulnerabilities in both applications.

## Findings and Fixes

### 1. Exposed Secrets

**Found in:**

- `Backend/.env`
- `frontend/.env`

**Finding:**

MongoDB credentials, JWT secrets, Google OAuth secrets, SMTP credentials, and Cloudinary credentials were present in local environment files.

**Fix:**

- Removed the local `.env` files from the workspace.
- Confirmed `.env` files are ignored by Git.
- Removed the hard-coded JWT fallback secret.
- Configuration must now be supplied through environment variables.

**Required operational action:**

Rotate every credential that was exposed. Removing a secret from the current workspace does not remove it from Git history, backups, terminal logs, or deployment systems.

---

### 2. JWT Authentication Weakness

**Found in:**

- `Backend/src/middlewares/authMiddleware.js`
- `Backend/src/utils/inviteGenerator.js`

**Finding:**

The application used a predictable fallback JWT secret when `JWT_SECRET` was missing.

**Fix:**

- Removed the fallback secret.
- Backend fails closed when `JWT_SECRET` is not configured.
- JWT signing and verification are restricted to `HS256`.

**Validation:**

- Missing-secret test passed.
- JWT generation and verification test passed.

---

### 3. Socket Authentication Bypass and User Impersonation

**Found in:**

- `Backend/src/app.js`
- `frontend/src/context/AuthContext.jsx`

**Finding:**

The frontend could send another user's ID through the Socket.io registration event.

**Fix:**

- Removed client-controlled user registration.
- Socket connections require a JWT in the handshake.
- Backend verifies the JWT and loads the user from MongoDB.
- Socket identity is derived only from the verified backend user.

**Validation:**

- Backend syntax check passed.
- Frontend production build passed.
- Client-side `register(userId)` behavior was removed.

---

### 4. Broken Access Control and Project IDOR

**Found in:**

- `Backend/src/routes/projectRoutes.js`
- `Backend/src/services/projectService.js`

**Finding:**

Users could attempt to modify projects they did not own. Recruiters could also change project visibility.

**Fix:**

- Edit and delete routes allow only Students and Admins.
- Service-level checks require the project owner or an Admin.
- Project visibility changes are restricted to Admins.
- Authorization runs before upload processing.

**Validation:**

A non-owner request must return `403 Forbidden`.

---

### 5. Private Project Information Disclosure

**Found in:**

- `Backend/src/services/projectService.js`

**Finding:**

Recruiters could retrieve private projects by providing a project ID.

**Fix:**

Private projects are now accessible only to the project owner or an Admin. Public project access remains unchanged.

**Validation:**

A Recruiter requesting another user's private project must receive `403 Forbidden`.

---

### 6. Invitation Token Misuse

**Found in:**

- `Backend/src/services/authService.js`

**Finding:**

Invitation tokens were not bound to the authenticated Google account and could potentially be reused.

**Fix:**

- Normalized Google and invitation email addresses.
- Required the invitation email to match the verified Google email.
- Required a matching database invitation with `Pending` status.
- Atomically changed the invitation status to `Completed`.
- Rejected mismatched, invalid, expired, and reused invitations.

**Validation:**

- Wrong Google account must be rejected.
- Correct Google account must be accepted.
- Reusing an invitation must be rejected.

---

### 7. Permissive CORS

**Found in:**

- `Backend/src/app.js`

**Finding:**

Every `*.vercel.app` origin was accepted.

**Fix:**

- Removed wildcard Vercel origin matching.
- Added explicit origins through `FRONTEND_URL` or comma-separated `FRONTEND_URLS`.
- Applied the same allowlist to HTTP and Socket.io.
- Preserved localhost development origins.

**Validation:**

Untrusted Vercel origins must be rejected. Explicitly configured origins must remain allowed.

---

### 8. Sensitive Error Information Disclosure

**Found in:**

- `Backend/src/app.js`
- `Backend/src/utils/errorResponse.js`
- `Backend/src/controllers/projectController.js`
- `Backend/src/controllers/authController.js`
- `Backend/src/controllers/userController.js`
- `Backend/src/controllers/interactionController.js`
- `Backend/src/controllers/notificationController.js`

**Finding:**

Internal exception messages were returned directly to clients.

**Fix:**

- Added centralized safe error handling.
- Detailed errors are logged on the server only.
- Internal and database errors return generic client messages.
- Expected business errors such as `Forbidden` remain available.

**Validation:**

- Generic 500 response test passed.
- Mongoose error masking test passed.

---

### 9. Regex DoS and Insufficient Input Validation

**Found in:**

- `Backend/src/services/projectService.js`
- `Backend/src/controllers/userController.js`
- `Backend/src/utils/inputValidation.js`

**Finding:**

Search values were used directly in MongoDB regular expressions, pagination was unbounded, and ObjectId values were not validated.

**Fix:**

- Escaped regex input.
- Limited search strings to 100 characters.
- Limited pagination to 100 results per request.
- Validated project, student, and user ObjectIds.
- Validated role filters.

**Validation:**

- Regex escaping test passed.
- Oversized pagination was rejected.
- Invalid ObjectIds were rejected.

---

### 10. Missing Security Headers and Rate Limiting

**Found in:**

- `Backend/src/app.js`
- `Backend/package.json`

**Finding:**

The backend had no security headers or request rate limiting.

**Fix:**

- Added `helmet` security headers.
- Added a general API limit of 300 requests per 15 minutes.
- Added an authentication limit of 20 requests per 15 minutes.
- Added standard rate-limit headers.
- Disabled legacy rate-limit headers.

**Validation:**

- Helmet headers were confirmed at runtime.
- Authentication requests reached `429 Too Many Requests` after the limit.

---

### 11. Unsafe File Upload Validation

**Found in:**

- `Backend/src/middlewares/uploadMiddleware.js`
- `Backend/src/utils/cloudinary.js`

**Finding:**

Uploads trusted client-provided MIME types and Cloudinary accepted automatic resource types.

**Fix:**

- Allowed only JPEG, PNG, GIF, and WebP files.
- Added file-signature validation.
- Rejected renamed non-image files.
- Forced Cloudinary uploads to `resource_type: "image"`.
- Sanitized generated filenames.

**Validation:**

Non-image files renamed with image extensions must be rejected.

---

### 12. Vulnerable Dependencies

**Found in:**

- `frontend/package-lock.json`
- `Backend/package-lock.json`

**Frontend findings:**

- `nanoid`: high severity
- `postcss`: high severity
- `react-router`: high severity
- `react-router-dom`: high severity
- `socket.io-parser`: high severity

**Backend findings:**

- `socket.io-parser`: high severity
- `body-parser`: low severity

**Fix:**

Ran `npm audit fix` in both projects and updated the lockfiles.

**Final validation:**

- Frontend audit: `0 vulnerabilities`
- Backend audit: `0 vulnerabilities`
- Frontend production build passed.
- Backend syntax checks passed.

## Findings Not Confirmed

### SQL Injection

Not found. The application uses MongoDB/Mongoose and no SQL query construction was identified.

### Direct XSS Sink

No confirmed React XSS sink was found. React JSX escapes rendered values by default. User-controlled values are inserted into the HTML email template in `Backend/src/utils/mailer.js`; HTML escaping should be added as additional hardening.

### Cookie-Based CSRF

No direct cookie-based CSRF vulnerability was confirmed. The application uses bearer tokens in request headers. CORS is now restricted to explicit origins.

### Vendor and Organizer Reservations

No Vendor, Organizer, reservation model, or reservation routes were found in this repository. Those authorization rules cannot be verified here.

## Recommended Commit Messages

Use separate commits if the changes are reviewed independently:

```text
security: remove exposed credentials and hard-coded JWT fallback
```

```text
security: authenticate socket connections with verified JWT identity
```

```text
security: enforce project ownership and private-project access control
```

```text
security: bind invitation tokens to verified email and prevent reuse
```

```text
security: restrict CORS origins and add security middleware
```

```text
security: validate uploads and sanitize Cloudinary resource types
```

```text
security: harden request validation and error responses
```

```text
security: remediate npm dependency vulnerabilities
```

Or use one combined commit:

```text
security: remediate OWASP vulnerabilities and dependency risks
```

## Final Checks Performed

- Backend JavaScript syntax checks passed.
- Frontend production build passed.
- Backend dependency audit passed with zero vulnerabilities.
- Frontend dependency audit passed with zero vulnerabilities.
- JWT security tests passed.
- Socket authentication checks passed.
- CORS runtime test passed.
- Security-header runtime test passed.
- Rate-limit runtime test passed.
- Input validation tests passed.
- Error disclosure tests passed.
- Upload validation checks passed.
- `git diff --check` passed.

## Important Deployment Actions

Before deploying:

1. Rotate MongoDB credentials.
2. Rotate the JWT secret and invalidate existing tokens if required.
3. Rotate Google OAuth credentials if the client secret was exposed.
4. Rotate SMTP credentials.
5. Rotate Cloudinary credentials.
6. Configure `JWT_SECRET` and explicit `FRONTEND_URL` values in the deployment environment.
7. Review Git history and remove secrets from any publicly accessible repository history.
