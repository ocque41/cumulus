export const NOTIFICATION_PROMPT_STORAGE_KEY =
  "cumulus.notificationPrompt.seen.v1";

const NOTIFICATION_PROMPT_STORAGE_VALUE = "1";

type PromptStorage = Pick<Storage, "getItem" | "setItem">;

function browserPromptStorages(): PromptStorage[] {
  if (typeof window === "undefined") return [];

  const storages: PromptStorage[] = [];
  try {
    storages.push(window.localStorage);
  } catch {
    // Storage can be unavailable in hardened or private browser contexts.
  }
  try {
    storages.push(window.sessionStorage);
  } catch {
    // The in-memory fallback below still prevents repeats for this page load.
  }
  return storages;
}

export interface NotificationPromptStorage {
  hasSeen(): boolean;
  markSeen(): void;
}

export function createNotificationPromptStorage(
  readStorages: () => PromptStorage[] = browserPromptStorages,
): NotificationPromptStorage {
  let seenInMemory = false;

  return {
    hasSeen() {
      if (seenInMemory) return true;

      for (const storage of readStorages()) {
        try {
          if (
            storage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)
            === NOTIFICATION_PROMPT_STORAGE_VALUE
          ) {
            return true;
          }
        } catch {
          // Try the next browser store before falling back to memory.
        }
      }
      return false;
    },

    markSeen() {
      for (const storage of readStorages()) {
        try {
          storage.setItem(
            NOTIFICATION_PROMPT_STORAGE_KEY,
            NOTIFICATION_PROMPT_STORAGE_VALUE,
          );
          return;
        } catch {
          // Try the next browser store before falling back to memory.
        }
      }
      seenInMemory = true;
    },
  };
}

export const notificationPromptStorage = createNotificationPromptStorage();
