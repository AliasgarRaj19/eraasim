import { z } from "zod";

export type EngagementSettings = {
  likesEnabled: boolean; sharingEnabled: boolean; whatsappEnabled: boolean; facebookEnabled: boolean;
  xEnabled: boolean; linkedinEnabled: boolean; copyLinkEnabled: boolean; nativeShareEnabled: boolean;
};
export const defaultEngagementSettings: EngagementSettings = { likesEnabled:true, sharingEnabled:true, whatsappEnabled:true, facebookEnabled:true, xEnabled:true, linkedinEnabled:true, copyLinkEnabled:true, nativeShareEnabled:true };
const enabled = z.preprocess((value) => value === "on" || value === true, z.boolean());
export const engagementSettingsSchema = z.object({ likesEnabled:enabled, sharingEnabled:enabled, whatsappEnabled:enabled, facebookEnabled:enabled, xEnabled:enabled, linkedinEnabled:enabled, copyLinkEnabled:enabled, nativeShareEnabled:enabled });
export function parseEngagementSettingsForm(formData: FormData) { return engagementSettingsSchema.safeParse(Object.fromEntries(formData)); }
