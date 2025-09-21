import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import prettier from 'prettier';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync(new URL('../config/settings.json', import.meta.url), 'utf8'));
const templatesConfig = JSON.parse(readFileSync(new URL('../config/templates.json', import.meta.url), 'utf8'));
const uiLibraries = JSON.parse(readFileSync(new URL('../config/ui-libraries.json', import.meta.url), 'utf8'));

/**
 * CodeGenerator - генерация React компонентов через Handlebars шаблоны
 */
class CodeGenerator {
  constructor() {
    this.templatesPath = config.paths.templates;
    this.outputPath = config.paths.output;
    this.templates = new Map();
    this.helpers = this.setupHandlebarsHelpers();
  }

  /**
   * Настройка Handlebars хелперов
   */
  setupHandlebarsHelpers() {
    // Хелпер для kebab-case
    Handlebars.registerHelper('kebabCase', (str) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

    // Хелпер для camelCase
    Handlebars.registerHelper('camelCase', (str) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    // Хелпер для PascalCase
    Handlebars.registerHelper('pascalCase', (str) => {
      return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c.toUpperCase());
    });

    // Хелпер для проверки типа элемента
    Handlebars.registerHelper('isType', (element, type) => {
      return element.type === type;
    });

    // Хелпер для условного рендеринга
    Handlebars.registerHelper('if_eq', function(a, b, options) {
      if (a === b) return options.fn(this);
      return options.inverse(this);
    });

    return true;
  }

  /**
   * Загрузка шаблонов
   */
  async loadTemplates() {
    try {
      const templateDirs = await fs.readdir(this.templatesPath);
      
      for (const dir of templateDirs) {
        const templatePath = path.join(this.templatesPath, dir);
        const stat = await fs.stat(templatePath);
        
        if (stat.isDirectory()) {
          await this.loadTemplateDirectory(dir, templatePath);
        }
      }

      logger.info(`Загружено шаблонов: ${this.templates.size}`);
    } catch (error) {
      logger.error('Ошибка загрузки шаблонов:', error);
      throw error;
    }
  }

  /**
   * Загрузка шаблонов из директории
   */
  async loadTemplateDirectory(name, dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const templateFiles = files.filter(file => file.endsWith('.hbs'));
      
      for (const file of templateFiles) {
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const templateName = `${name}/${file.replace('.hbs', '')}`;
        
        this.templates.set(templateName, Handlebars.compile(content));
      }
    } catch (error) {
      logger.error(`Ошибка загрузки шаблонов из ${name}:`, error);
    }
  }

  /**
   * Генерация компонента
   */
  async generateComponent(analysis, projectConfig, options = {}) {
    try {
      logger.info(`Генерация компонента для: ${analysis.imageId}`);

      // Подготовка данных для шаблона
      const templateData = this.prepareTemplateData(analysis, projectConfig, options);
      
      // Выбор шаблона
      const templateName = this.selectTemplate(projectConfig);
      const template = this.templates.get(templateName);
      
      if (!template) {
        throw new Error(`Шаблон не найден: ${templateName}`);
      }

      // Генерация файлов
      const files = await this.generateFiles(templateData, projectConfig, template);
      
      // Сохранение результатов
      const outputDir = await this.saveComponent(files, templateData.componentName);
      
      const result = {
        id: uuidv4(),
        componentName: templateData.componentName,
        files: files,
        outputDir: outputDir,
        metadata: {
          generatedAt: new Date(),
          reactVersion: projectConfig.reactVersion,
          typescript: projectConfig.typescript,
          uiLibrary: projectConfig.uiLibrary,
          styling: projectConfig.styling
        }
      };

      logger.info(`Компонент сгенерирован: ${templateData.componentName}`);
      return result;

    } catch (error) {
      logger.error('Ошибка генерации компонента:', error);
      throw error;
    }
  }

  /**
   * Подготовка данных для шаблона
   */
  prepareTemplateData(analysis, projectConfig, options) {
    logger.debug('Подготавливаем данные для шаблона. Analysis:', JSON.stringify(analysis, null, 2));
    
    const componentName = this.generateComponentName(analysis, options);
    const elements = this.processElements(analysis.elements || [], projectConfig);
    
    logger.debug('Обработанные элементы:', JSON.stringify(elements, null, 2));
    
    return {
      componentName,
      elements,
      props: this.generateProps(elements),
      stateHooks: this.generateStateHooks(elements),
      eventHandlers: this.generateEventHandlers(elements),
      imports: this.generateImports(projectConfig),
      typescript: projectConfig.typescript,
      reactVersion: projectConfig.reactVersion,
      uiLibrary: projectConfig.uiLibrary,
      styling: projectConfig.styling,
      colors: analysis.colors,
      typography: analysis.typography,
      layout: analysis.layout,
      mockData: options.mockData || {}
    };
  }

