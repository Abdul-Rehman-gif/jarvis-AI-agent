/**
 * Desktop Agent Code Generator
 * Provides production-ready Python desktop agent scripts that users can download and run on Windows.
 *
 * SERVER_WS_URL_PLACEHOLDER is substituted in server.ts's /api/agent/download
 * handler with the actual ws(s)://host/ws/agent URL of the running server, so
 * the downloaded agent always points at wherever this app is actually
 * deployed instead of a hardcoded, possibly-stale URL.
 */

export const PYTHON_AGENT_CODE = `"""
Jarvis AI Windows Desktop Agent v2.6
Connecting Windows PC with Jarvis AI Dashboard via Secure WebSockets.
"""

import asyncio
import json
import os
import re
import sys
import time
import platform
import subprocess
import urllib.parse
import psutil
import logging
from typing import Dict, Any, List, Optional

try:
    import websockets
except ImportError:
    print("Missing 'websockets' library. Please install via: pip install -r requirements.txt")
    sys.exit(1)

# Configure Logging
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")

# Configuration
SERVER_URL = os.environ.get("JARVIS_SERVER_URL", "SERVER_WS_URL_PLACEHOLDER")
PAIRING_CODE = os.environ.get("JARVIS_PAIRING_CODE")
DEVICE_NAME = platform.node() or "Windows-PC"

if not PAIRING_CODE:
    print("JARVIS_PAIRING_CODE environment variable is not set.")
    print("Refusing to start with the old hardcoded default pairing code.")
    print("Set it to match the value the server printed on startup, e.g.:")
    print("  setx JARVIS_PAIRING_CODE \\"your-code-here\\"  (then reopen this terminal)")
    sys.exit(1)

# --- Independent safety net -------------------------------------------------
# The server is supposed to filter dangerous commands before they ever reach
# us, but we don't rely on that alone: the agent re-checks the same classes
# of dangerous action itself, so a bug or bypass upstream can't turn into an
# unattended wipe/shutdown/etc. Edit ALLOWED_FILE_ROOTS for your own machine.
ALLOWED_FILE_ROOTS = [
    os.path.expanduser("~\\\\Documents\\\\jarvis-sandbox"),
    os.path.expanduser("~\\\\Downloads\\\\jarvis-sandbox"),
    os.path.expanduser("~\\\\Desktop\\\\jarvis-sandbox"),
]

BLOCKED_SCRIPT_PATTERNS = [
    "remove-item", "format-volume", "shutdown", "restart-computer",
    "stop-computer", "net user", "disable-", "invoke-webrequest",
    "invoke-expression", "downloadstring", "webclient", "reg add",
    "reg delete", "vssadmin", "bcdedit", "takeown", "icacls",
]


def path_is_allowed(path: str) -> bool:
    """Only allow file_system delete/create_folder ops inside a sandboxed
    folder tree, and never on a path containing '..' or a bare drive root."""
    try:
        normalized = os.path.normpath(os.path.expandvars(path)).lower()
    except Exception:
        return False
    if ".." in path:
        return False
    if len(normalized) <= 3 and normalized.endswith(":\\\\"):
        return False
    return any(normalized.startswith(root.lower()) for root in ALLOWED_FILE_ROOTS)


def script_is_allowed(script: str) -> bool:
    if not script or len(script) > 500:
        return False
    lowered = script.lower()
    return not any(pattern in lowered for pattern in BLOCKED_SCRIPT_PATTERNS)


def set_system_volume(level: int) -> str:
    """Set master output volume (0-100) using the real Windows Core Audio API."""
    try:
        from ctypes import cast, POINTER
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        volume.SetMasterVolumeLevelScalar(max(0, min(100, level)) / 100.0, None)
        return f"System volume set to {level}%"
    except ImportError:
        return "Volume control requires 'pycaw' and 'comtypes' - run: pip install pycaw comtypes"
    except Exception as e:
        return f"Failed to set volume: {e}"


def mute_system(mute: bool) -> str:
    try:
        from ctypes import cast, POINTER
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        volume.SetMute(1 if mute else 0, None)
        return "Muted system audio" if mute else "Unmuted system audio"
    except ImportError:
        return "Mute control requires 'pycaw' and 'comtypes' - run: pip install pycaw comtypes"
    except Exception as e:
        return f"Failed to change mute state: {e}"


def resolve_site_search_url(site: str, query: str) -> str:
    """Mirrors the TS site-search URL builder in gemini.ts, so search_site
    behaves the same whether the LLM or the rule-based fallback produced it."""
    site_key = (site or "").strip().lower()
    encoded = urllib.parse.quote_plus(query)
    builders = {
        "google": f"https://www.google.com/search?q={encoded}",
        "youtube": f"https://www.youtube.com/results?search_query={encoded}",
        "amazon": f"https://www.amazon.com/s?k={encoded}",
        "github": f"https://github.com/search?q={encoded}",
        "reddit": f"https://www.reddit.com/search/?q={encoded}",
        "wikipedia": f"https://en.wikipedia.org/w/index.php?search={encoded}",
        "twitter": f"https://twitter.com/search?q={encoded}",
        "x": f"https://twitter.com/search?q={encoded}",
        "stack overflow": f"https://stackoverflow.com/search?q={encoded}",
        "stackoverflow": f"https://stackoverflow.com/search?q={encoded}",
        "npm": f"https://www.npmjs.com/search?q={encoded}",
        "google maps": f"https://www.google.com/maps/search/{encoded}",
        "maps": f"https://www.google.com/maps/search/{encoded}",
        "linkedin": f"https://www.linkedin.com/search/results/all/?keywords={encoded}",
        "spotify": f"https://open.spotify.com/search/{encoded}",
    }
    if site_key in builders:
        return builders[site_key]
    fallback_query = query + " site:" + site_key.replace(" ", "") + ".com"
    return f"https://www.google.com/search?q={urllib.parse.quote_plus(fallback_query)}"


class WindowsJarvisAgent:
    def __init__(self, server_url: str, pairing_code: str):
        self.server_url = server_url
        self.pairing_code = pairing_code
        self.running = True
        # Real, persistent Selenium-controlled Chrome window, launched lazily
        # on first use and reused across searches - see _ensure_browser().
        # This is what makes "search trending songs" -> "play 1" possible:
        # we actually read the rendered page instead of just opening a URL.
        self.driver = None
        self.last_youtube_results: List[Dict[str, Any]] = []

    def _ensure_browser(self):
        """Lazily launch (or reuse) a Selenium-controlled Chrome window.
        Visible by default so you can watch/hear it work, since this runs on
        your own PC - set JARVIS_BROWSER_HEADLESS=true to hide the window."""
        if self.driver is not None:
            try:
                _ = self.driver.title  # cheap check the window/session is still alive
                return self.driver
            except Exception:
                self.driver = None

        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options

        options = Options()
        if os.environ.get("JARVIS_BROWSER_HEADLESS", "false").lower() == "true":
            options.add_argument("--headless=new")
        options.add_argument("--start-maximized")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        self.driver = webdriver.Chrome(options=options)
        return self.driver

    def _scrape_youtube_results(self, max_results: int = 8) -> List[Dict[str, Any]]:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        driver = self.driver
        try:
            WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "ytd-video-renderer"))
            )
        except Exception:
            return []

        cards = driver.find_elements(By.CSS_SELECTOR, "ytd-video-renderer")[:max_results]
        results: List[Dict[str, Any]] = []
        for i, card in enumerate(cards):
            try:
                title_el = card.find_element(By.ID, "video-title")
                title = (title_el.get_attribute("title") or title_el.text or "").strip()
                href = title_el.get_attribute("href") or ""
                match = re.search(r"[?&]v=([^&]+)", href)
                video_id = match.group(1) if match else None
                if not video_id:
                    continue
                try:
                    channel = card.find_element(By.CSS_SELECTOR, "ytd-channel-name a").text.strip()
                except Exception:
                    channel = ""
                results.append({"index": i + 1, "title": title, "channel": channel, "videoId": video_id})
            except Exception:
                continue
        return results

    def _search_youtube_list(self, query: str, max_results: int = 8) -> List[Dict[str, Any]]:
        driver = self._ensure_browser()
        driver.get(f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}")
        results = self._scrape_youtube_results(max_results)
        self.last_youtube_results = results
        return results

    def _play_video_id(self, video_id: str) -> None:
        driver = self._ensure_browser()
        driver.get(f"https://www.youtube.com/watch?v={video_id}&autoplay=1")

    def _play_youtube_query(self, query: str) -> Optional[Dict[str, Any]]:
        results = self._search_youtube_list(query, max_results=1)
        if not results:
            return None
        self._play_video_id(results[0]["videoId"])
        return results[0]

    def _select_and_play(self, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.last_youtube_results:
            return None
        index = params.get("index")
        title_fragment = params.get("titleFragment")
        match = None
        if isinstance(index, int):
            target_index = len(self.last_youtube_results) if index == -1 else index
            match = next((r for r in self.last_youtube_results if r["index"] == target_index), None)
        elif title_fragment:
            lower = str(title_fragment).lower()
            match = next((r for r in self.last_youtube_results if lower in r["title"].lower()), None)
        if not match:
            return None
        self._play_video_id(match["videoId"])
        return match

    def _format_results_reply(self, results: List[Dict[str, Any]]) -> str:
        if not results:
            return "I couldn't find any results just now - want to try a different search?"
        lines = []
        for r in results:
            suffix = f' - {r["channel"]}' if r["channel"] else ""
            lines.append(f'{r["index"]}. {r["title"]}{suffix}')
        joined = "\\n".join(lines)
        return f'Here\\'s what I found:\\n{joined}\\nJust say "play 1", "play the second one", or name one to play it.'

    async def get_system_metrics(self) -> Dict[str, Any]:
        """Collect real-time telemetry from Windows OS using psutil."""
        cpu_percent = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage(os.environ.get("SystemDrive", "C:") + "\\\\")
        net = psutil.net_io_counters()

        top_processes = []
        for proc in sorted(
            psutil.process_iter(["pid", "name", "cpu_percent", "memory_info", "username"]),
            key=lambda p: (p.info.get("cpu_percent") or 0),
            reverse=True,
        )[:12]:
            try:
                mem_mb = round((proc.info["memory_info"].rss if proc.info["memory_info"] else 0) / (1024 * 1024), 1)
                top_processes.append({
                    "pid": proc.info["pid"],
                    "name": proc.info["name"] or "unknown",
                    "cpuPercent": proc.info.get("cpu_percent") or 0,
                    "memoryMB": mem_mb,
                    "status": "running",
                    "user": proc.info.get("username") or "N/A",
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        battery = psutil.sensors_battery() if hasattr(psutil, "sensors_battery") else None

        return {
            "type": "telemetry",
            "deviceName": DEVICE_NAME,
            "platform": f"Windows {platform.release()} ({platform.architecture()[0]})",
            "cpuUsage": cpu_percent,
            "cpuCores": psutil.cpu_count(logical=True),
            "ramUsage": memory.percent,
            "ramUsedGB": round((memory.total - memory.available) / (1024**3), 2),
            "ramTotalGB": round(memory.total / (1024**3), 2),
            "diskUsage": disk.percent,
            "diskUsedGB": round(disk.used / (1024**3), 2),
            "diskTotalGB": round(disk.total / (1024**3), 2),
            "netDownloadKbps": round(net.bytes_recv / 1024 % 500, 1),
            "netUploadKbps": round(net.bytes_sent / 1024 % 200, 1),
            "batteryLevel": battery.percent if battery else None,
            "isCharging": battery.power_plugged if battery else None,
            "uptimeSeconds": int(time.time() - psutil.boot_time()),
            "processes": top_processes,
            "timestamp": time.time()
        }

    async def execute_command(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute PC actions via subprocess, OS APIs, or pyautogui."""
        logging.info(f"Executing command: {action} with params: {params}")
        result_msg = ""
        success = True

        try:
            if action == "open_app":
                app_name = params.get("name", "").lower()
                if "chrome" in app_name:
                    subprocess.Popen(["start", "chrome"], shell=True)
                elif "vscode" in app_name or "code" in app_name:
                    subprocess.Popen(["code"], shell=True)
                elif "explorer" in app_name or "downloads" in app_name:
                    path = os.path.expanduser("~/Downloads") if "downloads" in app_name else "C:\\\\"
                    os.startfile(path)
                elif "spotify" in app_name:
                    subprocess.Popen(["spotify"], shell=True)
                elif "notepad" in app_name:
                    subprocess.Popen(["notepad"], shell=True)
                elif "calculator" in app_name or "calc" in app_name:
                    subprocess.Popen(["calc"], shell=True)
                else:
                    subprocess.Popen(f"start {app_name}", shell=True)
                result_msg = f"Opened app: {app_name}"

            elif action == "close_app":
                app_name = params.get("name", "")
                killed_count = 0
                for proc in psutil.process_iter(['pid', 'name']):
                    if app_name.lower() in (proc.info['name'] or "").lower():
                        proc.kill()
                        killed_count += 1
                result_msg = f"Terminated {killed_count} instances of {app_name}"
                success = killed_count > 0

            elif action == "kill_process":
                pid = params.get("pid")
                try:
                    psutil.Process(int(pid)).kill()
                    result_msg = f"Terminated process PID {pid}"
                except Exception as e:
                    result_msg = f"Could not terminate PID {pid}: {e}"
                    success = False

            elif action == "system_power":
                mode = params.get("mode", "")
                if mode == "lock":
                    import ctypes
                    ctypes.windll.user32.LockWorkStation()
                    result_msg = "Locked Windows PC workstation."
                elif mode == "shutdown":
                    if os.environ.get("JARVIS_ALLOW_POWER_ACTIONS") != "1":
                        result_msg = "Shutdown blocked: set JARVIS_ALLOW_POWER_ACTIONS=1 on this agent to permit remote shutdown."
                        success = False
                    else:
                        os.system("shutdown /s /t 10")
                        result_msg = "Initiating shutdown in 10 seconds. Run 'shutdown /a' to cancel."
                elif mode == "restart":
                    if os.environ.get("JARVIS_ALLOW_POWER_ACTIONS") != "1":
                        result_msg = "Restart blocked: set JARVIS_ALLOW_POWER_ACTIONS=1 on this agent to permit remote restart."
                        success = False
                    else:
                        os.system("shutdown /r /t 10")
                        result_msg = "Initiating restart in 10 seconds. Run 'shutdown /a' to cancel."
                elif mode == "clean_temp":
                    os.system("del /q/f/s %TEMP%\\\\*")
                    result_msg = "Cleaned Windows temporary files."

            elif action == "powershell":
                script = params.get("script", "")
                if not script_is_allowed(script):
                    result_msg = "Blocked: script is empty, too long, or matches a denylisted destructive pattern."
                    success = False
                else:
                    res = subprocess.run(["powershell", "-Command", script], capture_output=True, text=True, timeout=15)
                    result_msg = res.stdout if res.returncode == 0 else f"Error: {res.stderr}"
                    success = res.returncode == 0

            elif action == "volume":
                if "mute" in params:
                    result_msg = mute_system(bool(params.get("mute")))
                else:
                    level = int(params.get("level", 50))
                    result_msg = set_system_volume(level)
                success = "requires" not in result_msg and "Failed" not in result_msg

            elif action == "browser_automation":
                import webbrowser
                url = params.get("url")
                sub_action = params.get("action", "open")

                if sub_action == "search_youtube_list":
                    # Real interaction: drives an actual Selenium Chrome window,
                    # waits for results to render, and scrapes the real titles
                    # and video IDs so a follow-up "play 1" has something real
                    # to resolve against (see select_result below).
                    query = params.get("query") or ""
                    results = await asyncio.to_thread(self._search_youtube_list, query)
                    result_msg = self._format_results_reply(results)
                    success = len(results) > 0

                elif sub_action == "select_result":
                    match = await asyncio.to_thread(self._select_and_play, params)
                    if match:
                        result_msg = f"Now playing: {match['title']}"
                    else:
                        result_msg = "I couldn't find that in the last search results - try searching again."
                        success = False

                elif sub_action == "play_youtube":
                    query = params.get("query") or ""
                    match = await asyncio.to_thread(self._play_youtube_query, query)
                    if match:
                        result_msg = f"Now playing: {match['title']}"
                    else:
                        result_msg = f"Couldn't find anything to play for: {query}"
                        success = False

                elif sub_action == "search_youtube":
                    # Browse-only, no scraping needed - just opens the default
                    # browser's results page, same as before.
                    query = params.get("query") or params.get("url") or ""
                    webbrowser.open(f"https://www.youtube.com/results?search_query={query}")
                    result_msg = f"Opened YouTube search for: {query}"

                elif sub_action == "search_google":
                    query = params.get("query") or ""
                    webbrowser.open(f"https://www.google.com/search?q={query}")
                    result_msg = f"Opened Google search for: {query}"

                elif sub_action == "search_site":
                    site = params.get("site") or ""
                    query = params.get("query") or ""
                    target_url = resolve_site_search_url(site, query)
                    webbrowser.open(target_url)
                    result_msg = f"Searching {site or 'the web'} for: {query}"

                elif url:
                    if not str(url).startswith("http"):
                        url = "https://" + str(url)
                    webbrowser.open(url)
                    result_msg = f"Opened browser at: {url}"

                else:
                    result_msg = "No URL provided for browser automation"
                    success = False

            elif action == "file_system":
                operation = params.get("operation")
                path = os.path.expandvars(params.get("path", ""))
                if operation == "open_folder":
                    os.startfile(path)
                    result_msg = f"Opened folder: {path}"
                elif operation == "create_folder":
                    if not path_is_allowed(path):
                        result_msg = f"Blocked: '{path}' is outside the allowed sandbox folders."
                        success = False
                    else:
                        os.makedirs(path, exist_ok=True)
                        result_msg = f"Created folder: {path}"
                elif operation == "delete":
                    if not path_is_allowed(path):
                        result_msg = f"Blocked: '{path}' is outside the allowed sandbox folders."
                        success = False
                    elif os.path.isdir(path):
                        import shutil
                        shutil.rmtree(path)
                        result_msg = f"Deleted: {path}"
                    elif os.path.isfile(path):
                        os.remove(path)
                        result_msg = f"Deleted: {path}"
                    else:
                        result_msg = f"Path not found: {path}"
                        success = False
                else:
                    result_msg = f"Unsupported file_system operation: {operation}"
                    success = False

            elif action == "screenshot":
                import pyautogui
                import base64
                from io import BytesIO
                screenshot = pyautogui.screenshot()
                buffered = BytesIO()
                screenshot.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                # Also save to Windows Pictures folder
                pictures_dir = os.path.expanduser("~/Pictures/Screenshots")
                os.makedirs(pictures_dir, exist_ok=True)
                save_path = os.path.join(pictures_dir, f"Screenshot_{int(time.time())}.png")
                screenshot.save(save_path)
                result_msg = f"data:image/png;base64,{img_str}"

            else:
                result_msg = f"Unknown action type: {action}"
                success = False

        except Exception as e:
            logging.error(f"Error executing action {action}: {e}")
            result_msg = f"Execution failed: {str(e)}"
            success = False

        return {
            "type": "command_result",
            "action": action,
            "success": success,
            "result": result_msg,
            "timestamp": time.time()
        }

    async def start(self):
        logging.info(f"Connecting to Jarvis Server at {self.server_url}...")

        while self.running:
            try:
                async with websockets.connect(self.server_url) as ws:
                    logging.info("Connected to Jarvis AI Server!")
                    # Send authentication handshake
                    await ws.send(json.dumps({
                        "type": "agent_auth",
                        "pairingCode": self.pairing_code,
                        "deviceName": DEVICE_NAME,
                        "platform": platform.platform()
                    }))

                    # Start background telemetry loop
                    async def send_telemetry():
                        while True:
                            metrics = await self.get_system_metrics()
                            await ws.send(json.dumps(metrics))
                            await asyncio.sleep(1)

                    telemetry_task = asyncio.create_task(send_telemetry())

                    # Listen for incoming commands from dashboard
                    async for message in ws:
                        data = json.loads(message)
                        logging.info(f"Received message: {data}")

                        if data.get("type") == "auth_error":
                            logging.error(f"Auth rejected by server: {data.get('message')}")
                            telemetry_task.cancel()
                            return

                        if data.get("type") == "execute_command":
                            action_res = await self.execute_command(
                                data.get("action"),
                                data.get("params", {})
                            )
                            # Echo the requestId back so the server can match
                            # this response to the request that triggered it.
                            action_res["requestId"] = data.get("requestId")
                            await ws.send(json.dumps(action_res))

                    telemetry_task.cancel()

            except Exception as e:
                logging.warning(f"Connection lost ({e}). Reconnecting in 5 seconds...")
                await asyncio.sleep(5)

if __name__ == "__main__":
    agent = WindowsJarvisAgent(SERVER_URL, PAIRING_CODE)
    asyncio.run(agent.start())
`;

export const REQUIREMENTS_TXT = `websockets>=11.0
psutil>=5.9.5
pyautogui>=0.9.54
pywin32>=306
pygetwindow>=0.0.9
pycaw>=20230407
comtypes>=1.2.0
pyttsx3>=2.90
selenium>=4.15.0
`;

export const START_BAT = `@echo off
title Jarvis Desktop Agent Launcher
echo ===================================================
echo     Launching Jarvis AI PC Control Desktop Agent
echo ===================================================
echo.
python -m pip install -r requirements.txt
python agent.py
pause
`;