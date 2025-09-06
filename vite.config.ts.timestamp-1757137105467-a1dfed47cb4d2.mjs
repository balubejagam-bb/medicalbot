// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
  const plugins = [react()];
  if (mode === "development") {
    const tagger = componentTagger();
    if (Array.isArray(tagger)) {
      plugins.push(...tagger);
    } else {
      plugins.push(tagger);
    }
  }
  return {
    server: {
      host: "::",
      port: 8080
      // https: false, // Set to true for HTTPS in production
      // For camera access in development, you can use:
      // https: {
      //   key: fs.readFileSync('path/to/private.key'),
      //   cert: fs.readFileSync('path/to/certificate.crt')
      // }
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICd2aXRlJztcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBwbHVnaW5zOiAoUGx1Z2luIHwgUGx1Z2luW10pW10gPSBbcmVhY3QoKV07XHJcbiAgXHJcbiAgaWYgKG1vZGUgPT09ICdkZXZlbG9wbWVudCcpIHtcclxuICAgIGNvbnN0IHRhZ2dlciA9IGNvbXBvbmVudFRhZ2dlcigpO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodGFnZ2VyKSkge1xyXG4gICAgICBwbHVnaW5zLnB1c2goLi4udGFnZ2VyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBsdWdpbnMucHVzaCh0YWdnZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICAgIC8vIGh0dHBzOiBmYWxzZSwgLy8gU2V0IHRvIHRydWUgZm9yIEhUVFBTIGluIHByb2R1Y3Rpb25cclxuICAgICAgLy8gRm9yIGNhbWVyYSBhY2Nlc3MgaW4gZGV2ZWxvcG1lbnQsIHlvdSBjYW4gdXNlOlxyXG4gICAgICAvLyBodHRwczoge1xyXG4gICAgICAvLyAgIGtleTogZnMucmVhZEZpbGVTeW5jKCdwYXRoL3RvL3ByaXZhdGUua2V5JyksXHJcbiAgICAgIC8vICAgY2VydDogZnMucmVhZEZpbGVTeW5jKCdwYXRoL3RvL2NlcnRpZmljYXRlLmNydCcpXHJcbiAgICAgIC8vIH1cclxuICAgIH0sXHJcbiAgICBwbHVnaW5zLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sVUFBaUMsQ0FBQyxNQUFNLENBQUM7QUFFL0MsTUFBSSxTQUFTLGVBQWU7QUFDMUIsVUFBTSxTQUFTLGdCQUFnQjtBQUMvQixRQUFJLE1BQU0sUUFBUSxNQUFNLEdBQUc7QUFDekIsY0FBUSxLQUFLLEdBQUcsTUFBTTtBQUFBLElBQ3hCLE9BQU87QUFDTCxjQUFRLEtBQUssTUFBTTtBQUFBLElBQ3JCO0FBQUEsRUFDRjtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU9SO0FBQUEsSUFDQTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
