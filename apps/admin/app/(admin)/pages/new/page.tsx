import { NewGenericPageForm } from "@/components/generic-page-form";
import { requirePermission } from "@/src/auth/authorization";
export default async function Page(){await requirePermission("pages.generic.create");return <NewGenericPageForm/>}
