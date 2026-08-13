import{FooterContent}from"@/components/footer-content";import{HeaderNavigation}from"@/components/header-navigation";import{getPublicFooter}from"@/src/footer";import{getPublicHeader}from"@/src/header";
export async function PublicHeader(){const header=await getPublicHeader();return <HeaderNavigation {...header}/>}
export async function PublicFooter(){const footer=await getPublicFooter();return <FooterContent {...footer}/>}
