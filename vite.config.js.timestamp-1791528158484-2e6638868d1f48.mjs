// vite.config.js
import { defineConfig } from "file:///C:/Users/Ftech/Downloads/point-of-sales-main/point-of-sales/node_modules/vite/dist/node/index.js";
import laravel from "file:///C:/Users/Ftech/Downloads/point-of-sales-main/point-of-sales/node_modules/laravel-vite-plugin/dist/index.js";
import react from "file:///C:/Users/Ftech/Downloads/point-of-sales-main/point-of-sales/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    laravel({
      input: "resources/js/app.jsx",
      refresh: true
    }),
    react()
  ],
  build: {
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor": ["react", "react-dom", "@inertiajs/react"],
          "icons": ["@tabler/icons-react"],
          "charts": ["chart.js"],
          "utils": ["react-hot-toast", "sweetalert2"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxGdGVjaFxcXFxEb3dubG9hZHNcXFxccG9pbnQtb2Ytc2FsZXMtbWFpblxcXFxwb2ludC1vZi1zYWxlc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRnRlY2hcXFxcRG93bmxvYWRzXFxcXHBvaW50LW9mLXNhbGVzLW1haW5cXFxccG9pbnQtb2Ytc2FsZXNcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0Z0ZWNoL0Rvd25sb2Fkcy9wb2ludC1vZi1zYWxlcy1tYWluL3BvaW50LW9mLXNhbGVzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgbGFyYXZlbCBmcm9tICdsYXJhdmVsLXZpdGUtcGx1Z2luJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW1xuICAgICAgICBsYXJhdmVsKHtcbiAgICAgICAgICAgIGlucHV0OiAncmVzb3VyY2VzL2pzL2FwcC5qc3gnLFxuICAgICAgICAgICAgcmVmcmVzaDogdHJ1ZSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlYWN0KCksXG4gICAgXSxcbiAgICBidWlsZDoge1xuICAgICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgICAgICAgICAndmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAnQGluZXJ0aWFqcy9yZWFjdCddLFxuICAgICAgICAgICAgICAgICAgICAnaWNvbnMnOiBbJ0B0YWJsZXIvaWNvbnMtcmVhY3QnXSxcbiAgICAgICAgICAgICAgICAgICAgJ2NoYXJ0cyc6IFsnY2hhcnQuanMnXSxcbiAgICAgICAgICAgICAgICAgICAgJ3V0aWxzJzogWydyZWFjdC1ob3QtdG9hc3QnLCAnc3dlZXRhbGVydDInXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStXLFNBQVMsb0JBQW9CO0FBQzVZLE9BQU8sYUFBYTtBQUNwQixPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ0osT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBLElBQ2IsQ0FBQztBQUFBLElBQ0QsTUFBTTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNILHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNKLGNBQWM7QUFBQSxVQUNWLFVBQVUsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDbkQsU0FBUyxDQUFDLHFCQUFxQjtBQUFBLFVBQy9CLFVBQVUsQ0FBQyxVQUFVO0FBQUEsVUFDckIsU0FBUyxDQUFDLG1CQUFtQixhQUFhO0FBQUEsUUFDOUM7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
