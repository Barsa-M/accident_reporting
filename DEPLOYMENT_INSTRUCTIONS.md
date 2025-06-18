# Firebase Function Deployment Instructions

## CORS Issue Resolution

The CORS error you're encountering is because the Firebase function `updateResponderAvailability` needs to be deployed to Firebase. Here's how to resolve it:

## Prerequisites

1. **Firebase CLI installed**: Make sure you have Firebase CLI installed globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Logged into Firebase**: Ensure you're logged into the correct Firebase project
   ```bash
   firebase login
   ```

3. **Project selected**: Make sure you're in the correct Firebase project
   ```bash
   firebase use accident-reportingg
   ```

## Deployment Steps

### 1. Navigate to Functions Directory
```bash
cd functions
```

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Deploy the Function
```bash
firebase deploy --only functions:updateResponderAvailability
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

### 4. Verify Deployment
After deployment, you should see output similar to:
```
✔  functions[updateResponderAvailability(us-central1)] Successful create operation.
```

## Alternative: Deploy from Root Directory

If you're in the root project directory:

```bash
firebase deploy --only functions:updateResponderAvailability
```

## Troubleshooting

### If deployment fails:

1. **Check Firebase project**: Ensure you're in the correct project
   ```bash
   firebase projects:list
   firebase use accident-reportingg
   ```

2. **Check billing**: Firebase Functions require a billing account
   - Go to Firebase Console → Project Settings → Usage and billing
   - Set up billing if not already done

3. **Check function logs**: If the function is deployed but still not working
   ```bash
   firebase functions:log --only updateResponderAvailability
   ```

4. **Test function locally** (optional):
   ```bash
   firebase emulators:start --only functions
   ```

## Current Status

The availability update system has been implemented with a **fallback mechanism**:

1. **Primary**: Tries to call the Firebase function `updateResponderAvailability`
2. **Fallback**: If the function fails (CORS, deployment issues, etc.), it uses direct Firestore updates

This means the availability update will work immediately, even if the Firebase function isn't deployed yet.

## Benefits of Deploying the Function

Once deployed, the Firebase function provides:
- **Better security**: Server-side validation and authorization
- **Automatic incident reassignment**: When responders become unavailable
- **Notifications**: Automatic notifications for reassigned incidents
- **Audit trail**: Better logging and monitoring

## Immediate Solution

The current implementation will work immediately using the fallback mechanism. The Firebase function deployment is recommended for production use but not required for testing.

## Testing the Deployment

After deployment, test the function:

1. Go to Firebase Console → Functions
2. Find `updateResponderAvailability`
3. Check the logs for any errors
4. Test the availability update from the frontend

## Environment Variables

If you need to set environment variables for the function:

```bash
firebase functions:config:set some.key="value"
firebase deploy --only functions
```

## Monitoring

Monitor function usage and errors:
- Firebase Console → Functions → Logs
- Firebase Console → Functions → Usage 