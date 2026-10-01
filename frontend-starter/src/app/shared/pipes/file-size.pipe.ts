import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formate une taille en octets (valeur `size` renvoyée par l'API) de façon lisible.
 * Ex. 6405141 → « 6,1 Mo », 850000 → « 830 Ko ».
 */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} o`;
    }
    const kilo = bytes / 1024;
    if (kilo < 1024) {
      return `${Math.round(kilo)} Ko`;
    }
    const mega = kilo / 1024;
    return `${mega.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
  }
}
