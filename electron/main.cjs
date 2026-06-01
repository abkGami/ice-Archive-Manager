const { app, BrowserWindow, Menu, shell, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const { spawn } = require("child_process");

const APP_TITLE = "ICE Archive Manager";
const DEFAULT_PORT = 5000;
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;
let serverPort = DEFAULT_PORT;
let serverUrl = null;
let isQuitting = false;
let hasBootstrapped = false;

function getAssetPath(...segments) {
  return path.join(app.getAppPath(), ...segments);
}

function loadEnvFile() {
  const envPath = getAssetPath(".env");
  console.log("Attempting to load .env from:", envPath);
  
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log(".env loaded successfully");
  } else {
    console.warn(
      ".env file not found. Creating a default .env in the app directory."
    );
    // Create a default .env file in the app resources if it doesn't exist
    const defaultEnv = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
NODE_ENV=production
APP_RUNTIME=desktop`;

    try {
      fs.writeFileSync(envPath, defaultEnv);
      console.log(".env created with placeholder values at:", envPath);
      console.log(
        "IMPORTANT: Please edit the .env file with your actual Supabase credentials."
      );
    } catch (err) {
      console.error("Failed to create .env file:", err);
    }
  }
}

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset < 20; offset += 1) {
    const port = startPort + offset;
    if (await checkPortAvailable(port)) {
      return port;
    }
  }

  throw new Error("No available port found for the desktop backend.");
}

function startDevServer(port) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const env = {
    ...process.env,
    PORT: String(port),
    APP_RUNTIME: "desktop",
    CORS_ALLOWED_ORIGINS: `http://localhost:${port},http://127.0.0.1:${port}`,
  };

  serverProcess = spawn(npmCommand, ["run", "dev"], {
    cwd: app.getAppPath(),
    env,
    stdio: "inherit",
  });

  serverProcess.on("exit", (code) => {
    if (!isQuitting) {
      console.error(`Backend process exited with code ${code ?? "unknown"}.`);
    }
  });
}

function startProdServer(port) {
  process.env.NODE_ENV = "production";
  process.env.PORT = String(port);
  process.env.APP_RUNTIME = "desktop";
  process.env.CORS_ALLOWED_ORIGINS = `http://localhost:${port},http://127.0.0.1:${port}`;

  const serverEntry = getAssetPath("dist", "index.cjs");
  require(serverEntry);
}

function waitForServer(url, timeoutMs = 30000) {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }

        scheduleRetry();
      });

      req.on("error", scheduleRetry);
    };

    const scheduleRetry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error("Timed out waiting for the backend to start."));
        return;
      }
      setTimeout(attempt, 500);
    };

    attempt();
  });
}

function updateWindowBackground() {
  if (!mainWindow) {
    return;
  }

  const backgroundColor = nativeTheme.shouldUseDarkColors
    ? "#0B1120"
    : "#F8F9FA";
  mainWindow.setBackgroundColor(backgroundColor);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: APP_TITLE,
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0B1120" : "#F8F9FA",
    icon: getAssetPath("client", "public", "logo.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowedOrigins = new Set([
      `http://localhost:${serverPort}`,
      `http://127.0.0.1:${serverPort}`,
    ]);
    const { origin } = new URL(url);
    if (allowedOrigins.has(origin)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedOrigins = new Set([
      `http://localhost:${serverPort}`,
      `http://127.0.0.1:${serverPort}`,
    ]);
    const { origin } = new URL(url);
    if (!allowedOrigins.has(origin)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  nativeTheme.on("updated", updateWindowBackground);
}

async function bootstrap() {
  try {
    console.log("Starting ICE Archive Manager...");
    loadEnvFile();

    const configuredPort = Number.parseInt(
      process.env.PORT || String(DEFAULT_PORT),
      10,
    );
    const shouldStartBackend =
      app.isPackaged || process.env.ELECTRON_START_SERVER === "1";
    if (shouldStartBackend) {
      serverPort = await findAvailablePort(configuredPort);
      console.log("Starting backend server on port:", serverPort);
      if (isDev) {
        startDevServer(serverPort);
      } else {
        startProdServer(serverPort);
      }
    } else {
      serverPort = configuredPort;
    }

    serverUrl = `http://127.0.0.1:${serverPort}`;
    console.log("Waiting for server to be ready at:", serverUrl);
    await waitForServer(serverUrl);

    createMainWindow();
    console.log("Loading UI from:", serverUrl);
    await mainWindow.loadURL(serverUrl);
    updateWindowBackground();
    hasBootstrapped = true;
    console.log("App started successfully");
  } catch (error) {
    console.error("Bootstrap failed:", error);
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "Failed to Start ICE Archive Manager",
      `Error: ${error.message}\n\nPlease check your .env file configuration and try again.\n\nApp directory: ${app.getAppPath()}`,
    );
    app.quit();
  }
}

app.setAppUserModelId("com.abkgami.ice-archive-manager");

// Remove the default menu bar (File, Edit, View, Window, Help)
Menu.setApplicationMenu(null);

app.on("before-quit", () => {
  isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (hasBootstrapped && serverUrl) {
      createMainWindow();
      await mainWindow.loadURL(serverUrl);
      updateWindowBackground();
      return;
    }

    await bootstrap();
  }
});

app
  .whenReady()
  .then(bootstrap)
  .catch((error) => {
    console.error("Failed to start desktop application:", error);
    app.quit();
  });
