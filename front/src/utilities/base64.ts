export const encryptToBase64 = (text: string) => btoa(text);

export const decryptFromBase64 = (base64Text: string) => atob(base64Text);
