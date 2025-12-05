
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
  
  // Configuration from env
  const BACKEND_URL = env.VITE_BACKEND_API_URL || "http://localhost:3000";
  const KRATOS_URL = env.VITE_KRATOS_URL || "https://auth.foxia.vn";
  const DEBUG_PROXY = env.VITE_DEBUG_PROXY === "true";

  console.log(`[Vite Config] Mode: ${mode}`);
  console.log(`[Vite Config] Backend URL: ${BACKEND_URL}`);
  console.log(`[Vite Config] Kratos URL: ${KRATOS_URL}`);
  console.log(`[Vite Config] Debug Proxy: ${DEBUG_PROXY}`);

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
        // Proxy API requests to NestJS Backend
        "/api": {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy] Error proxying ${req.url}:`, err);
            });
          }
        },
        // Proxy Kratos requests
        "^/kratos/.*": {
          target: KRATOS_URL,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const newPath = path.replace(/^\/kratos/, "");
            if (DEBUG_PROXY) console.log(`[Vite Proxy] Rewriting ${path} -> ${newPath}`);
            return newPath;
          },
          configure: (proxy) => {
            if (DEBUG_PROXY) {
              proxy.on("proxyReq", (proxyReq, req) => {
                console.log(`[Vite Proxy] Proxying ${req.method} ${req.url} to ${KRATOS_URL}${proxyReq.path}`);
              });
            }
            
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy] Error proxying ${req.url}:`, err);
            });

            proxy.on("proxyRes", (proxyRes, req) => {
              if (DEBUG_PROXY) {
                console.log(`[Vite Proxy] Response ${proxyRes.statusCode} for ${req.url}`);
              }
              
              // Rewrite Set-Cookie domain from Kratos domain to localhost
              // This is crucial for authentication to work on localhost
              const setCookieHeaders = proxyRes.headers["set-cookie"];
              if (setCookieHeaders) {
                const kratosDomain = new URL(KRATOS_URL).hostname;
                const rewritten = Array.isArray(setCookieHeaders)
                  ? setCookieHeaders
                  : [setCookieHeaders];
                
                proxyRes.headers["set-cookie"] = rewritten.map((cookie) => {
                  // Regex to match domain attribute with the Kratos domain
                  const domainRegex = new RegExp(`domain=${kratosDomain.replace(/\./g, '\\.')}`, 'gi');
                  const newCookie = cookie.replace(domainRegex, "domain=localhost");
                  
                  if (DEBUG_PROXY && cookie !== newCookie) {
                    console.log(
                      `[Vite Proxy] Rewriting cookie domain: ${kratosDomain} -> localhost`
                    );
                  }
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
