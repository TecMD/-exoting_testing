import { test, expect } from '@playwright/test';
import {
  banner,
  header,
  sorting,
  product,
  chat,
} from '../page-objects/selectors';

// ================================================================
// TC-01 · БАННЕР · ветка: feat/tc-01-banner
// ================================================================
test.describe('TC-01 Баннер', () => {
  test('текст объявления отображается', async ({ page }) => {
    await page.goto('/');
    const el = page.locator(banner.root);
    await expect(el).toBeVisible();
    await expect(el).toContainText(banner.text);
  });

  for (const width of [375, 768, 1920]) {
    test(`вёрстка не ломается при ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await expect(page.locator(banner.root)).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBeFalsy();
    });
  }
});

// ================================================================
// TC-02 · ШАПКА САЙТА · ветка: feat/tc-02-header
// ================================================================
test.describe('TC-02 Шапка сайта', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('верхнее меню: пункты кликабельны', async ({ page }) => {
    for (const name of ['О нас', 'Доставка', 'Контакты']) {
      const link = page.locator(header.topMenuLink(name)).first();
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', /.+/);
    }
  });

  test('телефон использует tel:', async ({ page }) => {
    const phone = page.locator(header.phone).first();
    await expect(phone).toHaveAttribute('href', /^tel:/);
  });

  test('соцсети ведут на корректные ресурсы', async ({ page }) => {
    const expected: Record<string, RegExp> = {
      VK: /vk\.com/,
      YouTube: /youtube\.com/,
      Telegram: /t\.me|telegram/,
    };
    for (const [name, pattern] of Object.entries(expected)) {
      const link = page.locator(header.social(name as any)).first();
      await expect(link).toHaveAttribute('href', pattern);
    }
  });
});

================================================================
// TC-03 · ПОИСК · ветка: feat/tc-03-search
// ================================================================
test.describe('TC-03 Поиск', () => {
  test('случайные символы не дают результатов', async ({ page }) => {
    await page.goto('/');
    const input = page.locator(search.input).first();
    await input.fill('zxqwv1234!@#');
    await input.press('Enter');
    await expect(page.getByText(search.emptyState)).toBeVisible();
  });

  test('неполное наименование находит товары', async ({ page }) => {
    await page.goto('/');
    const input = page.locator(search.input).first();
    await input.fill('сверч');
    const suggestions = page.locator(search.suggestionItem);
    await expect(suggestions.first()).toBeVisible();
    await expect(suggestions.first()).toContainText(/сверч/i);
  });
});

// ================================================================
// TC-04 · КОРЗИНА И ИЗБРАННОЕ · ветка: feat/tc-04-cart
// ================================================================
test.describe('TC-04 Корзина и избранное', () => {
  test('добавление в корзину увеличивает счётчик и сохраняется после reload', async ({ page }) => {
    await page.goto('/catalog');
    const firstCard = page.locator(product.card).first();
    await firstCard.locator(cart.addBtn).first().click();
    await expect(page.locator(cart.counter).first()).toHaveText('1');
    await page.reload();
    await expect(page.locator(cart.counter).first()).toHaveText('1');
  });

  test('иконка "В избранное" активируется и сохраняется', async ({ page }) => {
    await page.goto('/catalog');
    const heart = page.locator(product.card).first().locator(favorites.heartBtn);
    await heart.click();
    await expect(heart).toHaveClass(favorites.heartActiveClass);

    await page.reload();
    await expect(heart).toHaveClass(favorites.heartActiveClass);
  });
});

// ================================================================
// TC-05 · СОРТИРОВКА · ветка: feat/tc-05-sorting
// ================================================================
test.describe('TC-05 Сортировка', () => {
  test('по цене по возрастанию', async ({ page }) => {
    await page.goto('/catalog');
    await page.locator(sorting.select).first().selectOption({ label: sorting.options.priceAsc });
    
    const texts = await page.locator(sorting.priceItem).allTextContents();
    const prices = texts.map((t) => Number(t.replace(/[^\d]/g, '')));
    
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('по цене по убыванию', async ({ page }) => {
    await page.goto('/catalog');
    await page.locator(sorting.select).first().selectOption({ label: sorting.options.priceDesc });
    
    const texts = await page.locator(sorting.priceItem).allTextContents();
    const prices = texts.map((t) => Number(t.replace(/[^\d]/g, '')));
    
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });
});

// ================================================================
// TC-06 · КАРТОЧКА ТОВАРА · ветка: feat/tc-06-product
// ================================================================
test.describe('TC-06 Карточка товара', () => {
  // TODO: участник TC-06 пишет свои тесты здесь
});

// ================================================================
// TC-07 · ВИДЖЕТ ЧАТА · ветка: feat/tc-07-chat
// ================================================================
test.describe('TC-07 Виджет чата', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator(chat.fab).click();
  });

  test('ссылки соцсетей корректны', async ({ page }) => {
    await expect(page.locator(chat.telegramLink).first()).toHaveAttribute('href', /t\.me/);
    await expect(page.locator(chat.maxLink).first()).toHaveAttribute('href', /.+/);
  });

  test('кнопка «Отправить» активна только при согласии', async ({ page }) => {
    await page.locator(chat.callbackBtn).click();
    const submit = page.locator(chat.submitBtn);
    await expect(submit).toBeDisabled();
    await page.locator(chat.consentCheckbox).check();
    await expect(submit).toBeEnabled();
  });
});
