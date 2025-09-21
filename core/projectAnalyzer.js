import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import logger from '../utils/logger.js';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(new URL('../config/settings.json', import.meta.url), 'utf8'));
const uiLibraries = JSON.parse(readFileSync(new URL('../config/ui-libraries.json', import.meta.url), 'utf8'));

/**
 * ProjectAnalyzer - анализ React проектов для определения зависимостей
 */
class ProjectAnalyzer {
  constructor() {
    this.packagesPath = config.paths.packages;
    this.analyzedProjects = new Map();
  }

  /**
   * Анализ всех проектов в папке packages/
   */
  async analyzeAllProjects() {
    try {
      const projectPaths = await this.findProjectPaths();
      const results = [];

      for (const projectPath of projectPaths) {
        try {
          const analysis = await this.analyzeProject(projectPath);
          results.push(analysis);
          this.analyzedProjects.set(projectPath, analysis);
        } catch (error) {
          logger.error(`Ошибка анализа проекта ${projectPath}:`, error);
        }
      }

      logger.info(`Проанализировано проектов: ${results.length}`);
      return results;

    } catch (error) {
      logger.error('Ошибка анализа проектов:', error);
      throw error;
    }
  }

  /**
   * Поиск всех React проектов
   */
  async findProjectPaths() {
    const patterns = [
      '**/package.json',
      '**/yarn.lock',
      '**/package-lock.json'
    ];

    const paths = new Set();
    
    for (const pattern of patterns) {
      try {
        const matches = await new Promise((resolve, reject) => {
          glob(pattern, { cwd: this.packagesPath }, (err, files) => {
            if (err) reject(err);
            else resolve(files);
          });
        });
        matches.forEach(match => {
          const projectPath = path.dirname(path.join(this.packagesPath, match));
          paths.add(projectPath);
        });
      } catch (error) {
        logger.warn(`Ошибка поиска по паттерну ${pattern}:`, error);
      }
    }

    return Array.from(paths);
  }

