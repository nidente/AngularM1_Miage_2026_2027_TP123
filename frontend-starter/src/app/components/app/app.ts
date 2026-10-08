import { Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(document:click)': 'closeMenuOnOutsideClick($event)',
    '(document:keydown.escape)': 'menuOpen.set(false)',
    '(window:scroll)': 'onScroll()',
  },
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly year = new Date().getFullYear();

  /** Whether the account dropdown is visible. */
  protected readonly menuOpen = signal(false);

  /** True once the page is scrolled: the bar becomes more compact. */
  protected readonly scrolled = signal(false);

  /** First letter of the user's name for the avatar, "?" while the profile is loading. */
  protected readonly initial = computed(
    () => this.auth.currentUser()?.name.charAt(0).toUpperCase() || '?',
  );

  constructor() {
    // Seul le token survit à un rechargement de page (localStorage) : on
    // recharge le profil pour que la nav puisse afficher le nom.
    effect(() => {
      if (this.auth.token() && !this.auth.currentUser()) {
        this.auth.profile().subscribe({
          next: (user) => console.debug('[AppComponent] Profil chargé', user.id),
          error: (error) => console.error('[AppComponent] Chargement du profil impossible', error),
        });
      }
    });
  }

  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Closes the dropdown when the user clicks anywhere outside of it. */
  closeMenuOnOutsideClick(event: MouseEvent): void {
    const menu = this.host.nativeElement.querySelector('.user-menu');
    if (this.menuOpen() && menu && !menu.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  /** Clears the local session (token + profile) and returns to the login page. */
  logout(): void {
    console.debug('[AppComponent] Déconnexion');
    this.menuOpen.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
