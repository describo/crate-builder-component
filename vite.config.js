import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/crate-builder/index.js'),
            name: 'CrateBuilderWC',
            // fileName: (format) => `my-lib.${format}.js`
        },
        // rollupOptions: {
        //     // make sure to externalize deps that shouldn't be bundled
        //     // into your library
        //     external: ['vue'],
        //     output: {
        //         // Provide global variables to use in the UMD build
        //         // for externalized deps
        //         globals: {
        //             vue: 'Vue'
        //         }
        //     }
        // }
    },
    plugins: [
        vue(
        /*    {
            template: {
                compilerOptions: {
                    // treat all components that includes "-" as custom elements
                    isCustomElement: tag => tag.startsWith('el-'),
                },
            },
        }*/
        ),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})