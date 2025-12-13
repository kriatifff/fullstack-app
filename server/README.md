# Backend Starter Kit (Express, Prisma, PostgreSQL, TypeScript)

This project provides a comprehensive backend starter kit implemented with Express.js, Prisma ORM, and PostgreSQL, all written in TypeScript. It's designed to give you a solid foundation for building robust RESTful APIs.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Running the Application](#running-the-application)
- [Example Usage](#example-usage)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features
- **RESTful API:** Implements basic CRUD operations for all defined database models.
- **ORM Integration:** Uses Prisma for elegant and type-safe database access.
- **Database:** PostgreSQL for robust data storage.
- **Framework:** Express.js for handling HTTP requests.
- **Language:** TypeScript for type safety and better maintainability.
- **Environment Management:** Utilizes `dotenv` for managing environment variables.
- **CORS Enabled:** Allows cross-origin requests by default.

## Technologies Used
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Prisma**: Next-generation ORM
- **PostgreSQL**: Relational database
- **TypeScript**: Superset of JavaScript
- **dotenv**: For loading environment variables
- **cors**: For Cross-Origin Resource Sharing

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/download/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/download/) (running locally or accessible remotely)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd backend-starter-kit
    ```
    (Note: Replace `<repository-url>` with the actual repository URL if this was a real git project.)

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create and configure your environment file:**
    Copy the `.env.example` file to `.env` and update the `DATABASE_URL` with your PostgreSQL connection string.
    ```bash
    cp .env.example .env
    ```
    Edit `.env`:
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"
    PORT=3000
    ```
    _Replace `user`, `password`, `localhost:5432`, and `mydatabase` with your actual PostgreSQL credentials and database name._

4.  **Set up the database and generate Prisma client:**
    Run Prisma migrations to create tables in your database and generate the Prisma client.
    ```bash
    npx prisma migrate dev --name init
    # When prompted, accept the default migration name or provide one.
    # This command will create a migration file, apply it to your database, and generate the Prisma client.
    ```
    If you only need to generate the client after schema changes without applying migrations:
    ```bash
    npm run prisma:generate
    ```

## Database Schema

The database schema is managed by Prisma and defines the following models:

-   **Role**: Defines different roles for team members.
-   **Person**: Stores information about individual team members, linked to a Role.
-   **Project**: Stores details about projects.
-   **Contract**: Records financial contracts associated with projects.
-   **ProjectWriteOff**: Records planned and actual write-off hours for project members per month.
-   **Assignment**: Defines weekly workload assignments for people on projects.
-   **Vacation**: Records vacation periods for team members.
-   **ProjectMember**: Links people to projects they are members of (many-to-many relationship).
-   **ProjectMemberRate**: Stores custom hourly rates for specific people on specific projects.

## API Endpoints

All API endpoints are prefixed with `/api`.

| Model           | Path                       | HTTP Method | Description                                  |
| :-------------- | :------------------------- | :---------- | :------------------------------------------- |
| `Role`          | `/api/roles`               | `POST`      | Create a new role                            |
|                 | `/api/roles`               | `GET`       | Get all roles                                |
|                 | `/api/roles/:name`         | `GET`       | Get a role by name                           |
|                 | `/api/roles/:name`         | `PUT`       | Update a role by name (body: `{ "newName": "..." }`) |
|                 | `/api/roles/:name`         | `DELETE`    | Delete a role by name                        |
| `Person`        | `/api/people`              | `POST`      | Create a new person                          |
|                 | `/api/people`              | `GET`       | Get all people                               |
|                 | `/api/people/:id`          | `GET`       | Get a person by ID                           |
|                 | `/api/people/:id`          | `PUT`       | Update a person by ID                        |
|                 | `/api/people/:id`          | `DELETE`    | Delete a person by ID                        |
| `Project`       | `/api/projects`            | `POST`      | Create a new project                         |
|                 | `/api/projects`            | `GET`       | Get all projects                             |
|                 | `/api/projects/:id`        | `GET`       | Get a project by ID                          |
|                 | `/api/projects/:id`        | `PUT`       | Update a project by ID                       |
|                 | `/api/projects/:id`        | `DELETE`    | Delete a project by ID                       |
| `Contract`      | `/api/contracts`           | `POST`      | Create a new contract                        |
|                 | `/api/contracts`           | `GET`       | Get all contracts                            |
|                 | `/api/contracts/:id`       | `GET`       | Get a contract by ID                         |
|                 | `/api/contracts/:id`       | `PUT`       | Update a contract by ID                      |
|                 | `/api/contracts/:id`       | `DELETE`    | Delete a contract by ID                      |
| `ProjectWriteOff`|`/api/project-write-offs`  | `POST`      | Create a new project write-off               |
|                 |`/api/project-write-offs`  | `GET`       | Get all project write-offs                   |
|                 |`/api/project-write-offs/:id`| `GET`       | Get a project write-off by ID                |
|                 |`/api/project-write-offs/:id`| `PUT`       | Update a project write-off by ID             |
|                 |`/api/project-write-offs/:id`| `DELETE`    | Delete a project write-off by ID             |
| `Assignment`    | `/api/assignments`         | `POST`      | Create a new assignment                      |
|                 | `/api/assignments`         | `GET`       | Get all assignments                          |
|                 | `/api/assignments/:id`     | `GET`       | Get an assignment by ID                      |
|                 | `/api/assignments/:id`     | `PUT`       | Update an assignment by ID                   |
|                 | `/api/assignments/:id`     | `DELETE`    | Delete an assignment by ID                   |
| `Vacation`      | `/api/vacations`           | `POST`      | Create a new vacation record                 |
|                 | `/api/vacations`           | `GET`       | Get all vacation records                     |
|                 | `/api/vacations/:id`       | `GET`       | Get a vacation record by ID                  |
|                 | `/api/vacations/:id`       | `PUT`       | Update a vacation record by ID               |
|                 | `/api/vacations/:id`       | `DELETE`    | Delete a vacation record by ID               |
| `ProjectMember` | `/api/project-members`     | `POST`      | Add a person to a project (body: `{ projectId, personId }`) |
|                 | `/api/project-members`     | `GET`       | Get all project members                      |
|                 | `/api/project-members/:projectId/:personId`| `GET`| Get a project member by composite ID        |
|                 | `/api/project-members/:projectId/:personId`| `DELETE`| Remove a person from a project             |
| `ProjectMemberRate`|`/api/project-member-rates`| `POST`      | Set a custom rate for a person on a project (body: `{ projectId, personId, rate }`) |
|                 |`/api/project-member-rates`| `GET`       | Get all project member rates                 |
|                 |`/api/project-member-rates/:projectId/:personId`| `GET`| Get a rate by composite ID                  |
|                 |`/api/project-member-rates/:projectId/:personId`| `PUT`| Update a rate by composite ID (body: `{ rate }`) |
|                 |`/api/project-member-rates/:projectId/:personId`| `DELETE`| Delete a rate by composite ID             |

