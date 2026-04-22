const BAD_WORDS = ["badword1", "badword2", "badword3"];

export const MESSAGE_MAX_LENGTH = 5000;

function hasProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((word) => lower.includes(word));
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };


export function validateMessage(subject: string, body: string): ValidationResult {
  if (!subject.trim()) {
    return { valid: false, error: "Subject is required." };
  }

  if (!body.trim()) {
    return { valid: false, error: "Message body is required." };
  }

  if (body.length > MESSAGE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Message must be ${MESSAGE_MAX_LENGTH.toLocaleString()} characters or fewer.`,
    };
  }

  if (hasProfanity(subject) || hasProfanity(body)) {
    return { valid: false, error: "Message contains inappropriate language." };
  }

  return { valid: true };
}


export function validateChatBody(body: string): ValidationResult {
  if (!body.trim()) {
    return { valid: false, error: "Message cannot be empty." };
  }

  if (body.length > MESSAGE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Message must be ${MESSAGE_MAX_LENGTH.toLocaleString()} characters or fewer.`,
    };
  }

  if (hasProfanity(body)) {
    return { valid: false, error: "Message contains inappropriate language." };
  }

  return { valid: true };
}