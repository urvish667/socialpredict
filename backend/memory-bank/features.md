# Features

This document tracks the capabilities of the Zurimarket (SocialPredict) Backend.

## Core Platform
- **HTTP API Server**: RESTful JSON API using `gorilla/mux`.
- **Database Management**: Automatic migrations and schema management via GORM.
- **Environment Configuration**: Multi-environment support using `.env` files.

## Security & Authentication
- **User Authentication**: JWT-based secure access for protected routes.
- **Input Sanitization**: Protection against XSS using `bluemonday` and input validation via `go-playground/validator`.
- **CORS Support**: Cross-Origin Resource Sharing configuration for frontend integrations.

## Application Logic
- **Seeding System**: Automatic population of initial users and homepage content upon server startup.
- **Structured Error Handling**: Centralized error responses for consistent API client integration.
- **Logging**: Request and application logging for observability.

## Admin Dashboard Backend
- **User Management**: APIs for listing users with filters, promoting/demoting roles, and banning/unbanning users.
- **Market Moderation**: Administrative list of all markets and capability to delete abusive markets.
- **Audit Logging**: Global view of all betting transactions for oversight.
- **System Health Metrics**: Extended health endpoint providing total user, market, and bet counts.
- **Economic Policy Management**: Dynamic configuration of economic parameters like market creation costs and account requirements.
- **Identity Provisioning**: Endpoint for manual user creation by admins with secure password generation.

## Planned/Ongoing Features
*(To be updated as new features are requested in future prompts)*
