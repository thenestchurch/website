# Thenestchurch Data Model ERD

The models below describe the Supabase/PostgreSQL relational structure used by the application.

```mermaid
erDiagram
    ADMINS {
        int id PK
        text name
        text[] roles
        bool is_super_admin
        int department_id FK
        timestamp created_at
        timestamp updated_at
    }

    DEPARTMENTS {
        int id PK
        text name
        text slug "UNIQUE"
        text description
        text reporting_channel
        bool is_active
        timestamp created_at
        timestamp updated_at
    }

    MEMBERS {
        int id PK
        text first_name
        text middle_name
        text last_name
        text full_name
        text email "UNIQUE"
        text phone_number
        text whatsapp_number
        int department_id FK
        int preferred_department_id FK
        bool is_new_comer
        date date_of_birth
        date date_joined
        int profile_picture_id FK
        text legacy_profile_picture_url
        bool born_again
        text years_a_christian
        text previous_church
        bool wants_department
        timestamp created_at
        timestamp updated_at
    }

    SERVICES {
        int id PK
        text name
        text service_type
        date date
        text start_time
        text end_time
        text notes
        bool is_active
        timestamp created_at
        timestamp updated_at
    }

    ATTENDANCE_RECORDS {
        int id PK
        int member_id FK
        int service_id FK
        date date
        bool present
        text notes
        timestamp created_at
        timestamp updated_at
    }

    SERVICE_REPORTS {
        int id PK
        text title
        int service_id FK
        int department_id FK
        int submitted_by_admin_id FK
        text report_content
        int department_attendance
        int volunteers_count
        text attachment_url
        bool is_approved
        int approved_by_admin_id FK
        timestamp approved_at
        timestamp created_at
        timestamp updated_at
    }

    REPORT_INSTRUCTIONS {
        int id PK
        text title
        int department_id FK "UNIQUE"
        text content
        bool is_active
        timestamp created_at
        timestamp updated_at
    }

    REPORT_TEMPLATES {
        int id PK
        text title
        text content
        bool is_active
        timestamp created_at
        timestamp updated_at
    }

    REPORT_TEMPLATES_DEPARTMENTS {
        int id PK
        int report_template_id FK
        int department_id FK
    }

    BIRTHDAY_NOTIFICATION_LOGS {
        int id PK
        date run_date
        int member_id FK
        text recipient_email
        text status
        text message
        bool dry_run
        timestamp created_at
    }

    MEDIA {
        int id PK
        text alt
        text filename
        text mime_type
        text legacy_path
        timestamp created_at
        timestamp updated_at
    }

    BIRTHDAY_NOTIFICATION_SETTINGS {
        int id PK
        bool enabled
        text send_time
        text admin_notification_emails
        date last_run
        text member_email_subject
        text member_email_body
        text admin_summary_subject
        text admin_summary_body
        timestamp updated_at
    }

    DEPARTMENTS ||--o{ ADMINS : "department_id"
    DEPARTMENTS ||--o{ MEMBERS : "department_id"
    DEPARTMENTS ||--o{ MEMBERS : "preferred_department_id"
    DEPARTMENTS ||--o{ SERVICE_REPORTS : "department_id"
    DEPARTMENTS ||--o{ REPORT_INSTRUCTIONS : "department_id (unique)"
    DEPARTMENTS }o--o{ REPORT_TEMPLATES_DEPARTMENTS : "applicable in"
    REPORT_TEMPLATES ||--o{ REPORT_TEMPLATES_DEPARTMENTS : "has"
    REPORT_TEMPLATES_DEPARTMENTS }o--o{ DEPARTMENTS : "applicable to"

    MEDIA ||--o{ MEMBERS : "profilePicture"

    MEMBERS ||--o{ ATTENDANCE_RECORDS : "has"
    SERVICES ||--o{ ATTENDANCE_RECORDS : "for service"
    MEMBERS ||--o{ BIRTHDAY_NOTIFICATION_LOGS : "receives"
    SERVICES ||--o{ SERVICE_REPORTS : "has"

    ADMINS ||--o{ SERVICE_REPORTS : "submitted_by"
    ADMINS ||--o{ SERVICE_REPORTS : "approved_by"
```

## Notes

- `report-instructions.department_id` is enforced unique at the field level (`unique: true`), so each department can have at most one active instruction row.
- `service-reports` has an application-level uniqueness rule preventing duplicate records for the same `(service, department)` pair.
- `media` is used as the upload target for `members.profilePicture`.
- `birthday-notification-settings` is a singleton configuration row, modeled as its own entity for documentation.
