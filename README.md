# CRM Backend API

A REST API for a basic Customer Relationship Management (CRM) system. Employees/counselors can register and log in, view public student enquiries, claim enquiries, and view the enquiries assigned to them.

## Tech stack

- Node.js with ES Modules (`"type": "module"`)
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- Helmet and CORS middleware

## Features

- Employee registration and login
- Password hashing with bcryptjs
- JWT-protected counselor endpoints
- Public enquiry form that does not require authentication
- Public list of unclaimed enquiries
- Atomic lead claiming to prevent two employees from claiming the same enquiry
- Private list of enquiries claimed by the logged-in employee
- Pagination on enquiry list endpoints

## Project structure

```text
crm-backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── enquiryController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Enquiry.js
│   └── routes/
│       ├── authRoutes.js
│       └── enquiryRoutes.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Prerequisites

- Node.js 18 or later (Node.js 20 LTS is recommended)
- npm
- MongoDB running locally, or a MongoDB Atlas connection string
- Postman (for API testing)

## Installation and setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ujjwalpatil07/CRM_Backend-Assignment.git

   cd crm-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   The project uses these runtime packages:

   ```bash
   npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet
   npm install --save-dev nodemon
   ```

Ensure `package.json` contains the ES Module setting and scripts used by this project:

```json
{
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

3. Create your local environment file by copying the example:

   **Windows PowerShell**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux**

   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB URI and a strong, private JWT secret:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/crm_db
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=1d
   ```

   For MongoDB Atlas, replace the local URI with your Atlas connection string. Never commit `.env` or share its secrets.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Or start it in production mode:

   ```bash
   npm start
   ```

6. Check the health endpoint:

   ```http
   GET http://localhost:5000/
   ```

   Expected response:

   ```json
   {
     "success": true,
     "message": "CRM REST API is running."
   }
   ```

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/crm_db` |
| `JWT_SECRET` | Secret used to sign and verify JWTs | Use a long random value |
| `JWT_EXPIRES_IN` | JWT lifetime | `1d` |

## API reference

Base URL: `http://localhost:5000`

Protected endpoints require this header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register an employee/counselor |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |

**Register request**

```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "SecurePass123"
}
```

**Login request**

```json
{
  "email": "rahul@example.com",
  "password": "SecurePass123"
}
```

Both successful operations return an employee object and a JWT. Passwords are hashed before being stored and are not returned in API responses.

### Enquiries

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/enquiries` | No | Submit a public enquiry |
| `GET` | `/api/enquiries/public` | Yes | Fetch unclaimed enquiries |
| `POST` | `/api/enquiries/:id/claim` | Yes | Claim an unclaimed enquiry |
| `GET` | `/api/enquiries/my` | Yes | Fetch enquiries claimed by the logged-in employee |

**Submit enquiry request**

```json
{
  "name": "Amit Patil",
  "email": "amit@example.com",
  "phone": "9876543210",
  "courseInterest": "Full Stack Development",
  "message": "Interested in the next batch"
}
```

`name`, `email`, and `courseInterest` are required. `phone` and `message` are optional. A new enquiry is created with `claimedBy: null` and `claimedAt: null`.

**Pagination**

Both enquiry GET endpoints support `page` and `limit` query parameters:

```http
GET /api/enquiries/public?page=1&limit=20
GET /api/enquiries/my?page=1&limit=20
```

The API defaults to page `1` and limit `20`; the maximum limit is `100`.

## Lead ownership and concurrency

An enquiry is public while `claimedBy` is `null`. When a counselor claims it, the API sets `claimedBy` to the authenticated employee's MongoDB ObjectId and sets `claimedAt` to the current date/time.

The claim endpoint uses a conditional atomic MongoDB update:

```javascript
await Enquiry.findOneAndUpdate(
  { _id: id, claimedBy: null },
  {
    $set: {
      claimedBy: req.user.id,
      claimedAt: new Date()
    }
  },
  { new: true, runValidators: true }
);
```

The condition and update are performed atomically for the document. If two counselors race to claim the same enquiry, at most one request can change the document from unclaimed to claimed. The other request receives `409 Conflict`.

## Typical response status codes

| Status | Meaning |
|---|---|
| `200` | Request succeeded |
| `201` | Employee or enquiry created |
| `400` | Invalid request data or ID format |
| `401` | Missing, invalid, or expired JWT; invalid credentials |
| `404` | Route or enquiry not found |
| `409` | Duplicate employee email or enquiry already claimed |
| `500` | Unexpected server error |

## Postman testing

The project pack includes:

- `CRM_Backend_Postman_Collection.json`
- `CRM_Local.postman_environment.json`

In Postman:

1. Import both JSON files.
2. Select the `CRM Local` environment.
3. Confirm `baseUrl` is `http://localhost:5000`.
4. Start the API and MongoDB.
5. Run the collection in order. The registration requests generate unique test emails for each run, and test scripts save employee JWTs and enquiry IDs into environment variables.
6. Review the test results in the Postman Collection Runner.

The collection includes positive and negative checks for authentication, registration, login, enquiry submission, public/private enquiry visibility, claiming, ownership isolation, and pagination. Simultaneous claim requests should also be tested using two concurrent requests; see `INTERVIEW_PREP.md` for the expected invariant.

## GitHub submission checklist

- [ ] Confirm `.env` is listed in `.gitignore`.
- [ ] Commit `.env.example`, not `.env`.
- [ ] Remove debugging logs and unused files.
- [ ] Import and run the Postman collection successfully.
- [ ] Add this README to the repository.
- [ ] Push the project to GitHub.
- [ ] Include the repository URL when submitting the assignment.

See `GITHUB_SETUP.md` for the Git commands.

## Scope and production considerations

This implementation covers the assignment's stated API requirements. Before using it in a production CRM, consider:

- Restrict employee registration to an administrator or invitation flow instead of leaving it publicly accessible.
- Restrict CORS to approved frontend origins.
- Add rate limiting and anti-spam protection to public enquiry submission and login.
- Add request-schema validation (for example, Zod or Joi) and consistent validation for phone numbers and field lengths.
- Consider duplicate-enquiry detection and a lead audit/history log.
- Add automated integration tests to CI and operational logging/monitoring.
- Avoid returning unnecessary personal data from enquiry endpoints and define appropriate access/retention policies.

## Author

**Name:** `Ujjwal Patil`  
**Role:** Node.js Developer Assignment
