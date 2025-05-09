"use client"

import type { Session } from "better-auth"
import { LaptopIcon, Loader2, SmartphoneIcon } from "lucide-react"
import { useContext, useState } from "react"
import { UAParser } from "ua-parser-js"
import type { AuthLocalization } from "../../lib/auth-localization"
import { AuthUIContext } from "../../lib/auth-ui-provider"
import { cn, getLocalizedError } from "../../lib/utils"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import type { SettingsCardClassNames } from "./shared/settings-card"

export interface SessionCellProps {
    className?: string
    classNames?: SettingsCardClassNames
    localization?: Partial<AuthLocalization>
    session: Session
    refetch?: () => Promise<void>
}

export function SessionCell({
    className,
    classNames,
    localization,
    session,
    refetch
}: SessionCellProps) {
    const {
        basePath,
        hooks: { useSession },
        localization: contextLocalization,
        mutators: { revokeSession },
        viewPaths,
        navigate,
        toast,
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }

    const { data: sessionData } = useSession()
    const isCurrentSession = session.id === sessionData?.session?.id

    const [isLoading, setIsLoading] = useState(false)

    const handleRevoke = async () => {
        setIsLoading(true)

        if (isCurrentSession) {
            navigate(`${basePath}/${viewPaths.signOut}`)
            return
        }

        try {
            await revokeSession({ token: session.token })
            refetch?.()
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })

            setIsLoading(false)
        }
    }

    const parser = UAParser(session.userAgent as string)
    const isMobile = parser.device.type === "mobile"

    let description = ""
    if (parser.os.name && parser.browser.name) {
        description = `${parser.os.name}, ${parser.browser.name}`
    } else if (parser.os.name) {
        description = parser.os.name
    }

    return (
        <Card className={cn("flex-row items-center gap-3 px-4 py-3", className, classNames?.cell)}>
            {isMobile ? (
                <SmartphoneIcon className={cn("size-4", classNames?.icon)} />
            ) : (
                <LaptopIcon className={cn("size-4", classNames?.icon)} />
            )}

            <div className="flex flex-col">
                <span className="font-semibold text-sm">
                    {isCurrentSession ? localization.currentSession : session?.ipAddress}
                </span>

                {description.length > 0&& (
                    <span className="text-muted-foreground text-xs">
                        {description}
                    </span>
                )}
            </div>

            <Button
                className={cn("relative ms-auto", classNames?.button, classNames?.outlineButton)}
                disabled={isLoading}
                size="sm"
                variant="outline"
                onClick={handleRevoke}
            >
                {isLoading && <Loader2 className="animate-spin" />}
                {isCurrentSession ? localization.signOut : localization.revoke}
            </Button>
        </Card>
    )
}
