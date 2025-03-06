import crypto from "crypto";

export const generateRequestId = () => {
  return crypto.randomBytes(16).toString("hex");
};