  /**
   * Генерация имени компонента
   */
  generateComponentName(analysis, options) {
    if (options.componentName) {
      return options.componentName;
    }

    // Анализируем элементы для определения типа компонента
    const elements = analysis.elements || [];
    const hasForm = elements.some(el => el.type === 'form' || el.type === 'input');
    const hasTable = elements.some(el => el.type === 'table');
    const hasCard = elements.some(el => el.type === 'card');
    const hasButton = elements.some(el => el.type === 'button');

    let baseName = 'Component';
    if (hasForm) baseName = 'Form';
    else if (hasTable) baseName = 'Table';
    else if (hasCard) baseName = 'Card';
    else if (hasButton) baseName = 'Button';

    return baseName;
  }

  /**
   * Обработка элементов UI
   */
  processElements(elements, projectConfig) {
    logger.debug('Обрабатываем элементы:', JSON.stringify(elements, null, 2));
    
    return elements.map((element, index) => {
      logger.debug(`Обрабатываем элемент ${index}:`, JSON.stringify(element, null, 2));
      
      // Создаем properties из bbox если их нет
      const properties = element.properties || this.createPropertiesFromBbox(element.bbox);
      
      const processedElement = {
        ...element,
        id: element.id || `element_${index}`,
        properties: properties,
        props: this.generateElementProps(element, projectConfig),
        className: this.generateElementClassName(element),
        style: this.generateElementStyle({...element, properties})
      };
      
      logger.debug(`Обработанный элемент ${index}:`, JSON.stringify(processedElement, null, 2));
      
      return processedElement;
    });
  }

  /**
   * Создание properties из bbox
   */
  createPropertiesFromBbox(bbox) {
    if (!bbox || !Array.isArray(bbox) || bbox.length < 4) {
      return {
        width: 100,
        height: 50,
        x: 0,
        y: 0,
        backgroundColor: this.getRandomColor(),
        textColor: '#333333',
        borderRadius: 4
      };
    }
    
    const [x, y, width, height] = bbox;
    
    // Санитизация данных - убеждаемся, что это числа
    const safeWidth = Math.max(1, Math.round(Number(width) || 100));
    const safeHeight = Math.max(1, Math.round(Number(height) || 50));
    const safeX = Math.max(0, Math.round(Number(x) || 0));
    const safeY = Math.max(0, Math.round(Number(y) || 0));
    
    // Дополнительная проверка на NaN и Infinity
    const finalWidth = isNaN(safeWidth) || !isFinite(safeWidth) ? 100 : safeWidth;
    const finalHeight = isNaN(safeHeight) || !isFinite(safeHeight) ? 50 : safeHeight;
    const finalX = isNaN(safeX) || !isFinite(safeX) ? 0 : safeX;
    const finalY = isNaN(safeY) || !isFinite(safeY) ? 0 : safeY;
    
    return {
      width: finalWidth,
      height: finalHeight,
      x: finalX,
      y: finalY,
      backgroundColor: this.getRandomColor(),
      textColor: '#333333',
      borderRadius: 4
    };
  }

