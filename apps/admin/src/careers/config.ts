import { z } from "zod";

const plain = (max: number, required = false) => z.string().trim().max(max)
  .refine((value) => !/<\/?[a-z][\s\S]*>/i.test(value), "HTML is not allowed.")
  .refine((value) => !required || Boolean(value), "This field is required.");

export const careersConfigSchema = z.object({
  seo: z.object({ title: plain(200), description: plain(500) }),
  intro: z.object({ title: plain(200, true), description: plain(5000) }),
  jobs: z.object({
    heading: plain(200, true), emptyMessage: plain(500, true),
    perPage: z.number().int().refine((value) => [5, 10, 20, 25].includes(value), "Choose 5, 10, 20, or 25 jobs per page."),
  }),
});
export type CareersConfig = z.infer<typeof careersConfigSchema>;
export const defaultCareersConfig: CareersConfig = {
  seo: { title: "", description: "" }, intro: { title: "Careers", description: "" },
  jobs: { heading: "Available Job Opportunities", emptyMessage: "There are currently no job opportunities available. Please check back again soon.", perPage: 10 },
};
export const parseCareersConfig = (value: unknown) => careersConfigSchema.safeParse(value);
export function parseCareersForm(formData: FormData) {
  return careersConfigSchema.safeParse({
    seo: { title: String(formData.get("seoTitle") ?? ""), description: String(formData.get("seoDescription") ?? "") },
    intro: { title: String(formData.get("introTitle") ?? ""), description: String(formData.get("introDescription") ?? "") },
    jobs: { heading: String(formData.get("jobsHeading") ?? ""), emptyMessage: String(formData.get("emptyMessage") ?? ""), perPage: Number(formData.get("jobsPerPage")) },
  });
}
