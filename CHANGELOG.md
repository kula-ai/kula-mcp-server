# Changelog

## Unreleased

### Added

**Interviews** — full interview lifecycle support: `list_interviews`, `get_interview`, `create_interview`, `update_interview`, `cancel_interview`, `mark_candidate_no_show`, `undo_candidate_no_show`, `check_interviewers_availability` (async, returns poll_id), `get_interviewers_availability_result` (poll endpoint), `list_valid_organizers`, `list_conference_hosts`, `get_interview_plan`.

## 0.1.0

Initial release of the Kula MCP Server.

### Tools

**Job Posts** — `list_job_posts`, `get_job_post`, `get_application_form`

**Applications** — `list_applications`, `get_application`, `submit_application`, `upload_attachment`

**Webhooks** — `list_webhooks`, `get_webhook`, `create_webhook`, `update_webhook`, `delete_webhook`, `enable_webhook`, `disable_webhook`, `test_webhook`, `get_webhook_signing_secret`, `rotate_webhook_signing_secret`, `list_webhook_deliveries`, `get_webhook_delivery`

**Autocomplete** — `search_companies`, `list_industries`, `search_locations`, `search_schools`, `search_skills`, `search_titles`

**Organization** — `list_departments`, `list_offices`
