# Student Task Management

## Run with Docker in VS Code

1. Install and start Docker Desktop, then open this project folder in VS Code.
2. Open **Terminal → New Terminal** in VS Code.
3. Start the website, API, and MySQL database:

   ```sh
   docker compose up --build
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser. The frontend sends API requests through its Nginx proxy; you can also check the API at [http://localhost:3000/api/health](http://localhost:3000/api/health).
5. Press **Ctrl+C** in the terminal to stop the services. Run `docker compose down` to stop and remove the containers while keeping saved tasks.

The database is initialized automatically on its first start and stored in the `db_data` Docker volume. To permanently delete the database and all saved tasks, run `docker compose down --volumes`.

The Compose file supplies development-only database credentials by default. For deployment, set `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_ROOT_PASSWORD` in the environment and use an HTTPS-enabled hosting setup. The published ports are bound to localhost for local development.

## Run without Docker

The API requires MySQL. Create the database and task table using `database/init.sql`, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for the backend, then run `npm install` and `npm start` from `backend`. Serve the files in `frontend` with a web server configured to proxy `/api/` to the backend.
