# 🚀 Week 8: Detailed Implementation Blueprint (PNPM Edition)
## Phase 5: Frontend Development (Basic UI & Auth)

This guide takes you through the technical setup of your React dashboard using **pnpm** and modern React patterns.

---

### Phase 1: Project Setup (The Foundation)
**Objective:** Initialize a high-performance React workspace within your monorepo.

#### 1.1 Project Initialization (Already Completed)
Open your terminal in the root `backtester/` folder:
```powershell
# Create the web application (Use pnpm to install)
pnpm create vite apps/web --template react-ts
pnpm install
```

#### 1.2 Setup Tailwind CSS
Tailwind is the industry standard for rapid UI development. In `apps/web`:
```powershell
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
```
*   **Documentation:** [Tailwind CSS Vite Guide](https://tailwindcss.com/docs/guides/vite)

#### 1.3 Essential Dependencies
Install the tools that will handle navigation, icons, and API calls.
```powershell
pnpm add react-router-dom lucide-react axios react-hook-form
```

---

### Phase 2: Navigation & Routing
**Objective:** Enable multi-page navigation without full page refreshes.

#### 2.1 The Router Setup
Update your `main.tsx` in `apps/web/src` to wrap the application in a `BrowserRouter`.
*   **Documentation:** [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)

#### 2.2 Layout System
Create a `Layout` component that stays on screen while the "page" content changes (Sidebars, Navbars).
*   **Key Concept:** Use the `<Outlet />` component from React Router.
*   **Documentation:** [React Router Layouts](https://reactrouter.com/en/main/components/outlet)

---

### Phase 3: Authentication Logic (The "Brain")
**Objective:** Secure your app and persist user sessions.

#### 3.1 The AuthContext
Create a `src/context/AuthContext.tsx`. This allows any button or page in your app to know: "Who is the user?" and "Are they logged in?"
*   **Hooks to Use:** `useState`, `useEffect`, `useContext`.
*   **Documentation:** [React.dev - Context API](https://react.dev/learn/passing-data-deeply-with-context)

#### 3.2 Persistent Login
Write a `useEffect` inside your AuthContext that checks `localStorage.getItem('token')`. If a token exists, the user is automatically logged back in.
*   **Documentation:** [MDN - Using LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

#### 3.3 Axios Interceptors
Configure Axios so that **every** request to your backend automatically includes the JWT token.
```typescript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
*   **Documentation:** [Axios Interceptors Guide](https://axios-http.com/docs/interceptors)

---

### Phase 4: Forms & Input Validation
**Objective:** Build high-quality Login and Register forms.

#### 4.1 Login & Register Pages
Use `react-hook-form` to handle input states and show error messages.
*   **Documentation:** [React Hook Form - Get Started](https://react-hook-form.com/get-started)

#### 4.2 Handling API Errors
Ensure that if the backend returns a "401 Unauthorized" (wrong password), you show a clear error message on the UI.

---

### Phase 5: Security (The Gatekeeper)
**Objective:** Prevent unauthenticated users from seeing the Dashboard.

#### 5.1 The ProtectedRoute Component
Create a wrapper component that checks the `user` state.
- If `user == null` -> Redirect to `/login`.
- If `user != null` -> Show the requested page.

---

### ✅ Success Verification Checklist
1. **[ ] Redirection:** Trying to go to `/dashboard` sends you to `/login`.
2. **[ ] Registration:** Filling the form creates a real user in your Postgres DB.
3. **[ ] Token:** After login, you can see the `token` stored in Chrome DevTools -> Application -> Local Storage.
4. **[ ] Persistence:** Refreshing the dashboard page does NOT kick you out to login.
