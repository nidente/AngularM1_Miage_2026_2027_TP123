/**
 * Règles d'upload audio, recopiées du backend (backend/src/app.js : `allowed`
 * et `MAX_FILE_SIZE`). Elles permettent de refuser un fichier invalide avant
 * l'envoi, mais ne remplacent pas le contrôle du serveur, qui reste l'autorité.
 */
export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
];

export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

/** Valeur de l'attribut `accept` de l'input : filtre l'explorateur de fichiers. */
export const AUDIO_ACCEPT = [...AUDIO_MIME_TYPES, '.mp3', '.wav', '.ogg', '.m4a'].join(',');

/** Returns a user-facing error message, or null when the file can be uploaded. */
export function audioFileError(file: File): string | null {
  // file.type est déduit de l'extension par le navigateur : c'est aussi la
  // valeur qu'il enverra au backend dans le multipart.
  if (!AUDIO_MIME_TYPES.includes(file.type)) {
    return `« ${file.name} » n'est pas dans un format accepté. Formats acceptés : MP3, WAV, OGG, M4A.`;
  }
  if (file.size > MAX_AUDIO_SIZE) {
    const sizeMb = (file.size / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    return `« ${file.name} » fait ${sizeMb} Mo : la taille maximale est de 25 Mo.`;
  }
  return null;
}

/** Traductions des messages anglais renvoyés par Multer côté backend. */
const SERVER_MESSAGES: Record<string, string> = {
  'File too large': 'Le fichier dépasse la taille maximale de 25 Mo.',
  'Unexpected field': "Le fichier n'a pas été envoyé dans le champ attendu (audio).",
};

/** Turns an upload HTTP error into a user-facing message. */
export function uploadErrorMessage(error: {
  status?: number;
  error?: { message?: string };
}): string {
  if (error.status === 0) {
    return 'Le serveur est injoignable : vérifiez que le backend est lancé, puis réessayez.';
  }
  const message = error.error?.message;
  if (message) {
    return SERVER_MESSAGES[message] ?? message;
  }
  return "L'envoi a échoué, réessayez.";
}

/**
 * Traduit une erreur de lecture (GET /api/tracks/:id/audio). Comme cet appel
 * utilise `responseType: 'blob'`, le corps d'une réponse en erreur est lui
 * aussi un Blob, pas du JSON : impossible de lire `error.error.message`. On
 * se base donc sur le code HTTP.
 */
export function audioPlaybackErrorMessage(status: number | undefined): string {
  switch (status) {
    case 404:
      return 'Cette piste est introuvable : elle a peut-être été supprimée.';
    case 401:
      return 'Votre session a expiré, reconnectez-vous.';
    case 0:
      return 'Le serveur est injoignable : vérifiez que le backend est lancé.';
    default:
      return 'La lecture a échoué, réessayez.';
  }
}
