import fs from "fs";
import path from "path";

/**
 * WhatsApp integration deliberately does NOT automate clicking "Send".
 * It only builds an official wa.me click-to-chat link
 * (https://faq.whatsapp.com/425247423114725) with your message pre-filled -
 * you still have to press Send yourself in the browser/app that opens.
 * This keeps a human in the loop and avoids the account-ban and spam risks
 * of scripting clicks inside WhatsApp Web, which isn't sanctioned by
 * WhatsApp's terms outside their official Business API.
 *
 * Contacts are resolved from a local contacts.json you maintain yourself
 * (never auto-populated, never synced from an actual WhatsApp account):
 *   { "mom": "923001234567", "ali": "923219876543" }
 * Keys are matched case-insensitively; values are phone numbers in
 * international format WITHOUT the leading "+".
 */

export interface ContactsFile {
  [name: string]: string;
}

function contactsPath(): string {
  return path.resolve(process.cwd(), "contacts.json");
}

export function loadContacts(): ContactsFile {
  try {
    const raw = fs.readFileSync(contactsPath(), "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export interface ResolvedWhatsappTarget {
  ok: boolean;
  phone?: string;
  waLink?: string;
  error?: string;
}

/**
 * Resolves a contact name or raw phone number + message into a wa.me link.
 * Never sends anything itself - just builds the URL for the agent to open.
 */
export function resolveWhatsappTarget(params: { contactName?: string; phone?: string; message: string }): ResolvedWhatsappTarget {
  let phone = (params.phone || "").replace(/[^\d]/g, "");

  if (!phone && params.contactName) {
    const contacts = loadContacts();
    const match = Object.entries(contacts).find(
      ([name]) => name.toLowerCase() === params.contactName!.toLowerCase()
    );
    if (!match) {
      const known = Object.keys(contacts);
      return {
        ok: false,
        error: known.length
          ? `No contact named "${params.contactName}" in contacts.json. Known contacts: ${known.join(", ")}.`
          : `No contact named "${params.contactName}" found, and contacts.json is empty or missing. Add entries like {"${params.contactName.toLowerCase()}": "countrycode+number"} to contacts.json in the project root.`,
      };
    }
    phone = match[1].replace(/[^\d]/g, "");
  }

  if (!phone) {
    return { ok: false, error: "No phone number or known contact name provided for the WhatsApp message." };
  }
  if (phone.length < 8) {
    return { ok: false, error: `"${phone}" doesn't look like a valid international phone number (include country code, no leading 0 or +).` };
  }
  if (!params.message || !params.message.trim()) {
    return { ok: false, error: "No message text provided." };
  }

  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(params.message)}`;
  return { ok: true, phone, waLink };
}
