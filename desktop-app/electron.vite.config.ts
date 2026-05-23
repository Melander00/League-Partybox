import react from "@vitejs/plugin-react"
import { defineConfig } from "electron-vite"
import { resolve } from "path"

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@main": resolve("src/main")
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@main": resolve("src/main")
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@shared": resolve("src/shared"),
        "@app": resolve("src/renderer/app/src")
      }
    },
    plugins: [react()]
  }
})
