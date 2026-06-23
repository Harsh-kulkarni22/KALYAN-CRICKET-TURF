# Deployment Instructions

## 1. Environment Variables Configuration

### Backend (`/backend/.env`)
Create these variables on your hosting provider (Render, Heroku, etc.):
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_strong_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### Frontend (`/frontend/.env.local`)
Create these variables on Vercel:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```
*Note: Update API endpoints in frontend to use `NEXT_PUBLIC_API_URL` instead of localhost in production.*

---

## 2. Deploying Backend (Render / Railway)
1. Push your code to GitHub.
2. Go to Render.com and create a new **Web Service**.
3. Connect your GitHub repository and point to the `/backend` directory.
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add the environment variables listed above.
7. Deploy.

---

## 3. Deploying Frontend (Vercel)
1. Go to Vercel.com and select **Add New Project**.
2. Connect your GitHub repository.
3. Select the `/frontend` directory as the Root Directory.
4. Framework Preset will automatically detect **Next.js**.
5. Add the Environment Variables.
6. Click **Deploy**.

---

## 4. Setup MongoDB Atlas
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** and allow IP address `0.0.0.0/0`.
3. Go to **Database Access** and create a user.
4. Get the connection string and place it in your `MONGO_URI` environment variable.

---

## 5. Razorpay Configuration
1. Login to Razorpay Dashboard.
2. Go to Settings > API Keys > Generate Keys in Production.
3. Copy Key ID and Key Secret to your backend and frontend `.env` files.
