import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DocsSettingsProvider } from '../docs-settings';
import { DocsSidebar } from '../layout/docs-sidebar';
import { SearchDialog } from '../layout/search-dialog';
import { SiteHeader } from '../layout/site-header';
import { HomePage } from '../pages/home-page';
import { ITEMS_AR } from './items-ar';
import { localizeItem } from './localize-item';
import { messages } from './messages';

function renderChrome(locale: 'en' | 'ar') {
  localStorage.setItem('sas-ui:lang', locale);
  return render(
    <DocsSettingsProvider>
      <SiteHeader route={{ page: 'home' }} onMenu={() => {}} onSearch={() => {}} />
      <DocsSidebar route={{ page: 'components' }} onNavigate={() => {}} />
      <HomePage />
    </DocsSettingsProvider>,
  );
}

describe('docs site chrome translation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the header, sidebar and home page in English', () => {
    renderChrome('en');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Components' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Documentation' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Get started' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: messages.en['home.title'] })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeTruthy();
  });

  it('renders the header, sidebar and home page in Arabic', () => {
    renderChrome('ar');
    const nav = screen.getByRole('navigation', { name: 'الرئيسية' });
    expect(within(nav).getByRole('link', { name: 'المكوّنات' })).toBeTruthy();
    expect(within(nav).getByRole('link', { name: 'السمات' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'التوثيق' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'البدء' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'التثبيت' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: messages.ar['home.title'] })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ابدأ الآن' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'التبديل إلى الوضع الداكن' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('ar');
  });

  it('switches every part of the chrome when the language button is pressed', () => {
    renderChrome('en');
    expect(screen.getByRole('button', { name: 'Get started' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.queryByRole('button', { name: 'Get started' })).toBeNull();
    expect(screen.getByRole('button', { name: 'ابدأ الآن' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'التوثيق' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: messages.ar['home.title'] })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(screen.getByRole('button', { name: 'Get started' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
  });
});

describe('search dialog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each([
    ['ar', 'Themes', 'السمات'],
    ['en', 'السمات', 'Themes'],
  ] as const)(
    'in %s a query in the other language ("%s") still finds the entry',
    (locale, query, shown) => {
      localStorage.setItem('sas-ui:lang', locale);
      render(
        <DocsSettingsProvider>
          <SearchDialog open onOpenChange={() => {}} />
        </DocsSettingsProvider>,
      );
      fireEvent.change(screen.getByRole('combobox'), { target: { value: query } });
      expect(screen.getByRole('option', { name: shown })).toBeTruthy();
    },
  );

  it('shows the Arabic dialog title and group headings', () => {
    localStorage.setItem('sas-ui:lang', 'ar');
    render(
      <DocsSettingsProvider>
        <SearchDialog open onOpenChange={() => {}} />
      </DocsSettingsProvider>,
    );
    expect(screen.getByRole('dialog', { name: 'البحث في التوثيق' })).toBeTruthy();
    expect(screen.getByPlaceholderText('ابحث في المكوّنات والقوالب والتوثيق…')).toBeTruthy();
  });
});

describe('localizeItem', () => {
  const item = { name: 'zz-test-item', title: 'Test item', description: 'English description' };

  it('keeps English text for English or for items without an Arabic entry', () => {
    expect(localizeItem(item, 'en')).toBe(item);
    expect(localizeItem(item, 'ar')).toBe(item);
  });

  it('uses the Arabic title and description when the entry exists', () => {
    ITEMS_AR['zz-test-item'] = { title: 'عنصر تجريبي', description: 'وصف عربي' };
    try {
      expect(localizeItem(item, 'ar')).toMatchObject({
        name: 'zz-test-item',
        title: 'عنصر تجريبي',
        description: 'وصف عربي',
      });
      expect(localizeItem(item, 'en')).toBe(item);
    } finally {
      delete ITEMS_AR['zz-test-item'];
    }
  });
});
