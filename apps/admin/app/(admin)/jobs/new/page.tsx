import{NewJobForm}from"@/components/job-form";import{requirePermission}from"@/src/auth/authorization";export default async function Page(){await requirePermission("jobs.create");return <NewJobForm/>}
