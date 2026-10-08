import { effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'gpc_theme';

/**
 * Light/dark theme. On first visit, follows the operating system setting;
 * once the user clicks the toggle, their choice is remembered.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initialTheme());

  constructor() {
    // Le thème est porté par l'attribut data-theme de <html> : styles.css
    // redéfinit les variables de couleur selon sa valeur.
    effect(() => {
      document.documentElement.dataset['theme'] = this.theme();
    });
  }

  toggle(): void {
    const root = document.documentElement;
    // Transition douce seulement pendant le basculement, pas au chargement.
    root.classList.add('theme-transition');
    setTimeout(() => root.classList.remove('theme-transition'), 300);

    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      // Stockage bloqué (navigation privée…) : le thème marche quand même pour cette session.
      console.warn('[ThemeService] Impossible de mémoriser le thème', error);
    }
  }

  private initialTheme(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (error) {
      console.warn('[ThemeService] Lecture du thème mémorisé impossible', error);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
