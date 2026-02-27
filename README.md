# Algorithmic Backtester + Paper Trading Platform

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-success)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-19.1-cyan)
![NestJS](https://img.shields.io/badge/NestJS-10.0-red)
![License](https://img.shields.io/badge/License-MIT-green)

## Project Description

**What it does:**
This project is a modern, full-stack monorepo for algorithmic cryptocurrency and stock trading strategy backtesting and paper trading. It provides a comprehensive platform to build, backtest, and visualize trading strategies using real historical data and technical indicators. 

**Why we used these technologies:**
- **Turborepo & pnpm:** To efficiently manage a monorepo structure, sharing types and core logic securely between the frontend and backend.
- **NestJS:** Provides a scalable, robust, and strongly-typed backend architecture.
- **React & Vite:** Ensures a blazing-fast user interface and development experience.
- **Prisma & PostgreSQL:** Offers a reliable, type-safe database layer to store complex user data, backtest results, and strategies.
- **Redis & BullMQ:** Manages the heavy lifting and asynchronous nature of backtesting through robust background job queues.
- **Tailwind / CSS:** For modern and responsive visual components (assuming typical companion to Vite/React).

**Future features:**
- Live trading execution via exchange APIs.
- Advanced AI-based trading strategies.
- Social sharing of successful backtests and strategies.

## Table of Contents
- [Project Description](#project-description)
- [How to Install and Run the Project](#how-to-install-and-run-the-project)
- [How to Use the Project](#how-to-use-the-project)
- [Include Tests](#include-tests)
- [How to Contribute to the Project](#how-to-contribute-to-the-project)
- [Include Credits](#include-credits)
- [Add a License](#add-a-license)

## How to Install and Run the Project

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18.0.0 or higher)
- pnpm (v8.0.0 or higher)
- Docker & Docker Compose (for the database and Redis cache)

### Step-by-step Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd backtester
   ```

2. **Install all workspace dependencies:**
   ```bash
   pnpm install
   ```

3. **Start Infrastructure (Database & Redis):**
   We use Docker to spin up PostgreSQL and Redis seamlessly.
   ```bash
   docker-compose up -d
   ```

4. **Environment Configuration:**
   Copy the example environment variables file at the project root.
   ```bash
   cp .env.example .env.local
   ```
   *(Ensure you also configure any required `.env` files inside `apps/api` and `apps/web` if needed).*

5. **Initialize Database:**
   Generate the Prisma client and push the schema to your local database.
   ```bash
   cd apps/api
   pnpm prisma db push
   pnpm prisma generate
   cd ../..
   ```

6. **Start the Application:**
   Run the full stack (API, Web, and Packages) in development mode.
   ```bash
   pnpm dev
   ```

## How to Use the Project

Once the application is running via `pnpm dev`:

- **Frontend Application:** Open your browser and navigate to the Vite output URL, typically `http://localhost:5173`. Here you can interact with the user interface to design and launch your backtests.
- **Backend API:** The NestJS server usually runs on `http://localhost:3000`. You can interact with the API endpoints directly or via tools like Postman/Insomnia.
- **Redis Management:** We've included Redis Commander to visualize your Redis cache and queues. Access it at `http://localhost:8081`.

If you need to log in or register to test authentication, use the registration endpoints or the UI form provided on the web platform. The platform uses standard JWT authentication via Passport.

## Include Tests

We emphasize code reliability. You can run the test suites for all packages and applications directly from the root using Turbo:

```bash
# Run unit tests (Jest) across the monorepo
pnpm test

# Run tests in watch mode for a specific package (e.g., strategy-engine)
cd packages/strategy-engine
pnpm test:watch

# Generate a test coverage report
pnpm test:coverage
```

## How to Contribute to the Project

Contributions, issues, and feature requests are highly welcome! To contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure that you run `pnpm lint`, `pnpm format:check`, and `pnpm test` before submitting your PR to keep the codebase clean.

## Include Credits

- Built by the [Your Team/Name] team.
- Built utilizing [NestJS](https://nestjs.com/), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [Prisma](https://www.prisma.io/).

## Add a License

Distributed under the MIT License. See `LICENSE` for more information.
