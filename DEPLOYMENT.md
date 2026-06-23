# Deployment Instructions

This guide provides steps for deploying the Kalyan Cricket Turf application. The backend (Express server) is designed for deployment on **Render** (or equivalent Node.js hosting), and the frontend (Next.js app) is designed for deployment on **Vercel**.

---

## 1. Environment Variables Configuration

### Backend Environment Variables (Render)
Configure the following environment variables in your Render Web Service dashboard under the **Environment** settings:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_strong_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_nodemailer_sender_email@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_CONTACT=admin_email_or_phone_number
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Frontend Environment Variables (Vercel)
Configure the following environment variables in your Vercel Project settings under **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Firebase Client Configuration (used for Phone OTP login)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

---

## 2. Deploying Backend (Render)
1. Push your code to GitHub.
2. Go to [Render](https://render.com) and sign in.
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Set the configuration details:
   - **Name**: `kalyan-turf-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click **Advanced** and add the environment variables listed in the backend section above.
7. Click **Create Web Service**.

Once deployed, copy your backend service URL (e.g., `https://kalyan-turf-backend.onrender.com`).

---

## 3. Deploying Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and sign in.
2. Click **Add New...** and select **Project**.
3. Import your GitHub repository.
4. Set the configuration details:
   - **Root Directory**: Select `frontend`
   - **Framework Preset**: Automatically detects `Next.js`
   - **Build Command**: Override to `npm run build` or use default.
5. Add the environment variables listed in the frontend section above (paste the copied Render backend URL as `NEXT_PUBLIC_API_URL`).
6. Click **Deploy**.

---

## 4. Setup MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** and whitelist `0.0.0.0/0` (allowing Render servers to connect).
3. Go to **Database Access** and create a database user with read/write access.
4. Copy the connection string (with the username and password filled in) and set it as `MONGO_URI`.

---

## 5. Razorpay Configuration
1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. For testing, stay in **Test Mode**. For live transactions, switch to **Live Mode**.
3. Go to **Account & Settings** > **API Keys** > **Generate Key**.
4. Copy the `Key ID` and `Key Secret` to both frontend and backend environment variables.
