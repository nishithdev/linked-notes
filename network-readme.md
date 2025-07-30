# Thought Graph App - Network Shared

A collaborative thought mapping application that saves to a shared JSON file accessible across network devices.

## Features

- 🧠 **Thought Mapping**: Create and connect thoughts visually
- 🌐 **Network Sharing**: Access from any device on the same network
- 💾 **Auto-Save**: Automatic saving to server with local backup
- 🔄 **Real-time Sync**: Changes sync across all connected devices
- 📱 **Device Agnostic**: Works on desktop, tablet, and mobile browsers

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
# Start both frontend and backend
npm run dev:server
```

### 3. Access from Network Devices
- **Local**: http://localhost:3000
- **Network**: http://[YOUR_IP]:3001 (replace [YOUR_IP] with your machine's IP)

### 4. Production Deployment
```bash
# Build and start production server
npm start
```

## Network Access Setup

### Find Your IP Address
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

### Access from Other Devices
1. Connect devices to the same WiFi network
2. Open browser and navigate to: `http://[YOUR_IP]:3001`
3. Start creating and sharing thoughts!

## File Structure

```
/thoughts-data.json          # Main shared data file
/thoughts-backup-*.json      # Automatic backups
/server.js                   # Express.js backend
/src/services/api.js         # Frontend API service
```

## Status Indicators

- 🟢 **Connected to server**: Data syncs across devices
- 🔴 **Server offline**: Using local storage only
- ⏳ **Saving**: Data being saved to server
- ✅ **Synced**: Successfully saved to server
- 💾 **Saved locally**: Fallback to local storage

## Backup & Recovery

- Automatic backups created before each save
- Local storage fallback when server unavailable
- Manual export/import functionality available

## Troubleshooting

### Server Won't Start
- Check if port 3001 is available
- Run `npm run server` separately to see errors

### Can't Access from Other Devices
- Verify devices are on same network
- Check firewall settings
- Try `http://[IP]:3001` instead of `http://[IP]:3000`

### Data Not Syncing
- Check server status indicator
- Refresh browser on all devices
- Verify `thoughts-data.json` file exists

## Development

```bash
# Frontend only
npm run dev

# Backend only  
npm run server

# Both together
npm run dev:server
```

## Network Security

- Server binds to all interfaces (0.0.0.0)
- CORS enabled for cross-origin requests
- Consider adding authentication for production use
