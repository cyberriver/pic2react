import { z } from 'zod';
import logger from '../utils/logger.js';

/**
 * MockGenerator - генерация реалистичных mock данных для компонентов
 */
class MockGenerator {
  constructor() {
    // Схемы валидации для разных типов данных
    this.schemas = this.setupSchemas();
  }

  /**
   * Настройка схем валидации
   */
  setupSchemas() {
    return {
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        avatar: z.string().url().optional(),
        role: z.enum(['admin', 'user', 'moderator'])
      }),
      
      product: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().positive(),
        description: z.string(),
        image: z.string().url().optional(),
        category: z.string(),
        inStock: z.boolean()
      })
    };
  }

  /**
   * Генерация mock данных для UI элемента
   */
  generateElementMock(element, options = {}) {
    const { type, properties } = element;
    
    switch (type) {
      case 'button':
        return this.generateButtonMock(properties, options);
      case 'input':
        return this.generateInputMock(properties, options);
      case 'text':
        return this.generateTextMock(properties, options);
      case 'image':
        return this.generateImageMock(properties, options);
      case 'card':
        return this.generateCardMock(properties, options);
      case 'table':
        return this.generateTableMock(properties, options);
      case 'form':
        return this.generateFormMock(properties, options);
      case 'navigation':
        return this.generateNavigationMock(properties, options);
      default:
        return this.generateGenericMock(properties, options);
    }
  }

  /**
   * Генерация mock данных для кнопки
   */
  generateButtonMock(properties, options = {}) {
    const buttonTypes = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
    const buttonSizes = ['small', 'medium', 'large'];
    
    return {
      text: options.text || 'Click me',
      type: buttonTypes[Math.floor(Math.random() * buttonTypes.length)],
      size: buttonSizes[Math.floor(Math.random() * buttonSizes.length)],
      disabled: Math.random() < 0.1, // 10% chance of being disabled
      loading: Math.random() < 0.05, // 5% chance of loading state
      icon: Math.random() < 0.3 ? ['search', 'add', 'edit', 'delete', 'save', 'cancel'][Math.floor(Math.random() * 6)] : undefined
    };
  }

  /**
   * Генерация mock данных для поля ввода
   */
  generateInputMock(properties, options = {}) {
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url'];
    const inputSizes = ['small', 'medium', 'large'];
    
    return {
      placeholder: options.placeholder || 'Введите текст...',
      type: inputTypes[Math.floor(Math.random() * inputTypes.length)],
      size: inputSizes[Math.floor(Math.random() * inputSizes.length)],
      required: Math.random() < 0.3,
      disabled: Math.random() < 0.1,
      value: Math.random() < 0.2 ? this.generateValueByType(inputTypes[Math.floor(Math.random() * inputTypes.length)]) : undefined,
      error: Math.random() < 0.1 ? 'Ошибка валидации' : undefined
    };
  }

  /**
   * Генерация mock данных для текста
   */
  generateTextMock(properties, options = {}) {
    const textTypes = ['heading', 'paragraph', 'caption', 'label'];
    const textType = textTypes[Math.floor(Math.random() * textTypes.length)];
    
    let content;
    switch (textType) {
      case 'heading':
        content = 'Заголовок компонента';
        break;
      case 'paragraph':
        content = 'Это пример текста для параграфа.';
        break;
      case 'caption':
        content = 'Подпись к элементу';
        break;
      case 'label':
        content = 'Метка';
        break;
    }
    
    return {
      content: options.content || content,
      type: textType,
      color: Math.random() < 0.2 ? this.generateRandomColor() : undefined,
      weight: ['normal', 'bold', 'light'][Math.floor(Math.random() * 3)],
      size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
    };
  }

  /**
   * Генерация mock данных для изображения
   */
  generateImageMock(properties, options = {}) {
    const imageTypes = ['avatar', 'product', 'banner', 'icon'];
    const imageType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
    
    let src, alt;
    switch (imageType) {
      case 'avatar':
        src = 'https://via.placeholder.com/64x64/1976d2/ffffff?text=A';
        alt = 'User Avatar';
        break;
      case 'product':
        src = 'https://via.placeholder.com/200x200/4caf50/ffffff?text=Product';
        alt = 'Product Image';
        break;
      case 'banner':
        src = 'https://via.placeholder.com/800x400/ff9800/ffffff?text=Banner';
        alt = 'Banner Image';
        break;
      case 'icon':
        src = 'https://via.placeholder.com/64x64/9c27b0/ffffff?text=Icon';
        alt = 'Icon';
        break;
    }
    
    return {
      src: options.src || src,
      alt: options.alt || alt,
      type: imageType,
      width: Math.floor(Math.random() * 450) + 50,
      height: Math.floor(Math.random() * 450) + 50,
      loading: ['lazy', 'eager'][Math.floor(Math.random() * 2)]
    };
  }

  /**
   * Генерация mock данных для карточки
   */
  generateCardMock(properties, options = {}) {
    const cardTypes = ['product', 'user', 'article', 'stat'];
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    
    let title, content, actions;
    switch (cardType) {
      case 'product':
        title = 'Название товара';
        content = 'Описание товара';
        actions = ['view', 'add-to-cart'];
        break;
      case 'user':
        title = 'Имя пользователя';
        content = 'Должность';
        actions = ['message', 'follow'];
        break;
      case 'article':
        title = 'Заголовок статьи';
        content = 'Краткое описание статьи';
        actions = ['read', 'share'];
        break;
      case 'stat':
        title = 'Статистика';
        content = Math.floor(Math.random() * 10000).toString();
        actions = ['view-details'];
        break;
    }
    
    return {
      title: options.title || title,
      content: options.content || content,
      type: cardType,
      image: Math.random() < 0.7 ? this.generateImageMock({}, { type: cardType }) : undefined,
      actions: actions,
      elevation: Math.floor(Math.random() * 9),
      padding: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
    };
  }

  /**
   * Генерация mock данных для таблицы
   */
  generateTableMock(properties, options = {}) {
    const tableTypes = ['users', 'products', 'orders', 'posts'];
    const tableType = tableTypes[Math.floor(Math.random() * tableTypes.length)];
    
    const columns = this.generateTableColumns(tableType);
    const rows = this.generateTableRows(tableType, columns, options.rowCount || 5);
    
    return {
      columns,
      rows,
      type: tableType,
      sortable: Math.random() < 0.8,
      selectable: Math.random() < 0.5,
      pagination: Math.random() < 0.7,
      totalRows: rows.length
    };
  }

  /**
   * Генерация колонок таблицы
   */
  generateTableColumns(tableType) {
    const columnConfigs = {
      users: [
        { key: 'name', title: 'Имя', type: 'text' },
        { key: 'email', title: 'Email', type: 'email' },
        { key: 'role', title: 'Роль', type: 'text' },
        { key: 'status', title: 'Статус', type: 'badge' }
      ],
      products: [
        { key: 'name', title: 'Название', type: 'text' },
        { key: 'price', title: 'Цена', type: 'currency' },
        { key: 'category', title: 'Категория', type: 'text' },
        { key: 'inStock', title: 'В наличии', type: 'boolean' }
      ]
    };
    
    return columnConfigs[tableType] || columnConfigs.users;
  }

  /**
   * Генерация строк таблицы
   */
  generateTableRows(tableType, columns, count) {
    const rows = [];
    
    for (let i = 0; i < count; i++) {
      const row = { id: Math.random().toString(36).substr(2, 9) };
      
      columns.forEach(column => {
        row[column.key] = this.generateCellValue(column.type);
      });
      
      rows.push(row);
    }
    
    return rows;
  }

  /**
   * Генерация значения ячейки
   */
  generateCellValue(type) {
    switch (type) {
      case 'text':
        return 'Пример текста';
      case 'email':
        return 'user@example.com';
      case 'currency':
        return (Math.random() * 1000).toFixed(2);
      case 'boolean':
        return Math.random() < 0.5;
      case 'badge':
        return ['active', 'inactive', 'pending', 'completed'][Math.floor(Math.random() * 4)];
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'number':
        return Math.floor(Math.random() * 1000);
      default:
        return 'Значение';
    }
  }

  /**
   * Генерация mock данных для формы
   */
  generateFormMock(properties, options = {}) {
    const formTypes = ['login', 'registration', 'contact', 'product'];
    const formType = formTypes[Math.floor(Math.random() * formTypes.length)];
    
    const fields = this.generateFormFields(formType);
    
    return {
      fields,
      type: formType,
      title: this.generateFormTitle(formType),
      submitText: ['Отправить', 'Сохранить', 'Создать', 'Обновить'][Math.floor(Math.random() * 4)],
      validation: Math.random() < 0.8
    };
  }

  /**
   * Генерация полей формы
   */
  generateFormFields(formType) {
    const fieldConfigs = {
      login: [
        { name: 'email', type: 'email', required: true },
        { name: 'password', type: 'password', required: true }
      ],
      registration: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'password', type: 'password', required: true }
      ],
      contact: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'subject', type: 'text', required: true },
        { name: 'message', type: 'textarea', required: true }
      ],
      product: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'category', type: 'select', required: true }
      ]
    };
    
    return fieldConfigs[formType] || fieldConfigs.login;
  }

  /**
   * Генерация заголовка формы
   */
  generateFormTitle(formType) {
    const titles = {
      login: 'Вход в систему',
      registration: 'Регистрация',
      contact: 'Связаться с нами',
      product: 'Добавить товар'
    };
    
    return titles[formType] || 'Форма';
  }

  /**
   * Генерация mock данных для навигации
   */
  generateNavigationMock(properties, options = {}) {
    const navTypes = ['main', 'sidebar', 'breadcrumb', 'tabs'];
    const navType = navTypes[Math.floor(Math.random() * navTypes.length)];
    
    const items = this.generateNavigationItems(navType);
    
    return {
      items,
      type: navType,
      orientation: ['horizontal', 'vertical'][Math.floor(Math.random() * 2)],
      style: ['default', 'minimal', 'bold'][Math.floor(Math.random() * 3)]
    };
  }

  /**
   * Генерация элементов навигации
   */
  generateNavigationItems(navType) {
    const itemCount = Math.floor(Math.random() * 6) + 3;
    const items = [];
    
    const commonItems = ['Главная', 'О нас', 'Контакты', 'Блог', 'Услуги', 'Продукты', 'Портфолио', 'FAQ'];
    
    for (let i = 0; i < itemCount; i++) {
      items.push({
        label: commonItems[Math.floor(Math.random() * commonItems.length)],
        href: ['/', '/about', '/contact', '/blog', '/services', '/products'][Math.floor(Math.random() * 6)],
        active: Math.random() < 0.1,
        icon: Math.random() < 0.3 ? ['home', 'user', 'mail', 'book', 'settings'][Math.floor(Math.random() * 5)] : undefined
      });
    }
    
    return items;
  }

  /**
   * Генерация универсальных mock данных
   */
  generateGenericMock(properties, options = {}) {
    return {
      text: 'Пример текста',
      value: 'Значение',
      count: Math.floor(Math.random() * 100),
      enabled: Math.random() < 0.8
    };
  }

  /**
   * Генерация значения по типу
   */
  generateValueByType(type) {
    switch (type) {
      case 'email':
        return 'user@example.com';
      case 'password':
        return 'password123';
      case 'number':
        return Math.floor(Math.random() * 1000).toString();
      case 'tel':
        return '+7 (999) 123-45-67';
      case 'url':
        return 'https://example.com';
      default:
        return 'Пример текста';
    }
  }

  /**
   * Генерация случайного цвета
   */
  generateRandomColor() {
    const colors = ['#1976d2', '#dc004e', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Генерация mock данных для всего компонента
   */
  generateComponentMock(analysis, options = {}) {
    const mockData = {
      componentName: options.componentName || 'Component',
      elements: analysis.elements.map(element => ({
        ...element,
        mock: this.generateElementMock(element, options)
      })),
      props: this.generateComponentProps(analysis, options),
      state: this.generateComponentState(analysis, options),
      metadata: {
        generatedAt: new Date(),
        locale: this.locale,
        version: '0.1.0'
      }
    };

    return mockData;
  }

  /**
   * Генерация props компонента
   */
  generateComponentProps(analysis, options = {}) {
    const props = {};
    
    // Базовые props
    if (analysis.elements.some(el => el.extractedText)) {
      props.title = 'Заголовок компонента';
    }
    
    if (analysis.elements.some(el => el.type === 'button')) {
      props.onButtonClick = 'handleButtonClick';
    }
    
    if (analysis.elements.some(el => el.type === 'input')) {
      props.onInputChange = 'handleInputChange';
    }
    
    return props;
  }

  /**
   * Генерация состояния компонента
   */
  generateComponentState(analysis, options = {}) {
    const state = {};
    
    if (analysis.elements.some(el => el.type === 'input')) {
      state.inputValue = 'Пример значения';
    }
    
    if (analysis.elements.some(el => el.type === 'button')) {
      state.isLoading = Math.random() < 0.1;
    }
    
    return state;
  }

  /**
   * Валидация mock данных
   */
  validateMockData(data, schema) {
    try {
      return schema.parse(data);
    } catch (error) {
      logger.warn('Ошибка валидации mock данных:', error);
      return data;
    }
  }
}

export default MockGenerator;