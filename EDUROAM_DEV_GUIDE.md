# Developing on Eduroam WiFi - Complete Guide

## The Problem
Eduroam uses **client isolation** which prevents your phone from connecting to your laptop's development server. This is a security feature that cannot be disabled.

## Solutions (Ranked by Ease of Use)

### ✅ Solution 1: Tunnel Mode (Best for Eduroam)

**Use this as your primary method on eduroam.**

```bash
# Use the new shortcut:
npm run tunnel

# Or the full command:
npx expo start --tunnel
```

**How it works:**
- Routes connection through Expo's servers
- Bypasses network isolation
- Works exactly like normal Expo, just scans QR code

**Trade-offs:**
- Slightly slower hot reload (1-2 seconds delay)
- Requires stable internet connection
- First load takes longer (~30-60 seconds)

---

### ✅ Solution 2: Mobile Hotspot (Fastest Development)

**Use this when you need rapid iteration and testing.**

**Setup:**
1. Enable Personal Hotspot on your phone (Settings → Personal Hotspot)
2. Connect your laptop to your phone's hotspot
3. Run normal Expo: `npm start`
4. Scan QR code on same phone

**Pros:**
- Fast as regular LAN connection
- No delays in hot reload
- Works offline

**Cons:**
- Uses phone battery faster
- May use cellular data if laptop makes external requests

**Best for:**
- Testing animations and UI
- Rapid development sessions
- When tunnel is too slow

---

### ✅ Solution 3: USB Connection (Android Only)

**For Android users with USB cable.**

**Setup:**
1. Enable Developer Options on Android
2. Enable USB Debugging
3. Connect phone via USB
4. Run: `adb reverse tcp:8081 tcp:8081`
5. Run: `npm start`
6. Open Expo Go app manually

**Alternative with tunnel:**
```bash
# Connect via USB, then:
npm run tunnel
```

**Pros:**
- No WiFi needed
- Stable connection
- Charges phone while developing

**Cons:**
- Android only (iOS doesn't support this)
- Requires USB cable
- Less mobile while testing

---

### ✅ Solution 4: Development Build (Advanced)

**For serious long-term development.**

**Setup:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project (first time only)
eas build:configure

# Build for your platform
eas build --profile development --platform ios
# or
eas build --profile development --platform android

# After build completes, install the app on your phone
# Then run:
npx expo start --dev-client
```

**Pros:**
- Most stable development experience
- Works like a production app
- Supports all native modules
- Better performance

**Cons:**
- Initial setup takes time (30-60 min for first build)
- Requires Expo account
- Builds can take 15-30 minutes
- Requires rebuilding when changing native config

**When to use:**
- You're developing for months
- You need native modules
- You want the most stable experience

---

## Quick Start Commands

```bash
# For eduroam (default):
npm run tunnel

# For mobile hotspot:
npm start

# Check if Expo is installed:
npx expo --version

# Update Expo CLI:
npm install -g expo-cli
```

---

## Troubleshooting

### Tunnel mode fails to start
```bash
# Update your global dependencies:
npm install -g @expo/ngrok

# Try again:
npm run tunnel
```

### QR code doesn't scan
- Make sure Expo Go app is updated
- Try manually entering the URL from terminal
- Check phone and laptop are on internet

### "Unable to connect" after scanning
- Wait 30-60 seconds (tunnel is slower)
- Check terminal for errors
- Try restarting: Ctrl+C, then `npm run tunnel`

### Metro bundler already running
```bash
# Find and kill the process:
lsof -i :8081
kill -9 <PID>

# Or use different port:
npx expo start --tunnel --port 8082
```

### Phone shows "Something went wrong"
- Clear Expo Go cache (in app settings)
- Restart Expo Go app
- Restart tunnel server

---

## Recommended Workflow for Eduroam

### Daily Development:
1. **Morning:** Start with `npm run tunnel`
2. **Coding:** Make changes, test on phone
3. **Heavy UI work:** Switch to mobile hotspot for faster iteration
4. **Before committing:** Test on tunnel mode to ensure it works for others

### Weekly:
- Clear Expo Go cache once a week
- Update dependencies: `npm update`

### Monthly:
- Consider setting up a development build if you're still developing actively

---

## Why This Happens

### Eduroam Technical Details:
- Uses **802.1X authentication**
- Implements **AP Isolation** (client isolation)
- Blocks **peer-to-peer communication**
- Prevents **port scanning between devices**
- This is a **security feature**, not a bug

### What's blocked:
- Direct device-to-device connections
- Local IP communication (192.168.x.x)
- Metro bundler access (port 8081)
- WebSocket connections (for hot reload)

### What works:
- Internet access (external servers)
- VPN tunnels (like Expo tunnel)
- External services (APIs, cloud functions)

---

## Alternative: Set Up Local Network Bridge

**Advanced users only** - Create a software bridge:

1. **Install Tailscale** (VPN mesh network)
   - On laptop: Install Tailscale
   - On phone: Install Tailscale app
   - Both devices connect to same Tailscale network
   - Use Tailscale IP for Expo

2. **Use ngrok** (similar to Expo tunnel)
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start Metro bundler
   npm start
   
   # In another terminal, tunnel port 8081
   ngrok http 8081
   
   # Use ngrok URL in Expo Go
   ```

---

## Summary

**For 99% of eduroam development, use:**

```bash
npm run tunnel
```

**When you need speed for UI work:**
- Switch to mobile hotspot
- Or use USB connection (Android)

**For long-term projects:**
- Set up a development build with EAS

---

## Need Help?

- Expo docs: https://docs.expo.dev/more/expo-cli/
- Eduroam at your university: Contact IT helpdesk
- Expo forums: https://forums.expo.dev/
- This project's issues: (your repo URL)

