const { withProjectBuildGradle, withAppBuildGradle, withSettingsGradle, withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withMapplsProjectGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('buildscript {') && !config.modResults.contents.includes('com.mappls.services:mappls-services')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*{/,
        `dependencies {\n        classpath("com.mappls.services:mappls-services:1.0.0")`
      );
    }
    
    // Add maven repository to all repositories blocks in build.gradle
    if (!config.modResults.contents.includes('maven.mappls.com')) {
      config.modResults.contents = config.modResults.contents.replace(
        /repositories\s*{/g,
        `repositories {\n        maven { url 'https://maven.mappls.com/repository/mappls/' }`
      );
    }
    return config;
  });
}

function withMapplsSettingsGradle(config) {
  return withSettingsGradle(config, (config) => {
    // 2. Add maven repository to settings.gradle
    if (!config.modResults.contents.includes('maven.mappls.com')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencyResolutionManagement\s*{\s*repositories\s*{/,
        `dependencyResolutionManagement {\n    repositories {\n        maven { url 'https://maven.mappls.com/repository/mappls/' }`
      );
      
      // Fallback if dependencyResolutionManagement is not present
      if (!config.modResults.contents.includes('dependencyResolutionManagement')) {
          config.modResults.contents += `\ndependencyResolutionManagement { repositories { maven { url 'https://maven.mappls.com/repository/mappls/' } } }\n`;
      }
    }
    return config;
  });
}

function withMapplsAppGradle(config) {
  return withAppBuildGradle(config, (config) => {
    // 3. Add plugin to app build.gradle
    if (!config.modResults.contents.includes('com.mappls.services.android')) {
      config.modResults.contents = config.modResults.contents.replace(
        /plugins\s*{/,
        `plugins {\n    id 'com.mappls.services.android'`
      );
    }
    
    // 4. Add BoM implementation
    if (!config.modResults.contents.includes('mappls-bom')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*{/,
        `dependencies {\n    implementation platform('com.mappls.sdk:mappls-bom:2.0.0')`
      );
    }
    
    return config;
  });
}

function withMapplsConfigFiles(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      // 5. Copy the .olf and .conf files into android/app/
      const projectRoot = config.modRequest.projectRoot;
      const srcDir = path.join(projectRoot, 'mappls-config');
      const destDir = path.join(projectRoot, 'android', 'app');
      
      if (fs.existsSync(srcDir)) {
        const files = fs.readdirSync(srcDir);
        files.forEach((file) => {
          if (file.endsWith('.olf') || file.endsWith('.conf')) {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);
            fs.copyFileSync(srcFile, destFile);
            console.log(`[withMappls] Copied ${file} to android/app/`);
          }
        });
      } else {
        console.warn('[withMappls] WARNING: mappls-config directory not found!');
      }
      return config;
    },
  ]);
}

module.exports = function withMappls(config) {
  config = withMapplsProjectGradle(config);
  config = withMapplsSettingsGradle(config);
  config = withMapplsAppGradle(config);
  config = withMapplsConfigFiles(config);
  return config;
};
