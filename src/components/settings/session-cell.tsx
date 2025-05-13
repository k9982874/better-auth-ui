"use client"

import type { Session } from "better-auth"
import { Gamepad2Icon, LaptopIcon, Loader2, SmartphoneIcon, TabletIcon, Tv2Icon, WatchIcon } from "lucide-react"
import { useContext, useState } from "react"
import { UAParser } from "ua-parser-js"
import type { AuthLocalization } from "../../lib/auth-localization"
import { AuthUIContext } from "../../lib/auth-ui-provider"
import { cn, getLocalizedError } from "../../lib/utils"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import type { SettingsCardClassNames } from "./shared/settings-card"
import type { UserAgent } from "../../types/user-agent"

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
        UAParser: UAParserFunc,
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

    let userAgent: UserAgent | undefined
    if (session.userAgent) {
        if (UAParserFunc) {
            userAgent = UAParserFunc(session.userAgent as string)
        }

        if (userAgent === undefined) {
            const result = UAParser(session.userAgent as string)
            userAgent = {
                type: result.device.type,
                vendor: result.device.vendor,
                model: result.device.model,
                info: {
                    osName: result.os.name,
                    osVersion: result.os.version,
                    appName: result.browser.name,
                    appVersion: result.browser.version,
                }
            }
        }
    }

    let description = ""
    if (userAgent) {
        if (typeof userAgent.info === "string") {
            description = userAgent.info
        } else {
            if (userAgent.info?.osName && userAgent.info?.appName) {
                description = `${userAgent.info.osName}, ${userAgent.info.appName}`
            } else if (userAgent.info?.osName) {
                description = userAgent.info.osName
            } else if (userAgent.info?.appName) {
                description = userAgent.info.appName
            }
        }
    }

    let icon: React.ReactNode
    if (userAgent?.type === "mobile") {
        icon = <SmartphoneIcon className={cn("size-4", classNames?.icon)} />
    } else if (userAgent?.type === "tablet") {
        icon = <TabletIcon className={cn("size-4", classNames?.icon)} />
    } else if (userAgent?.type === "smarttv") {
        icon = <Tv2Icon className={cn("size-4", classNames?.icon)} />
    } else if (userAgent?.type === "wearable") {
        icon = <WatchIcon className={cn("size-4", classNames?.icon)} />
    } else if (userAgent?.type === "console") {
        icon = <Gamepad2Icon className={cn("size-4", classNames?.icon)} />
    } else {
        icon = <LaptopIcon className={cn("size-4", classNames?.icon)} />
    }

    return (
        <Card className={cn("flex-row items-center gap-3 px-4 py-3", className, classNames?.cell)}>
            {icon}

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