  /**
   * Анализ конкретного проекта
   */
  async analyzeProject(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = await this.readPackageJson(packageJsonPath);
      
      const analysis = {
        path: projectPath,
        name: packageJson.name || path.basename(projectPath),
        version: packageJson.version || '1.0.0',
        reactVersion: this.detectReactVersion(packageJson),
        typescript: this.detectTypeScript(packageJson, projectPath),
        uiLibrary: this.detectUILibrary(packageJson),
        styling: this.detectStyling(packageJson),
        stateManagement: this.detectStateManagement(packageJson),
        dependencies: this.categorizeDependencies(packageJson),
        scripts: packageJson.scripts || {},
        timestamp: new Date()
      };

      logger.info(`Проект проанализирован: ${analysis.name} (React ${analysis.reactVersion})`);
      return analysis;

    } catch (error) {
      logger.error(`Ошибка анализа проекта ${projectPath}:`, error);
      throw error;
    }
  }

  /**
   * Чтение package.json
   */
  async readPackageJson(packageJsonPath) {
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Не удалось прочитать package.json: ${error.message}`);
    }
  }

  /**
   * Определение версии React
   */
  detectReactVersion(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const reactVersion = deps.react || deps['react-dom'];
    
    if (!reactVersion) {
      return '18'; // По умолчанию
    }

    // Извлекаем мажорную версию
    const match = reactVersion.match(/^[\^~]?(\d+)/);
    return match ? match[1] : '18';
  }

  /**
   * Определение использования TypeScript
   */
  async detectTypeScript(packageJson, projectPath) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Проверяем зависимости
    if (deps.typescript || deps['@types/react']) {
      return true;
    }

    // Проверяем наличие tsconfig.json
    try {
      await fs.access(path.join(projectPath, 'tsconfig.json'));
      return true;
    } catch {
      // Проверяем наличие .ts/.tsx файлов
      try {
        const tsFiles = await new Promise((resolve, reject) => {
          glob('**/*.{ts,tsx}', { cwd: projectPath }, (err, files) => {
            if (err) reject(err);
            else resolve(files);
          });
        });
        return tsFiles.length > 0;
      } catch {
        return false;
      }
    }
  }

  /**
   * Определение UI библиотеки
   */
  detectUILibrary(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Проверяем известные UI библиотеки
    for (const [libName, libConfig] of Object.entries(uiLibraries)) {
      if (libName === 'none') continue;
      
      if (deps[libConfig.name.toLowerCase()] || 
          deps[libName] || 
          deps[`@${libName}`]) {
        return libName;
      }
    }

    return 'none';
  }

  /**
   * Определение подхода к стилизации
   */
  detectStyling(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['styled-components']) return 'styled-components';
    if (deps['@emotion/react'] || deps['@emotion/styled']) return 'emotion';
    if (deps['tailwindcss']) return 'tailwind';
    if (deps['sass'] || deps['node-sass']) return 'scss';
    
    return 'css';
  }

  /**
   * Определение управления состоянием
   */
  detectStateManagement(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.redux || deps['@reduxjs/toolkit']) return 'redux';
    if (deps.zustand) return 'zustand';
    if (deps.recoil) return 'recoil';
    if (deps.mobx) return 'mobx';
    
    return 'useState';
  }

  /**
   * Категоризация зависимостей
   */
  categorizeDependencies(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const categories = {
      react: [],
      ui: [],
      styling: [],
      state: [],
      utils: [],
      dev: [],
      other: []
    };

    for (const [name, version] of Object.entries(deps)) {
      const isDev = packageJson.devDependencies?.[name];
      
      if (name.includes('react')) {
        categories.react.push({ name, version, dev: isDev });
      } else if (this.isUILibrary(name)) {
        categories.ui.push({ name, version, dev: isDev });
      } else if (this.isStylingLibrary(name)) {
        categories.styling.push({ name, version, dev: isDev });
      } else if (this.isStateLibrary(name)) {
        categories.state.push({ name, version, dev: isDev });
      } else if (isDev) {
        categories.dev.push({ name, version, dev: true });
      } else {
        categories.other.push({ name, version, dev: false });
      }
    }

    return categories;
  }

  /**
   * Проверка является ли библиотека UI
   */
  isUILibrary(name) {
    const uiLibs = Object.values(uiLibraries).map(lib => lib.name.toLowerCase());
    return uiLibs.some(lib => name.includes(lib));
  }

  /**
   * Проверка является ли библиотека стилизации
   */
  isStylingLibrary(name) {
    const stylingLibs = ['styled-components', 'emotion', 'tailwind', 'sass', 'less', 'stylus'];
    return stylingLibs.some(lib => name.includes(lib));
  }

  /**
   * Проверка является ли библиотека управления состоянием
   */
  isStateLibrary(name) {
    const stateLibs = ['redux', 'zustand', 'recoil', 'mobx', 'jotai'];
    return stateLibs.some(lib => name.includes(lib));
  }

  /**
   * Получение конфигурации для генерации
   */
  getGenerationConfig(projectPath) {
    const analysis = this.analyzedProjects.get(projectPath);
    if (!analysis) {
      throw new Error(`Проект не найден: ${projectPath}`);
    }

    const uiLib = uiLibraries[analysis.uiLibrary];
    
    return {
      reactVersion: analysis.reactVersion,
      typescript: analysis.typescript,
      uiLibrary: analysis.uiLibrary,
      uiLibraryConfig: uiLib,
      styling: analysis.styling,
      stateManagement: analysis.stateManagement,
      projectName: analysis.name,
      projectPath: analysis.path
    };
  }

  /**
   * Получение списка всех проанализированных проектов
   */
  getAnalyzedProjects() {
    return Array.from(this.analyzedProjects.values());
  }

  /**
   * Очистка кэша анализа
   */
  clearCache() {
    this.analyzedProjects.clear();
    logger.info('Кэш анализа проектов очищен');
  }
}

export default ProjectAnalyzer;
