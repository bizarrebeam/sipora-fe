# SIPORA

SIPORA (Sistem Pelaporan dan Aspirasi) is a school reporting web application for SMP Budi Mulia Desa Putera. It turns stakeholder needs into confidential case management for bullying reports, facility issues, counseling requests, aspirations, and teacher evaluations.

Role-based access rules protect reporter identities and let counselors and school administrators handle submitted cases.

## Application features

- Case forms and status tracking for bullying and facility reports.
- Counseling requests, student aspirations, and teacher evaluations.
- Access rules for reporters, teachers, counselors, and school administrators.
- REST APIs (web endpoints) for case submission, review, status updates, and responses.
- An audit trail that records case creation, edits, status changes, and soft deletes. Each entry stores its time, user identifier, and previous values.

A soft delete hides a record while keeping its history. The audit trail supports case review throughout the reporting process.

## Application structure

SIPORA has two web applications. The frontend provides pages for students and staff. The backend provides the API and stores application data in PostgreSQL.

| Component | Repository | Technology | Deployment |
| --- | --- | --- | --- |
| Frontend | [sipora-fe](https://github.com/bizarrebeam/sipora-fe) | Vue 3, TypeScript, Vite, and Pinia | [Open SIPORA](https://sipora-fe.vercel.app) |
| Backend | [sipora-be](https://github.com/bizarrebeam/sipora-be) | Python, Django REST Framework, and PostgreSQL | Railway deployment history |

The frontend calls the backend API. Each repository can deploy on its own. The frontend is available at [sipora-fe.vercel.app](https://sipora-fe.vercel.app). The saved Railway backend URL is [web-production-150eb.up.railway.app](https://web-production-150eb.up.railway.app). It returned 404 for the tested API paths on 7 November 2026. GitHub keeps deployment records for the [frontend](https://github.com/bizarrebeam/sipora-fe/deployments) and [backend](https://github.com/bizarrebeam/sipora-be/deployments).

The frontend provides the student and staff web interface. It uses Vue 3, TypeScript, Vite, and Pinia.

## Local setup

You need Node.js 20.19 or newer and npm.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the local backend API address.
3. Run `npm ci`.
4. Run `npm run dev`.

The frontend is available on [Vercel](https://sipora-fe.vercel.app). The saved backend URL is [web-production-150eb.up.railway.app](https://web-production-150eb.up.railway.app). It returned 404 for the tested API paths on 7 November 2026. GitHub keeps the frontend deployment records on the [deployments page](https://github.com/bizarrebeam/sipora-fe/deployments).


## Course and contributors

Developed to fulfill the Proyek Pengembangan Sistem Informasi course at Universitas Indonesia in 2026.

| Name | NPM | Affiliation |
| --- | --- | --- |
| Adelya Amanda | 2306165616 | Information Systems, Universitas Indonesia |
| Joanne Kenisa Adelina Limena | 2306275626 | Information Systems, Universitas Indonesia |
| Rizki Hidayatul Laeli | 2306245491 | Information Systems, Universitas Indonesia |
| Kadek Savitri | 2306203236 | Information Systems, Universitas Indonesia |
| Theresia Tarianingsih | 2306208810 | Information Systems, Universitas Indonesia |
## Project documents

- [Product requirements document](https://github.com/bizarrebeam/sipora-be/blob/main/docs/PRD_SIPORA.pdf)
- [Pitch deck](https://github.com/bizarrebeam/sipora-be/blob/main/docs/SIPORA_Pitch_Deck.pdf)
