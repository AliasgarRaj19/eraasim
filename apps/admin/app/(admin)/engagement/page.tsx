import { eq } from "drizzle-orm";
import { saveEngagementSettings } from "@/app/(admin)/engagement/actions";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { blogEngagementSettings } from "@/src/db/schema";
import { defaultEngagementSettings } from "@/src/engagement/config";

export default async function EngagementPage({searchParams}:{searchParams:Promise<{saved?:string}>}) {
  const [{authorization}, query] = await Promise.all([requirePermission("engagement.view"), searchParams]);
  const [stored] = await db.select().from(blogEngagementSettings).where(eq(blogEngagementSettings.id,"global")).limit(1);
  const settings = stored ?? defaultEngagementSettings;
  const canSave = authorization.isMasterAdmin || authorization.permissionKeys.has("engagement.settings");
  return <section className="home-cms-page"><div className="page-heading"><p className="page-eyebrow">Blog</p><h1>Engagement Settings</h1><p>Control Blog Post likes and trusted sharing destinations.</p></div>{query.saved==="1"?<p className="success-message" role="status">Engagement settings saved.</p>:null}<form className="cms-form" action={saveEngagementSettings}><section className="form-section"><h2>Post Likes</h2><label><input type="checkbox" name="likesEnabled" defaultChecked={settings.likesEnabled}/> Enable Post Likes Globally</label></section><section className="form-section"><h2>Social Sharing</h2><label><input type="checkbox" name="sharingEnabled" defaultChecked={settings.sharingEnabled}/> Enable Social Sharing Globally</label><fieldset><legend>Platforms</legend><label><input type="checkbox" name="whatsappEnabled" defaultChecked={settings.whatsappEnabled}/> WhatsApp</label><label><input type="checkbox" name="facebookEnabled" defaultChecked={settings.facebookEnabled}/> Facebook</label><label><input type="checkbox" name="xEnabled" defaultChecked={settings.xEnabled}/> X/Twitter</label><label><input type="checkbox" name="linkedinEnabled" defaultChecked={settings.linkedinEnabled}/> LinkedIn</label><label><input type="checkbox" name="copyLinkEnabled" defaultChecked={settings.copyLinkEnabled}/> Copy Link</label><label><input type="checkbox" name="nativeShareEnabled" defaultChecked={settings.nativeShareEnabled}/> Native Share</label></fieldset></section>{canSave?<button className="primary-action" type="submit">Save Engagement Settings</button>:<p className="field-note">You have view-only access.</p>}</form></section>;
}
