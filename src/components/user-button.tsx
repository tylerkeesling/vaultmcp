"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@auth0/nextjs-auth0";
import { Skeleton } from "./ui/skeleton";

interface KeyValueMap {
  [key: string]: any;
}

function LogOut() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" x2="9" y1="12" y2="12"></line>
    </svg>
  );
}

function getAvatarFallback(user: KeyValueMap) {
  const givenName = user.given_name;
  const familyName = user.family_name;
  const nickname = user.nickname;
  const name = user.name;

  if (givenName && familyName) {
    return `${givenName[0]}${familyName[0]}`;
  }

  if (nickname) {
    return nickname[0];
  }

  return name[0];
}

export function LoginOrUser() {
  const { user, isLoading } = useUser();
  if (!user) {
    return (
      <Button size={"lg"} asChild>
        <a href="/auth/login">Login</a>
      </Button>
    );
  }
  if (isLoading) {
    return <Skeleton />;
  }
  return (
    <UserButton user={user}>
      <DropdownMenuItem asChild>
        <a href="/toolsets">Tools</a>
      </DropdownMenuItem>
    </UserButton>
  );
}

export function UserButton({
  user,
  children,
  logoutUrl = "/auth/logout",
}: {
  user: KeyValueMap;
  children?: React.ReactNode;
  logoutUrl?: string;
}) {
  const picture = user.picture;
  const name = user.name;
  const email = user.email;
  const resolvedLogoutUrl = logoutUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 p-0.5">
          <Avatar>
            <AvatarImage src={picture} alt={picture} />
            <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="flex flex-row items-center gap-3 font-normal">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={picture} alt={picture} />
              <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start justify-center">
              <p className="text-sm leading-none font-medium">{name}</p>
              <p className="text-xs leading-none">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        {children && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>{children}</DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem>
          <a href={resolvedLogoutUrl} className="flex items-center gap-2">
            <LogOut />
            Log out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