  /**
   * Получение случайного цвета
   */
  getRandomColor() {
    const colors = ['#f0f0f0', '#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Генерация props для элемента
   */
  generateElementProps(element, projectConfig) {
    const props = {};

    // Базовые props
    if (element.extractedText) {
      props.text = element.extractedText;
    }

    // Props в зависимости от типа элемента
    switch (element.type) {
      case 'button':
        props.variant = 'contained';
        props.color = 'primary';
        break;
      case 'input':
        props.type = 'text';
        props.placeholder = 'Введите текст...';
        break;
      case 'card':
        props.elevation = 2;
        break;
      case 'table':
        props.size = 'medium';
        break;
    }

    return props;
  }

  /**
   * Генерация className для элемента
   */
  generateElementClassName(element) {
    return `${element.type}-${element.id}`.replace(/_/g, '-');
  }

  /**
   * Генерация стилей для элемента
   */
  generateElementStyle(element) {
    const style = {};
    
    // Проверяем, что element и properties существуют
    if (!element || !element.properties) {
      logger.warn('Элемент не содержит properties:', element);
      return style;
    }
    
    // Санитизация и проверка значений
    if (element.properties.width && typeof element.properties.width === 'number') {
      style.width = `${Math.max(1, element.properties.width)}px`;
    }
    if (element.properties.height && typeof element.properties.height === 'number') {
      style.height = `${Math.max(1, element.properties.height)}px`;
    }
    if (element.properties.backgroundColor && typeof element.properties.backgroundColor === 'string') {
      style.backgroundColor = element.properties.backgroundColor;
    }
    if (element.properties.textColor && typeof element.properties.textColor === 'string') {
      style.color = element.properties.textColor;
    }
    if (element.properties.borderRadius && typeof element.properties.borderRadius === 'number') {
      style.borderRadius = `${Math.max(0, element.properties.borderRadius)}px`;
    }

    return style;
  }

  /**
   * Генерация props компонента
   */
  generateProps(elements) {
    const props = [];

    // Анализируем элементы для определения необходимых props
    const hasText = elements.some(el => el.extractedText);
    const hasButtons = elements.some(el => el.type === 'button');
    const hasInputs = elements.some(el => el.type === 'input');

    if (hasText) {
      props.push({
        name: 'title',
        type: 'string',
        optional: true,
        defaultValue: '""'
      });
    }

    if (hasButtons) {
      props.push({
        name: 'onButtonClick',
        type: '() => void',
        optional: true
      });
    }

    if (hasInputs) {
      props.push({
        name: 'onInputChange',
        type: '(value: string) => void',
        optional: true
      });
    }

    return props;
  }

  /**
   * Генерация state hooks
   */
  generateStateHooks(elements) {
    const hooks = [];

    const hasInputs = elements.some(el => el.type === 'input');
    const hasButtons = elements.some(el => el.type === 'button');

    if (hasInputs) {
      hooks.push({
        name: 'inputValue',
        initialValue: '""'
      });
    }

    if (hasButtons) {
      hooks.push({
        name: 'isLoading',
        initialValue: 'false'
      });
    }

    return hooks;
  }

  /**
   * Генерация event handlers
   */
  generateEventHandlers(elements) {
    const handlers = [];

    const hasButtons = elements.some(el => el.type === 'button');
    const hasInputs = elements.some(el => el.type === 'input');

    if (hasButtons) {
      handlers.push({
        name: 'handleButtonClick',
        parameters: 'event',
        body: 'console.log("Button clicked", event);',
        async: false
      });
    }

    if (hasInputs) {
      handlers.push({
        name: 'handleInputChange',
        parameters: 'event',
        body: 'setInputValue(event.target.value);',
        async: false
      });
    }

    return handlers;
  }

  /**
   * Генерация импортов
   */
  generateImports(projectConfig) {
    const imports = [];

    // React импорты
    const reactVersion = parseInt(projectConfig.reactVersion);
    if (reactVersion >= 17) {
      imports.push({ name: 'React', path: 'react' });
    }

    // UI библиотека импорты
    if (projectConfig.uiLibrary !== 'none') {
      const uiLib = uiLibraries[projectConfig.uiLibrary];
      if (uiLib && uiLib.imports) {
        Object.entries(uiLib.imports).forEach(([name, path]) => {
          imports.push({ name, path });
        });
      }
    }

    return imports;
  }

  /**
   * Выбор шаблона
   */
  selectTemplate(projectConfig) {
    const reactVersion = projectConfig.reactVersion;
    const uiLibrary = projectConfig.uiLibrary;
    
    return 'test-simple';
  }

  /**
   * Генерация файлов
   */
  async generateFiles(templateData, projectConfig, template) {
    const files = [];

    // Дебаг данных для шаблона
    logger.debug('Данные для шаблона:', JSON.stringify(templateData, null, 2));
    
    // Дебаг элементов
    if (templateData.elements) {
      templateData.elements.forEach((element, index) => {
        logger.debug(`Элемент ${index} properties:`, JSON.stringify(element.properties, null, 2));
      });
    }

    // Основной компонент
    const componentContent = template(templateData);
    logger.debug('Сгенерированный контент:', componentContent.substring(0, 500));
    const formattedContent = await this.formatCode(componentContent, 'tsx');
    
    files.push({
      path: `${templateData.componentName}.tsx`,
      content: formattedContent,
      type: 'component'
    });

    // Стили
    if (projectConfig.styling !== 'styled-components') {
      const stylesContent = await this.generateStyles(templateData, projectConfig);
      files.push({
        path: `${templateData.componentName}.css`,
        content: stylesContent,
        type: 'styles'
      });
    }

    // TypeScript типы
    if (projectConfig.typescript) {
      const typesContent = await this.generateTypes(templateData);
      files.push({
        path: `${templateData.componentName}.types.ts`,
        content: typesContent,
        type: 'types'
      });
    }

    // Storybook stories
    const storiesContent = await this.generateStories(templateData);
    files.push({
      path: `${templateData.componentName}.stories.tsx`,
      content: storiesContent,
      type: 'stories'
    });

    // Тесты
    const testContent = await this.generateTests(templateData);
    files.push({
      path: `${templateData.componentName}.test.tsx`,
      content: testContent,
      type: 'test'
    });

    // Документация
    const docsContent = await this.generateDocs(templateData);
    files.push({
      path: `${templateData.componentName}.md`,
      content: docsContent,
      type: 'docs'
    });

    return files;
  }

  /**
   * Генерация стилей
   */
  async generateStyles(templateData, projectConfig) {
    const templateName = `${projectConfig.styling}/styles`;
    const template = this.templates.get(templateName);
    
    if (!template) {
      return `/* Стили для ${templateData.componentName} */\n.${templateData.componentName.toLowerCase()} {\n  /* Добавьте стили здесь */\n}`;
    }

    return template(templateData);
  }

  /**
   * Генерация TypeScript типов
   */
  async generateTypes(templateData) {
    const templateName = 'types/types';
    const template = this.templates.get(templateName);
    
    if (!template) {
      return `export interface ${templateData.componentName}Props {\n  // Добавьте props здесь\n}`;
    }

    return template(templateData);
  }

  /**
   * Генерация Storybook stories
   */
  async generateStories(templateData) {
    const templateName = 'stories/stories';
    const template = this.templates.get(templateName);
    
    if (!template) {
      return `import type { Meta, StoryObj } from '@storybook/react';\nimport { ${templateData.componentName} } from './${templateData.componentName}';\n\nexport default {\n  title: 'Components/${templateData.componentName}',\n  component: ${templateData.componentName},\n} as Meta;\n\nexport const Default: StoryObj = {};`;
    }

    return template(templateData);
  }

  /**
   * Генерация тестов
   */
  async generateTests(templateData) {
    const templateName = 'test/test';
    const template = this.templates.get(templateName);
    
    if (!template) {
      return `import { render, screen } from '@testing-library/react';\nimport { ${templateData.componentName} } from './${templateData.componentName}';\n\ndescribe('${templateData.componentName}', () => {\n  it('renders correctly', () => {\n    render(<${templateData.componentName} />);\n    expect(screen.getByRole('button')).toBeInTheDocument();\n  });\n});`;
    }

    return template(templateData);
  }

  /**
   * Генерация документации
   */
  async generateDocs(templateData) {
    const templateName = 'docs/docs';
    const template = this.templates.get(templateName);
    
    if (!template) {
      return `# ${templateData.componentName}\n\nОписание компонента.\n\n## Использование\n\n\`\`\`tsx\n<${templateData.componentName} />\n\`\`\``;
    }

    return template(templateData);
  }

  /**
   * Форматирование кода
   */
  async formatCode(code, fileType) {
    try {
      const options = {
        parser: fileType === 'tsx' ? 'typescript' : 'babel',
        semi: true,
        singleQuote: true,
        tabWidth: 2
      };

      return prettier.format(code, options);
    } catch (error) {
      logger.warn('Ошибка форматирования кода:', error);
      return code;
    }
  }

  /**
   * Сохранение компонента
   */
  async saveComponent(files, componentName) {
    const outputDir = path.join(this.outputPath, componentName);
    
    // Создаем директорию
    await fs.mkdir(outputDir, { recursive: true });
    
    // Сохраняем файлы
    for (const file of files) {
      const filePath = path.join(outputDir, file.path);
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    logger.info(`Компонент сохранен в: ${outputDir}`);
    return outputDir;
  }
}

export default CodeGenerator;
