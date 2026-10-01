import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** French labels for every Angular Material paginator of the application. */
@Injectable()
export class FrenchPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Pistes par page';
  override firstPageLabel = 'Première page';
  override previousPageLabel = 'Page précédente';
  override nextPageLabel = 'Page suivante';
  override lastPageLabel = 'Dernière page';

  /** Ex. « 6 – 10 sur 12 ». */
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) {
      return '0 sur 0';
    }
    const start = page * pageSize + 1;
    const end = Math.min(start + pageSize - 1, length);
    return `${start} – ${end} sur ${length}`;
  };
}