## Running the Application

### Development
To run the application in development mode with live reloading:
```bash
npm run dev
```
The server will start on the port defined in your `.env` file (default: `3000`).

### Production
To build and run the application in production mode:
```bash
npm run build
npm start
```

## Example Usage

Here are some `curl` examples to interact with the API:

### 1. Create a Role
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"Developer"}' http://localhost:3000/api/roles
```

### 2. Get All Roles
```bash
curl http://localhost:3000/api/roles
```

### 3. Create a Person (assuming 'Developer' role exists)
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "name": "Jane Doe",
  "roleName": "Developer",
  "capacityPerWeek": 40.0,
  "active": true,
  "isExternal": false,
  "rateInternal": 50,
  "rateExternal": 100
}' http://localhost:3000/api/people
# Save the 'id' from the response for later use
```

### 4. Create a Project
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "name": "Project A",
  "status": "Active",
  "color": "#FF0000",
  "budgetWithVAT": 10000.0,
  "projectType": "Internal",
  "costEditable": 0.0,
  "costEditableTouched": false,
  "startDate": "2023-01-01T00:00:00.000Z",
  "endDate": "2023-12-31T00:00:00.000Z",
  "isArchived": false
}' http://localhost:3000/api/projects
# Save the 'id' from the response for later use
```

### 5. Add a Person to a Project (ProjectMember)
Assuming you have `personId` and `projectId` from steps 3 and 4:
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "projectId": "<PROJECT_ID>",
  "personId": "<PERSON_ID>"
}' http://localhost:3000/api/project-members
```

### 6. Set a Custom Rate for a Project Member (ProjectMemberRate)
Assuming you have `personId` and `projectId`:
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "projectId": "<PROJECT_ID>",
  "personId": "<PERSON_ID>",
  "rate": 60
}' http://localhost:3000/api/project-member-rates
```

### 7. Update a Project Member Rate
```bash
curl -X PUT -H "Content-Type: application/json" -d '{"rate": 65}' http://localhost:3000/api/project-member-rates/<PROJECT_ID>/<PERSON_ID>
```

### 8. Delete a Person
```bash
curl -X DELETE http://localhost:3000/api/people/<PERSON_ID>
```

## Scripts
-   `npm install`: Installs project dependencies.
-   `npm start`: Starts the compiled Node.js application (production mode).
-   `npm run dev`: Starts the application in development mode with `nodemon` for live reloading.
-   `npm run build`: Compiles TypeScript files to JavaScript in the `dist` directory.
-   `npm run postinstall`: Automatically runs `prisma generate` after `npm install` to ensure the Prisma client is up-to-date.
-   `npm run prisma:migrate-dev`: Creates and applies new database migrations.
-   `npm run prisma:generate`: Generates the Prisma client.
-   `npm run prisma:studio`: Opens Prisma Studio for a GUI to your database.

## Contributing
Feel free to fork the repository, open issues, and submit pull requests.

## License
This project is licensed under the MIT License.
