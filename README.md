# ArtCollab

ArtCollab is an online platform where artists can showcase their work, collaborate on projects, and share feedback in a supportive community.  
It acts as a digital gallery and collaboration hub for illustration, painting, photography, digital art, design, storytelling, music, and hybrid disciplines.

---

## ✨ MVP Feature Set

The current MVP includes:

- **Secure authentication**
  - Email + password login, registration
  - Hashed passwords with bcrypt
  - JWT-based auth with role support (`user`, `collaborator`, `support`, `admin`)
- **Artist profiles**
  - Public profile with avatar, cover image, bio, tagline, location, specializations
  - Social links (website, Instagram, X/Twitter, LinkedIn)
  - Open‑to‑collab flag, followers / following counters
- **Media gallery**
  - Upload images and other files
  - Files stored in **Cloudinary**, metadata stored in MongoDB
  - Visibility (`public` / `private`) and status (`draft` / `published`)
  - Categories (painting, music, design, illustration, storytelling, photography, sculpture, digital_art, other)
  - Likes, views, collaborators
- **Projects (collaborative work)**
  - Project entities with owner + participants
  - Visibility options and statuses
  - Cover images stored via Cloudinary
- **Feedback**
  - Model for comments, ratings, reviews, likes, helpful flags, reports
  - (Frontend wiring is in progress; backend is ready)
- **Account management**
  - Update profile & collaboration preferences
  - Change password
  - Deactivate account (soft‑delete `isActive`)

Email‑based password reset (Mailtrap) can be wired in when needed; the original plumbing is still present in the backend.

---

## 🧱 Tech Stack

### Frontend

- **React** + **Vite**
- **Routing:** React Router (`src/routes/AppRouter.jsx`)
- **State / Context:**
  - `AuthContext` for session & current user
  - Local component state for forms
- **Styling:**
  - Custom CSS, global design tokens in `src/styles/global.css`
  - Layout shell + glassmorphism cards tuned for an artistic theme
- **HTTP client:** Axios instance in `src/api/client.js`
- **Notifications:** `react-hot-toast`

### Backend

- **Runtime:** Node.js (v18+ recommended)
- **Framework:** Express
- **Database:** MongoDB + Mongoose
- **Auth & Security:**
  - JWT (`jsonwebtoken`)
  - Password hashing (`bcryptjs`)
  - Role‑based authorization
  - Basic validation middleware (express‑validator)
- **File uploads:**
  - `multer` (memory storage)
  - `cloudinary` SDK
- **Email (optional / dev):**
  - Nodemailer + Mailtrap for password‑reset flows

---

## 🗂 Repository Structure

This repo is a small monorepo with separate backend and frontend apps:

```text
.
├── backend/          # Express + MongoDB API
└── frontend/         # React + Vite SPA
```

High‑level structure:

```text
backend/
  app.js
  routes/
  controllers/
  models/
  middleware/
  utils/
  .env.example

frontend/
  index.html
  vite.config.js
  src/
    api/
    app/
    components/
    context/
    pages/
    routes/
    styles/
    util/
```

---

## ⚙️ Backend Setup

### 1. Requirements

- Node.js **v18+**
- npm (or yarn)
- A MongoDB instance:
  - Local MongoDB (e.g. `mongodb://127.0.0.1:27017/artcollab`)
  - or MongoDB Atlas

### 2. Install dependencies

From the repo root:

```bash
cd backend
npm install
```

### 3. Configure environment variables

Use the example file as a base:

```bash
cd backend
cp .env.example .env
```

Then edit `.env` with your values. A typical configuration for local development looks like:

```env
NODE_ENV=development
PORT=5001

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/artcollab

# JWT auth
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12

# Frontend URL (CORS, cookies, etc.)
FRONTEND_URL=http://localhost:5173

# Cloudinary configuration (required for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# Optional: base folder where uploaded files will be stored
CLOUDINARY_UPLOAD_FOLDER=artcollab_media

# Mailtrap / SMTP (optional, for password reset emails)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_username
MAIL_PASS=your_mailtrap_password
MAIL_FROM="ArtCollab <no-reply@artcollab.test>"
```

