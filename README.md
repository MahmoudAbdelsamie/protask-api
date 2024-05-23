# ProTask API

ProTask API is a comprehensive project management API built with Node.js, Express, Sequelize ORM, and PostgreSQL. It provides robust endpoints for various project management operations including user authentication, workspace management, task and subtask management, and more.

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Error Handling](#error-handling)
8. [Security](#security)
9. [Contributing](#contributing)
10. [License](#license)

## Features

- User Authentication (Sign-up, Login, Password Management)
- Workspace Management
- Space Management within Workspaces
- Task and Subtask Management
- Tag and Status Management for Tasks
- Attachment and Dependency Management for Tasks
- Invitation and User Role Management
- Comprehensive Validation and Error Handling

## Technology Stack

- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express**: Fast, unopinionated, minimalist web framework for Node.js.
- **Sequelize ORM**: Promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite, and Microsoft SQL Server.
- **PostgreSQL**: Powerful, open source object-relational database system.
- **Socket.IO**: Enables real-time, bidirectional and event-based communication.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/MahmoudAbdelsamie/protask-api.git
   cd protask-api
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up your environment variables. Create a `.env` file in the root directory and add your configuration:
   ```env
   PORT=5000
   JWT_SECRET=
   DB_CONNECTION=
   DB_HOST=
   DB_DIALECT=
   DB_USERNAME=
   DB_PASSWORD=
   DB_PORT=
   ```

4. Run the application:
   ```sh
   npm start
   ```

## Configuration

The application can be configured using environment variables. Here are the most important ones:

- `PORT`: The port on which the server will run.
- `DATABASE_URL`: The connection string for your PostgreSQL database.
- `JWT_SECRET`: The secret key used for signing JSON Web Tokens.

## Usage

### Starting the Server

To start the server, run:
```sh
npm start
```

The server will start on the port specified in the `.env` file. By default, this is `3000`.

## API Endpoints

### Authentication

- **POST** `/login`
  - Login a user.
  - Body: `{ "email": "user@example.com", "password": "password" }`

- **POST** `/sign-up`
  - Register a new user.
  - Body: `{ "name": "User", "email": "user@example.com", "password": "password" }`

### Workspace Management

- **POST** `/add-new-workspace`
  - Create a new workspace.
  - Body: `{ "name": "Workspace Name", "description": "Workspace Description" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **GET** `/my-workspaces`
  - Get all workspaces of the authenticated user.
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Space Management

- **GET** `/spaces`
  - Get all spaces.
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **POST** `/new-space`
  - Create a new space.
  - Body: `{ "name": "Space Name", "workspaceId": "workspace_id" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Task Management

- **POST** `/add-task`
  - Create a new task.
  - Body: `{ "name": "Task Name", "spaceId": "space_id" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **GET** `/task/:id`
  - Get a task by ID.
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **PUT** `/task/:id`
  - Update a task by ID.
  - Body: `{ "name": "Updated Task Name" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Subtask Management

- **POST** `/subtask`
  - Create a new subtask.
  - Body: `{ "name": "Subtask Name", "taskId": "task_id" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **GET** `/subtask/:id`
  - Get a subtask by ID.
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Tag Management

- **POST** `/tags`
  - Create a new tag.
  - Body: `{ "name": "Tag Name" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **GET** `/tags/:id`
  - Get tags by space ID.
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Status Management

- **POST** `/status`
  - Create a new status.
  - Body: `{ "name": "Status Name", "listId": "list_id" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **GET** `/status/:id`
  - Get statuses by list ID.
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Attachment Management

- **POST** `/new-task-attachment`
  - Add a new attachment to a task.
  - Body: `{ "taskId": "task_id", "attachment": "file_data" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Dependency Management

- **POST** `/new-task-dependency`
  - Add a new dependency to a task.
  - Body: `{ "taskId": "task_id", "dependsOn": "another_task_id" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`

### User Management

- **GET** `/get-user-settings`
  - Get user settings.
  - Headers: `{ "Authorization": "Bearer <token>" }`

- **PUT** `/update-user-profile`
  - Update user profile.
  - Body: `{ "name": "Updated Name", "email": "updated_email@example.com" }`
  - Headers: `{ "Authorization": "Bearer <token>" }`


## Security

- **Authentication**: All routes (except for authentication routes) are protected using JWT authentication.
- **Input Validation**: All inputs are validated to prevent SQL injection, XSS, and other attacks.
- **HTTPS**: Ensure your server is configured to use HTTPS in production to encrypt data in transit.
