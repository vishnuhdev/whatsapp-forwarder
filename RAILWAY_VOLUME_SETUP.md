# Railway Volume Setup for WhatsApp Session Persistence

## Overview
This guide explains how to set up persistent storage for WhatsApp session data on Railway, so you don't need to re-authenticate every time you redeploy.

## Setup Instructions

### 1. Create a Volume in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Navigate to the "Volumes" tab
4. Click "Create Volume"
5. Name it: `whatsapp_session_data`
6. Mount path: `/app/data`
7. Click "Create"

### 2. Set Environment Variable

After creating the volume, Railway automatically sets the `RAILWAY_VOLUME_MOUNT_PATH` environment variable to `/app/data`.

The application will automatically detect this and store WhatsApp session data in the persistent volume.

### 3. Deploy Changes

Push the latest changes to trigger a new deployment:

```bash
git add .
git commit -m "Add Railway volume support for WhatsApp session persistence"
git push origin master
```

### 4. First-Time Authentication

1. After deployment, check your logs for the QR code
2. Scan the QR code with WhatsApp on your phone
3. The session will be saved to the persistent volume

### 5. Verify Persistence

After the initial authentication:
- Stop and restart your service
- You should NOT see a QR code again
- The app should automatically reconnect using the saved session

## How It Works

- The `railway.toml` file configures the volume mount point
- The WhatsApp service checks for `RAILWAY_VOLUME_MOUNT_PATH` environment variable
- If found, it stores session data in `/app/data/.wwebjs_auth`
- If not found (local development), it uses the default `.wwebjs_auth` directory

## Troubleshooting

If you still need to re-authenticate after redeployment:

1. Check that the volume is properly attached in Railway dashboard
2. Verify the `RAILWAY_VOLUME_MOUNT_PATH` environment variable exists
3. Check logs for the session data path being used
4. Ensure the volume has sufficient permissions (Railway handles this automatically)

## Important Notes

- The volume persists data across deployments and restarts
- You only need to authenticate once unless you explicitly logout
- The volume is specific to your Railway project and won't be deleted unless you manually remove it
- Cost: Railway volumes are billed based on usage (check Railway pricing for details)