import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (id.includes('/firebase/'))
                        return 'firebase';
                    if (id.includes('/react/') ||
                        id.includes('/react-dom/') ||
                        id.includes('/react-router/') ||
                        id.includes('/react-router-dom/') ||
                        id.includes('/scheduler/') ||
                        // Libs que importan React van acá para evitar ciclos vendor <-> react-vendor.
                        id.includes('/qrcode.react/')) {
                        return 'react-vendor';
                    }
                    if (id.includes('/react-hook-form/') ||
                        id.includes('/@hookform/') ||
                        id.includes('/zod/')) {
                        return 'forms';
                    }
                    if (id.includes('/dayjs/'))
                        return 'dayjs';
                    if (id.includes('/lucide-react/') ||
                        id.includes('/sonner/') ||
                        id.includes('/clsx/') ||
                        id.includes('/tailwind-merge/')) {
                        return 'ui-vendor';
                    }
                    return 'vendor';
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
