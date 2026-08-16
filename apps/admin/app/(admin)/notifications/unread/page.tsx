import { NotificationList } from "@/src/notifications/admin-list";
export default function Page({searchParams}:{searchParams:Promise<{page?:string}>}){return <NotificationList filter="unread" searchParams={searchParams}/>}
