import { Component, input } from '@angular/core';

/** Split-screen shell shared by the login and register pages. */
@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayoutComponent {
  readonly heading = input.required<string>();
  readonly subtitle = input('');

  /** Six cordes, de la plus fine (mi aigu) à la plus grosse (mi grave). */
  protected readonly strings = [
    { y: 22, width: 0.9 },
    { y: 49, width: 1.1 },
    { y: 76, width: 1.4 },
    { y: 103, width: 1.8 },
    { y: 130, width: 2.2 },
    { y: 157, width: 2.6 },
  ];

  /** Positions des frettes : l'écart se resserre comme sur un vrai manche. */
  protected readonly frets = [48, 89.5, 128.7, 165.7, 200.7, 233.6, 264.7, 294.1, 321.8, 348, 372.7, 396];

  /** Repères nacrés des cases 3, 5, 7 et 9 (la case 12 a un double repère). */
  protected readonly inlays = [109.1, 183.2, 249.2, 308];
}
