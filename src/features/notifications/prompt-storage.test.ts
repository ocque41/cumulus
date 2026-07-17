import { describe, expect, it, vi } from "vitest";

import {
  createNotificationPromptStorage,
  NOTIFICATION_PROMPT_STORAGE_KEY,
} from "./prompt-storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  };
}

describe("notification prompt storage", () => {
  it("persists only a versioned, non-identifying seen marker", () => {
    const local = memoryStorage();
    const prompt = createNotificationPromptStorage(() => [local]);

    expect(prompt.hasSeen()).toBe(false);
    prompt.markSeen();
    expect(prompt.hasSeen()).toBe(true);
    expect(local.setItem).toHaveBeenCalledWith(
      NOTIFICATION_PROMPT_STORAGE_KEY,
      "1",
    );
    expect(JSON.stringify(local.setItem.mock.calls)).not.toContain("@");
  });

  it("uses session storage when local storage is blocked", () => {
    const blocked = {
      getItem: vi.fn(() => {
        throw new DOMException("blocked", "SecurityError");
      }),
      setItem: vi.fn(() => {
        throw new DOMException("blocked", "SecurityError");
      }),
    };
    const session = memoryStorage();
    const prompt = createNotificationPromptStorage(() => [blocked, session]);

    prompt.markSeen();

    expect(session.setItem).toHaveBeenCalledWith(
      NOTIFICATION_PROMPT_STORAGE_KEY,
      "1",
    );
    expect(prompt.hasSeen()).toBe(true);
  });

  it("falls back to memory when browser storage cannot be used", () => {
    const blocked = {
      getItem: vi.fn(() => {
        throw new DOMException("blocked", "SecurityError");
      }),
      setItem: vi.fn(() => {
        throw new DOMException("blocked", "SecurityError");
      }),
    };
    const prompt = createNotificationPromptStorage(() => [blocked]);

    expect(prompt.hasSeen()).toBe(false);
    prompt.markSeen();
    expect(prompt.hasSeen()).toBe(true);
  });

  it("does not treat unknown or stale values as the current marker", () => {
    const local = memoryStorage({
      [NOTIFICATION_PROMPT_STORAGE_KEY]: "dismissed-v0",
    });
    const prompt = createNotificationPromptStorage(() => [local]);

    expect(prompt.hasSeen()).toBe(false);
  });
});
