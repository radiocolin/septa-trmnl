# SEPTA TRMNL App

Display upcoming SEPTA bus, trolley, or subway departures on your TRMNL e-ink display.

## How it works
This project uses a Node.js script to fetch real-time data from SEPTA and pushes it to a TRMNL Private Plugin webhook. It runs automatically every 15 minutes using GitHub Actions.

## Setup Instructions

### 1. Create a Private Plugin on TRMNL
1. Log in to your [TRMNL Dashboard](https://trmnl.com).
2. Go to **Plugins** -> **Private Plugins** -> **Add New**.
3. Choose **Custom Endpoint**.
4. **Markup**: 
   - Paste `trmnl/full.liquid` into the **Full** tab.
   - Paste `trmnl/half_horizontal.liquid` into the **Half Horizontal** tab.
   - Paste `trmnl/half_vertical.liquid` into the **Half Vertical** tab.
   - Paste `trmnl/quadrant.liquid` into the **Quadrant** tab.
5. Save the plugin.
6. Note your **Webhook URL** (e.g., `https://trmnl.com/api/custom_plugins/abcd-1234`).

### 2. Configure GitHub Repository
1. Push this code to a new private GitHub repository.
2. Go to **Settings** -> **Secrets and variables** -> **Actions**.
3. Add a **New repository secret**:
   - Name: `TRMNL_WEBHOOK_URL`
   - Value: Your TRMNL Webhook URL.
4. Add **Repository variables** (optional, defaults to Route 17, Stop 10264):
   - `SEPTA_ROUTE`: Your bus route number (e.g., `17`).
   - `SEPTA_STOP`: Your stop ID (e.g., `10264`).

### 3. Activate
The GitHub Action will now run every 15 minutes. You can also trigger it manually by going to the **Actions** tab, selecting **Update TRMNL**, and clicking **Run workflow**.

## Local Development
```bash
npm install
npm run build
# Set env vars and run
TRMNL_WEBHOOK_URL=your_url SEPTA_ROUTE=17 SEPTA_STOP=10264 npm start
```