> 🔐 **Important**
>
> - Never commit `.env` to the repository.
> - Check `backend/.env.example` for the most up‑to‑date list of variables.

### 4. Start the backend

From `backend/`:

```bash
npm run dev   # usually starts nodemon app.js
# or
npm start     # depending on the scripts in package.json
```

By default the API is available at:

```text
http://localhost:5001/api
```

---

## 🧠 Backend: Key Modules & Concepts

### Models

#### `User`

Located at `backend/models/User.js`.

Key fields:

- `email`, `username`, `password`
- `role` – one of `user | collaborator | support | admin`
- Profile fields: `firstName`, `lastName`, `bio`, `tagline`, `location`
- Collaboration / discovery: `openToCollab`, `specializations[]`, `socialLinks`
- Avatar & cover: `profilePicture`, `coverImage` (Cloudinary URLs)
- Social: `followers[]`, `following[]`
- Auth: `isActive`, `isVerified`, `lastLogin`, `refreshTokens[]`
- Password & email verification fields for reset flows

Important methods:

- `matchPassword(plainText)` → compares a plain text password with the hashed one.
- `getSignedJwtToken()` → creates a signed JWT payload `{ id, email, username, role }`.
- `getPublicProfile()` → returns a safe, public‑facing snapshot (no passwords/tokens).

#### `Media`

Located at `backend/models/Media.js` (simplified summary):

- Basic fields:
  - `title`, `description`
  - `mediaType` – e.g. `image`, `audio`, `video`, `document`
  - `category` – values like `painting`, `music`, `design`, `illustration`, `storytelling`, `photography`, `sculpture`, `digital_art`, `other`
- Cloudinary integration:
  - `fileName`, `originalName`, `fileSize`, `mimeType`
  - `cloudUrl` – original file URL in Cloudinary
  - `thumbnailUrl` – transformed URL for previews
  - `cloudinaryPublicId`, `cloudinaryResourceType`
- Ownership & visibility:
  - `owner` – reference to `User`
  - `collaborators` – array of `{ user, role }`
  - `visibility` – `public` or `private`
  - `status` – `draft`, `published`, etc.
- Engagement:
  - `views`, `likes[]`, `likeCount`

Helper methods (defined on the schema):

- `canView(userId)` – checks if a given user can see the media.
- `canEdit(userId)` – checks if a given user can edit it.
- `incrementViews()` – increments the view counter safely.
- `addLike(userId)`, `removeLike(userId)` – toggle likes.

#### `Project` and `Feedback`

- `Project` – collaborative entities with:
  - `owner`, `participants[]` (with roles & statuses)
  - `title`, `description`, `category`, `status`, `visibility`
  - optional `coverImage` (Cloudinary URL) & metadata
- `Feedback` – comments, ratings, reactions, reports, linked to media or projects.

### Controllers & Routes

Only the most relevant ones:

- `routes/auth.js` – login, register, current user, etc.
- `routes/users.js` – profile, preferences, follow, stats.
- `routes/media.js` – media gallery, upload, like, collaborators, categories.
- `routes/projects.js` – project CRUD and collaboration endpoints.
- `routes/feedback.js` – feedback creation and moderation.

All routes are mounted from `backend/app.js` under the `/api` prefix, e.g.:

```text
GET    /api/media
POST   /api/media
GET    /api/media/:id
POST   /api/media/:id/like
POST   /api/media/:id/collaborators
...
GET    /api/users
GET    /api/users/me
PATCH  /api/users/me/profile
PATCH  /api/users/me/password
DELETE /api/users/me
...
```

### Middleware

- `middleware/auth.js`
  - Parses the JWT (from header or cookies, depending on the implementation).
  - Attaches the authenticated `user` to `req.user`.
  - Used to protect private routes.
- `middleware/roles.js`
  - Small helper to require specific roles (e.g. admin/support only).
- `middleware/upload.js`
  - Configures `multer` with memory storage.
  - Restricts max file size and accepted mime types.
  - Used for `POST /api/media` and specific upload endpoints.

### Cloudinary Utils

`backend/utils/cloudinary.js` exposes:

