# Friendly — phone-first chat + light social (MVP)

Node.js + Express 5 + Socket.io, JSON file store (`data.json`), uploads in `uploads/`. No build step.

## Run
    npm install
    PORT=3300 node server.js     # http://localhost:3300

Demo accounts (seeded on first boot): **demo1 / Demo1234!**, **demo2 / Demo1234!**
Reset everything: stop the server, delete `data.json` and `uploads/*`.

## Public HTTPS (needed on iPhone: mic/camera only work over HTTPS)
    cloudflared tunnel --url http://localhost:3300     # or: npx localtunnel --port 3300
Or deploy to Render/Railway/Fly (Web Service, `npm start`, persistent disk for data.json + uploads).

## Features
Auth (username/email + password, bcrypt, httpOnly cookie session) · profiles (name, bio, avatar upload / initials) ·
people search + friend requests + "Message" · realtime DMs with typing, online dot, read ticks (✓✓) · photo messages ·
voice notes (MediaRecorder, audio/mp4 on iPhone) · group chats · chat + message search · feed (text/image posts, likes, comments) ·
1:1 voice/video calls via WebRTC (STUN only — may fail on strict mobile networks without a TURN server) · settings/logout.
