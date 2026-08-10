# Jarvis AI Desktop Assistant

Jarvis is a personal AI assistant with a web-based chat and dashboard, built on top of Google's Gemini model for understanding natural language commands. It can hold a normal conversation, and it can also control a real Windows PC: opening applications, adjusting volume, taking screenshots, managing files, running approved PowerShell scripts, and searching or playing content on YouTube through a real, visible browser.

The project has two parts that run separately:

1. **The web server and dashboard** - a Node.js server with a React frontend. This is what you open in your browser to chat with Jarvis, view system status, and manage settings.
2. **The desktop agent** - a Python script that runs on the Windows PC you actually want Jarvis to control. It connects to the web server over a secure WebSocket connection and carries out the commands the server sends it.

You need both running for full functionality. The dashboard works on its own for conversation and information questions (date, time, weather), but any command that touches your actual PC - opening an app, taking a screenshot, searching YouTube - requires the desktop agent to be running and paired.

## How it works

When you type or speak a command, it goes to the server, which uses Gemini to figure out what you're asking for. If it's just a question, the server answers directly. If it's a command that needs to run on your PC, the server sends it to the paired desktop agent over the WebSocket connection, waits for the agent to actually do it, and reports back what happened. Commands considered risky - shutting down the PC, deleting files, running a PowerShell script - are held back and only run once you explicitly confirm them in the dashboard.

## Requirements

To run the web server:
- Node.js version 18 or later
- A Gemini API key from Google AI Studio (free tier is enough for personal use)

To run the desktop agent (only needed if you want Jarvis to control a real PC):
- Windows 10 or 11
- Python 3.9 or later
- Google Chrome installed (needed for the YouTube search and playback features)

## Part 1: Setting up the web server

1. Open a terminal in the project folder and install dependencies:

   ```
   npm install
   ```

2. Copy the example environment file and fill it in:

   ```
   copy .env.example .env.local
   ```

   Open `.env.local` in a text editor and set at least:

   - `GEMINI_API_KEY` - your Gemini API key. Without this, Jarvis still works using a simpler built-in command parser, but conversation quality and understanding of unusual phrasing will be noticeably more limited.
   - `JARVIS_API_KEY` - any long random string of your choosing. This protects your local server so that nothing else on your PC can send it commands without this key. If you leave it blank, the server will generate one automatically each time it starts and print it to the terminal, but it will change every restart, so setting your own is recommended.
   - `JARVIS_PAIRING_CODE` - any long random string of your choosing. This is the password the desktop agent uses to prove it's really your agent and not something else connecting to your server. It must match exactly between this file and the agent, so pick it now and remember it for Part 2.

   The other settings in `.env.example` have sensible defaults and are explained by the comments above each one; you generally will not need to change them for local use.

3. Start the server:

   ```
   npm run dev
   ```

4. Open a browser and go to `http://127.0.0.1:3000`. You should see the Jarvis dashboard. At this point you can already chat with Jarvis and ask general questions - PC control commands will report that no desktop agent is connected until you complete Part 2.

## Part 2: Setting up the desktop agent

The desktop agent must run on the actual Windows PC you want Jarvis to control. If your server and the PC you want to control are the same machine, just do this in a second terminal window on that same computer.

1. In the dashboard, open the **PC Desktop Agent** section in the left sidebar and click the download button. This gives you `agent.py`, `requirements.txt`, and `start.bat`, generated specifically for your running server.

2. Put these three files in a folder on the Windows PC you want to control.

3. Open a terminal in that folder and install the agent's Python dependencies:

   ```
   python -m pip install -r requirements.txt
   ```

4. Set two environment variables in that same terminal session, matching what you put in `.env.local` in Part 1:

   ```
   setx JARVIS_SERVER_URL "ws://127.0.0.1:3000/ws/agent"
   setx JARVIS_PAIRING_CODE "the-same-pairing-code-you-set-in-step-2-of-part-1"
   ```

   If your server is on a different machine than the one running the agent, replace `127.0.0.1` in the URL above with that machine's actual address on your network.

   After running `setx`, close and reopen the terminal window so the new values take effect.

5. Start the agent:

   ```
   start.bat
   ```

   or directly:

   ```
   python agent.py
   ```

   The terminal should print that it connected to the server and authenticated successfully. Back in the dashboard, the connection status should now show the agent as connected, and PC control commands will start working.

Keep this terminal window open while you want Jarvis to be able to control the PC. Closing it disconnects the agent; the dashboard will report it as no longer connected.

## Optional: WhatsApp messaging

Jarvis can open a WhatsApp chat with a message pre-filled, ready for you to review and send yourself - it never sends a message on its own. To use this by contact name instead of a raw phone number, copy `contacts.example.json` to `contacts.json` in the project root and fill in real names and phone numbers. This file is excluded from version control so your contacts are never committed.

## Optional: allowing remote restart and shutdown

By default, the desktop agent refuses restart and shutdown commands even if you confirm them in the dashboard, as an extra safety measure. To allow them, set `JARVIS_ALLOW_POWER_ACTIONS=1` in the environment on the agent machine before starting the agent. Leave this unset if you don't need remote power control.

## Security notes

- The server binds to `127.0.0.1` (localhost only) by default, meaning nothing outside your own computer can reach it. Only change this if you understand the risk and have proper authentication and encryption in front of it.
- Every request to the server's API requires the `JARVIS_API_KEY` you set above.
- The desktop agent independently re-checks file paths and PowerShell scripts against its own safety rules before running anything, even if a request somehow got past the server's checks.
- File delete and folder creation commands are restricted to a sandboxed folder under your Documents, Downloads, or Desktop; the agent will not touch system folders or other user profiles.
- Shutdown and restart are blocked by default, as described above.

## Project structure

```
server.ts                   Main server entry point and API routes
server/gemini.ts             Converts natural language into structured commands using Gemini
server/agentBridge.ts        In-memory state for the dashboard (processes, files, workflows, etc.)
server/wsAgentServer.ts      WebSocket bridge between the dashboard and the desktop agent
server/desktopAgentCode.ts   Generates the downloadable Python agent script
server/safety.ts             Safety checks applied before any command reaches the agent
server/weather.ts            Live weather lookups
server/whatsapp.ts           Resolves contact names to WhatsApp links
src/                          React frontend (dashboard, chat, and settings screens)
```

## Troubleshooting

**The dashboard says no desktop agent is connected.**
Make sure the agent terminal window is still open and shows a successful connection message. Confirm `JARVIS_PAIRING_CODE` is identical on both the server and the agent - a mismatch is the most common cause.

**Voice commands aren't recognized reliably.**
Voice input uses your browser's built-in speech recognition, which currently only works well in Chrome or Edge. Make sure microphone access is allowed for the site in your browser settings.

**YouTube search or playback doesn't work.**
These features open a real, visible Chrome window on the agent machine and require Chrome to be installed there. If you'd rather this window stay hidden, set `JARVIS_BROWSER_HEADLESS=true` in the agent's environment before starting it.

**A command was blocked with a safety message.**
This is expected behavior, not a bug. Certain actions - deleting files outside the sandboxed folders, running scripts that match a denylist of destructive patterns, shutdown and restart - are intentionally restricted. Review the Security notes section above if you need to adjust these limits for your own use.
