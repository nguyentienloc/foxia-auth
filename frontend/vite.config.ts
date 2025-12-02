
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

function getEnvVariables(mode: string) {
  const ENVS = {
    production: {
      API_BASE_URL: "http://localhost:3000",
    },
  };
  return ENVS[mode as keyof typeof ENVS] || ENVS.production;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
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
