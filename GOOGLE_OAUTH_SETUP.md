# Google OAuth 2.0 Setup Guide

Follow these steps to configure Google OAuth authentication for your Nursery Ecommerce application.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Nursery Ecommerce`
4. Click **"Create"**

## Step 2: Enable Google+ API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** → Click **"Create"**
3. Fill in the required information:
   - **App name**: `Nursery Ecommerce`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Click **"Add or Remove Scopes"**
   - Select: `userinfo.email`
   - Select: `userinfo.profile`
6. Click **"Save and Continue"**
7. **Test users** (for development):
   - Add your Gmail addresses for testing
8. Click **"Save and Continue"** → **"Back to Dashboard"**

## Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Application type"**: `Web application`
4. Enter **Name**: `Nursery Ecommerce Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   ```
7. Click **"Create"**

## Step 5: Copy Your Credentials

After creation, you'll see a modal with:
- **Client ID**: Something like `123456789-abc...xyz.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc...xyz`

**Copy both values!**

## Step 6: Update .env File

Open your `.env` file and replace the placeholder values:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Step 7: Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

This will install:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy

## Step 8: Start the Server

```bash
npm run dev
```

## Step 9: Test Google Login

1. Go to `http://localhost:3000/login`
2. Click **"Continue with Google"** button
3. Select your Google account
4. Grant permissions
5. You should be redirected back to the homepage, logged in!

## Production Setup

When deploying to production, you need to:

1. **Update Authorized Origins** in Google Console:
   ```
   https://yourdomain.com
   ```

2. **Update Redirect URIs**:
   ```
   https://yourdomain.com/auth/google/callback
   ```

3. **Update .env** for production:
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
   ```

4. **Publish OAuth App**:
   - Go to OAuth consent screen
   - Click "Publish App"
   - Submit for verification (if needed)

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the callback URL in your `.env` matches exactly with the one in Google Console
- Check for trailing slashes

### Error: "Access blocked: This app's request is invalid"
- Your OAuth consent screen is not configured properly
- Make sure you've added your email as a test user

### Error: "invalid_client"
- Your Client ID or Client Secret is incorrect
- Check your `.env` file values

## Security Notes

⚠️ **NEVER commit your `.env` file to GitHub!**

The `.gitignore` file already excludes it, but always double-check:
```
.env
```

## How It Works

1. User clicks "Continue with Google"
2. Redirects to Google's login page
3. User authenticates with Google
4. Google redirects back to `/auth/google/callback`
5. Passport verifies the user
6. Creates new user OR links to existing user (by email)
7. Sets session and logs user in
8. Redirects to homepage

## Benefits

✅ **No password needed** - Users can sign in with Google  
✅ **Quick registration** - Auto-fills name and email  
✅ **Secure** - Uses OAuth 2.0 standard  
✅ **Account linking** - Links Google to existing accounts by email  
✅ **Better UX** - One-click authentication  

---

Need help? Check the [Passport.js documentation](http://www.passportjs.org/) or [Google OAuth 2.0 docs](https://developers.google.com/identity/protocols/oauth2).
