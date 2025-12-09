import type { StorybookConfig } from '@storybook/react-vite';
import { dirname } from "path"
import { fileURLToPath } from "url"
import tailwindcss from '@tailwindcss/vite'

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding')
  ],
  framework: getAbsolutePath('@storybook/react-vite'),
  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());
    // Remove vite-plugin-dts from Storybook build (it's only needed for library build)
    config.plugins = config.plugins.filter(
      (plugin) => plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name !== 'vite:dts'
    );
    return config;
  }
};

export default config;