- The configured `cloudinary` instance.
- `uploadBuffer(buffer, options)` – uploads an in‑memory file buffer to Cloudinary, returns the Cloudinary response (including `public_id`, `secure_url`, and `resource_type`).
- `deleteFromCloudinary(publicId, resourceType)` – deletes a resource by public ID.

These helpers are used inside `mediaController` and upload endpoints.

---

## ☁️ Media Uploads & Cloudinary (How It Works)

### 1. Configure Cloudinary

1. Create a free account at https://cloudinary.com.
2. Go to your **Dashboard** and copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add them to `backend/.env`:

   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_UPLOAD_FOLDER=artcollab_media
   ```

4. Restart the backend after changing `.env`.

### 2. Upload flow (generic media)

Endpoint: `POST /api/media`  
Access: **Private** (authenticated)

- The route uses `multer` (`upload.single('file')`) to read the file from the `form-data` body.
- The controller (`createMedia`) determines the Cloudinary `resource_type` from `file.mimetype`:
  - `image/*` → `image`
  - `video/*` → `video`
  - everything else → `raw`
- Then it calls:

  ```js
  const uploadResult = await uploadBuffer(file.buffer, {
    folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER || "artcollab_media"}/${
      category || "uncategorized"
    }`,
    resourceType,
  });
  ```

- For images, it also generates a `thumbnailUrl` using Cloudinary transforms (e.g. 400×400 crop).
- It saves a `Media` document with:
  - `cloudUrl` (original)
  - `thumbnailUrl`
  - `cloudinaryPublicId`
  - `cloudinaryResourceType`
  - plus all other metadata (title, description, tags, etc.).

#### Example `curl` upload

```bash
curl -X POST http://localhost:5001/api/media   -H "Authorization: Bearer <YOUR_JWT_TOKEN>"   -F "file=@/path/to/your-image.jpg"   -F "title=Test piece"   -F "description=Uploaded via curl"   -F "mediaType=image"   -F "category=painting"   -F "visibility=public"
```

### 3. Profile avatars & covers

For the profile settings UI, the frontend:

1. Lets the user pick an image (avatar or cover).
2. Opens a crop modal (`AvatarCropModal`) and lets the user crop/zoom.
3. Uses a utility `getCroppedImage` to turn the crop into a **new JPEG file**.
4. Calls `uploadProfileImage(file, { kind: 'avatar' | 'cover' })` from `src/api/uploads.js`.

`uploadProfileImage` is a small wrapper that internally uses the same `POST /api/media` endpoint and tags uploads with:

```js
metadata: {
  usage: 'profile',
  kind: 'avatar' // or 'cover'
}
```

From the API response, the frontend picks the most appropriate URL (usually `thumbnailUrl` for avatars and the main `secureUrl` for covers) and stores it in the user profile via:

```ts
PATCH /api/users/me/profile
{
  profilePicture: "<url from Cloudinary>",
  coverImage: "<url from Cloudinary>",
  ...
}
```

So Cloudinary is the **only** place where binary files live; the database stores just URLs + metadata.

---

## 🖥 Frontend Setup

### 1. Requirements

- Node.js **v18+**
- npm (or yarn)

### 2. Install dependencies

From the repo root:

```bash
cd frontend
npm install
```

### 3. Frontend environment variables

Create a `.env` or `.env.local` file inside `frontend/` (if you don’t already have one). At minimum:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

The `src/api/client.js` file reads this and configures Axios:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
```

If you change the backend port or mount path, make sure to update this value.

### 4. Start the frontend dev server

From `frontend/`:

```bash
npm run dev
```

By default Vite serves the app on:

```text
http://localhost:5173
```

---

## 🧩 Frontend Structure & Key Pieces

High‑level structure (simplified):

```text
frontend/src/
  api/
    client.js        # axios instance
    auth.js          # login, register, me, logout
    users.js         # profile & preferences
    media.js         # media CRUD & likes
    projects.js      # project endpoints
    uploads.js       # helpers for profile uploads, etc.

  app/
    AppShell.jsx     # main authenticated app layout (sidebar/topbar if used)
    ...

  components/
    layout/          # navbar, footer, layout pieces
    profile/         # profile header, settings components, AvatarCropModal, etc.
    project/         # project cards, lists
    media/           # media cards, grids, filters
    ui/              # Button, TextField, inputs, reusable primitives
    ProtectedRoute.jsx

  context/
    AuthContext.jsx  # provides user, login, logout, refreshUser, etc.

  pages/
    marketing/
      HomePage.jsx
      AboutPage.jsx
      ...
    auth/
      LoginPage.jsx
      RegisterPage.jsx
      ForgotPasswordPage.jsx
      ResetPasswordPage.jsx
    profile/
      ProfileSettings.jsx
      ...
    media/
      MediaGalleryPage.jsx
      MediaDetailPage.jsx
    projects/
      ProjectsPage.jsx
      ProjectDetailPage.jsx

  routes/
    AppRouter.jsx     # all routes (public + private)

  styles/
    global.css        # global tokens, typography, app shell, theme

  util/
    cropImage.js      # takes an image + crop area and returns a Blob/File
```

### Routing & Auth

- `AppRouter.jsx` defines:
  - Public routes (marketing pages, login, register, forgot/reset)
  - Private routes (dashboard, profile, media, projects) wrapped in `ProtectedRoute`.
- `AuthContext`:
  - Holds the current `user` object (from `/api/auth/me` or `/api/users/me`).
  - Exposes helpers: `login`, `logout`, `refreshUser`, etc.
  - Ensures that authenticated areas of the app only render when the session is valid.

### Profile Settings UI

- `pages/profile/ProfileSettings.jsx`:
  - Three main tabs:
    - **Public profile** (avatar, cover, bio, tagline, location, social links)
    - **Collaboration preferences** (openToCollab, disciplines, region)
    - **Security & account** (change password, deactivate account)
  - Uses:
    - `getMyProfile`, `updateMyProfile`, `updateMyPassword`, `deactivateMyAccount`
    - `uploadProfileImage` for avatar/cover uploads
    - `AvatarCropModal` + `cropImage.js` for cropping

---

## 🔐 Password Management

Even though the UI is currently more focused on profile & media, the backend supports:

- `PATCH /api/users/me/password`
  - Body: `{ currentPassword, newPassword }`
  - Validates the current password and updates it atomically.
- `DELETE /api/users/me`
  - Soft‑deactivates the account (`isActive = false`) and clears refresh tokens.

For a full forgot/reset flow with emails, you can use the existing Mailtrap configuration and wire:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

and corresponding pages under `pages/auth/`.

---

## 🧪 Local Development Workflow (TL;DR)

1. **Clone the repo**

   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. **Backend**

   ```bash
   cd backend
   cp .env.example .env        # edit it with Mongo, Cloudinary, JWT, Mailtrap
   npm install
   npm run dev
   ```

   Backend runs on `http://localhost:5001`.

3. **Frontend**

   ```bash
   cd ../frontend
   # create .env (if needed)
   echo "VITE_API_BASE_URL=http://localhost:5001/api" > .env
   npm install
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`.

4. **Try it out**

   - Open `http://localhost:5173`
   - Sign up → log in
   - Go to **Profile Settings**
   - Upload an avatar & cover (cropping should work)
   - Create and browse media items once the gallery UI is wired

---

## 🤝 Contributing

If you’re collaborating on this project:

1. Create a feature branch from the main dev branch:

   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes in `backend/` and/or `frontend/`.
3. Run the backend and frontend locally and verify:
   - Auth still works
   - Profile update works
   - Uploads/media & Cloudinary still work
4. Commit with a clear message:

   ```bash
   git commit -m "feat: short description of the change"
   ```

5. Push and open a Pull Request.

---

## 📌 Summary

- **MongoDB** stores users, media, projects, feedback, and relationships.
- **Cloudinary** stores all binary media (avatars, covers, artworks).
- **Express + JWT** secure the API with roles.
- **React + Vite** power a modern, artistic UI with profile & collaboration features.

Once you have MongoDB, Cloudinary, and Mailtrap (optional) configured in `.env`, you should be able to run:

```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev
```

…and start collaborating visually with ArtCollab. 🎨
