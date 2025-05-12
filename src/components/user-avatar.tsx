import { UserIcon } from "lucide-react"
import { useContext, type ComponentProps } from "react"

import { cn } from "../lib/utils"
import type { Profile } from "../types/profile"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { AuthUIContext } from "../lib/auth-ui-provider"

export interface UserAvatarClassNames {
    base?: string
    image?: string
    fallback?: string
    fallbackIcon?: string
    skeleton?: string
}

export interface UserAvatarProps {
    user?: Profile
    classNames?: UserAvatarClassNames
    isPending?: boolean
}

/**
 * Displays a user avatar with image and fallback support
 *
 * Renders a user's avatar image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Displays first two characters of user's name when no image is available
 * - Falls back to a generic user icon when neither image nor name is available
 */
export function UserAvatar({
    user,
    classNames,
    className,
    isPending,
    ...props
}: UserAvatarProps & ComponentProps<typeof Avatar>) {
    const {
        defaultAvatarURL
    } = useContext(AuthUIContext)

    const name = user?.name || user?.fullName || user?.firstName || user?.email

    let src = user?.image || user?.avatar || user?.avatarUrl
    if (!src) {
        if (typeof defaultAvatarURL === "function") {
            src = defaultAvatarURL(user);
        } else if (typeof defaultAvatarURL === "string") {
            src = defaultAvatarURL
        }
    }

    if (isPending) {
        return (
            <Skeleton
                className={cn(
                    "size-8 shrink-0 rounded-full",
                    className,
                    classNames?.base,
                    classNames?.skeleton
                )}
            />
        )
    }

    return (
        <Avatar className={cn("bg-muted", className, classNames?.base)} {...props}>
            <AvatarImage
                alt={name || "User image"}
                className={classNames?.image}
                src={src || undefined}
            />

            <AvatarFallback
                className={cn("uppercase", classNames?.fallback)}
                delayMs={src ? 600 : undefined}
            >
                {firstTwoCharacters(name) || (
                    <UserIcon className={cn("size-[50%]", classNames?.fallbackIcon)} />
                )}
            </AvatarFallback>
        </Avatar>
    )
}

const firstTwoCharacters = (name?: string | null) => name?.slice(0, 2)
