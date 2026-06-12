# LLC World Backend

Spring Boot REST API for LLC World's private institutional LMS.

## Requirements

- Java 17 or newer
- PostgreSQL
- Database named `coding_seekho_lms`

pgAdmin is the administration interface; PostgreSQL is the actual database.

## Run locally

Configure the database and security values through environment variables:

```text
DB_URL=jdbc:postgresql://localhost:5432/coding_seekho_lms
DB_USERNAME=your-local-database-user
DB_PASSWORD=your-local-database-password
JWT_SECRET=replace-with-a-long-random-secret
BOOTSTRAP_ADMIN_EMAIL=your-admin-email
BOOTSTRAP_ADMIN_PASSWORD=your-unique-12-plus-character-password
```

The full configuration reference is documented in `.env.example`.

```powershell
.\mvnw.cmd spring-boot:run
```

If the generated Windows Maven wrapper fails on your PowerShell version, run Maven directly or regenerate the wrapper.

## Main product behavior

- JWT authentication with BCrypt passwords
- Admin, teacher and student roles
- Multiple batch enrollments per user
- Admin-controlled fee and access status
- Batch-only group chat
- Private LLC support chat
- Google Meet and Zoom link publishing
- Join-based automatic attendance capture
- Assignment submission, file upload, grading and feedback
- In-app and optional SMTP email notifications
- Email OTP password reset

Google Meet and Zoom do not permit an unauthenticated server to create rooms. Teachers create the free provider room using the link in LLC World, paste its URL, and LLC handles scheduling, distribution and attendance. Direct provider API creation can be added later using institution-owned Google/Zoom OAuth credentials.

## Email setup

For the easiest classroom explanation, use a Gmail account with an App Password:

```text
MAIL_ENABLED=true
MAIL_USERNAME=your-account@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_FROM=your-account@gmail.com
```

When email is disabled, password-reset OTPs are shown in the local UI for development.

## Tests

Tests use an isolated H2 database and never modify PostgreSQL:

```powershell
.\mvnw.cmd test
```
