import { Pipe, PipeTransform } from '@angular/core';

/** Noms courts des types MIME acceptés par le backend. */
const FORMATS: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/mp4': 'M4A',
  'audio/x-m4a': 'M4A',
};

/** Affiche un type MIME audio sous une forme lisible. Ex. `audio/mpeg` → « MP3 ». */
@Pipe({ name: 'audioFormat' })
export class AudioFormatPipe implements PipeTransform {
  transform(mimeType: string): string {
    return FORMATS[mimeType] ?? mimeType.replace('audio/', '').toUpperCase();
  }
}
