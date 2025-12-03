
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import fs from "fs";
function safeLoadEnv(mode: string) {
  try {
    return loadEnv(mode, process.cwd(), "");
  } catch (error) {
    console.warn("[vite.config] Unable to read .env file, falling back to defaults.", error);
    return {};
  }
}

function getEnvVariables(mode: string) {
  const ENVS = {
    production: {
      API_BASE_URL: "http://localhost:3000",
    },
  };
  return ENVS[mode as keyof typeof ENVS] || ENVS.production;
}

export default defineConfig(({ mode }) => {
  const env = safeLoadEnv(mode);
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@interfaces": path.resolve(__dirname, "src/interfaces"),
        "@stores": path.resolve(__dirname, "src/stores"),
        "@queries": path.resolve(__dirname, "src/queries"),
        "@core": path.resolve(__dirname, "src/core"),
        "@styles": path.resolve(__dirname, "src/styles"),
        "@providers": path.resolve(__dirname, "src/providers"),
        "react-is": "react-is",
        react: "react",
        "react-dom": "react-dom",
      },
    },
    server: {
      port: 5108,
      open: true,
      host: true,
      https: {
        key: fs.readFileSync(path.resolve(__dirname, "certs/localhost-key.pem")),
        cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost.pem")),
      },
      proxy: {
        // Proxy Kratos requests to production Kratos (only in dev)
        // This allows dev to use same domain (localhost:5108) for cookies
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "^/kratos/.*": {
          target: "https://auth.foxia.vn",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            // Remove /kratos prefix and forward to Kratos
            const newPath = path.replace(/^\/kratos/, "");
            console.log(`[Vite Proxy] Rewriting ${path} -> ${newPath}`);
            return newPath;
          },
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log(`[Vite Proxy] Proxying ${req.method} ${req.url} to https://auth.foxia.vn${proxyReq.path}`);
            });
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy] Error proxying ${req.url}:`, err);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log(`[Vite Proxy] Response ${proxyRes.statusCode} for ${req.url}`);
              // Rewrite Set-Cookie domain from auth.foxia.vn to localhost
              const setCookieHeaders = proxyRes.headers["set-cookie"];
              if (setCookieHeaders) {
                const rewritten = Array.isArray(setCookieHeaders)
                  ? setCookieHeaders
                  : [setCookieHeaders];
                proxyRes.headers["set-cookie"] = rewritten.map((cookie) => {
                  const newCookie = cookie.replace(/domain=auth\.foxia\.vn/gi, "domain=localhost");
                  console.log(
                    `[Vite Proxy] Rewriting cookie: ${cookie.substring(0, 50)}... -> ${newCookie.substring(
                      0,
                      50
                    )}...`
                  );
                  return newCookie;
                });
              }
            });
          },
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            "primary-color": "#1890ff",
            "border-radius-base": "4px",
            "text-color": "#000",
            "body-background": "#ffffff",
          },
          javascriptEnabled: true,
        },
      },
    },
    define: {
      "process.env": {
        ...getEnvVariables(env.REACT_APP_APP_MODE),
        API_BASE_URL: process.env.API_BASE_URL || "/",
      },
    },
  };
});
