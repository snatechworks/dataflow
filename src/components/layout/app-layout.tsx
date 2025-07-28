"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/pipelines/new') return 'Create Pipeline';
    return 'DataFlow Commander';
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-lg font-semibold tracking-tight">DataFlow</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <Link href="/">
                    <Home />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/pipelines/new')}>
                  <Link href="/pipelines/new">
                    <PlusCircle />
                    <span>Create Pipeline</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 p-2 text-left h-auto">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                      <AvatarFallback>DF</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col truncate">
                      <span className="font-medium truncate">Demo User</span>
                      <span className="text-xs text-muted-foreground truncate">demo@dataflow.com</span>
                    </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 w-full">
           <header className="flex h-14 items-center gap-4 border-b bg-card px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold md:text-xl">{getPageTitle()}</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline">Support</Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
