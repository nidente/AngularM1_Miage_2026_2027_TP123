import { Track } from './track.model';

/**
 * États possibles de l'import d'une piste. Une seule valeur à la fois : on ne
 * peut pas être « en cours » et « en erreur » en même temps, contrairement à
 * plusieurs booléens indépendants.
 *
 * `progress` vaut null quand le navigateur ne connaît pas la taille totale :
 * la barre passe alors en mode indéterminé.
 */
export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number | null }
  | { status: 'success'; track: Track }
  | { status: 'error'; message: string };
