import{FooterContent}from"@/components/footer-content";import{HeaderNavigation}from"@/components/header-navigation";import{getPublicFooter}from"@/src/footer";import{getPublicHeader}from"@/src/header";import type{PublicSubscriberSettings}from"@/src/subscribers";
export async function PublicHeader(){const header=await getPublicHeader();return <HeaderNavigation {...header}/>}
export async function PublicFooter({subscriberSettings}:{subscriberSettings:PublicSubscriberSettings}){const footer=await getPublicFooter();return <FooterContent {...footer} subscriberSettings={subscriberSettings}/>}
