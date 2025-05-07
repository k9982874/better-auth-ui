"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useContext, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import type { AuthLocalization } from "../../../lib/auth-localization"
import { AuthUIContext, type PasswordValidation } from "../../../lib/auth-ui-provider"
import { cn, getLocalizedError } from "../../../lib/utils"
import { PasswordInput } from "../../password-input"
import { Button } from "../../ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form"
import type { AuthFormClassNames } from "../auth-form"

export interface ResetPasswordFormProps {
    className?: string
    classNames?: AuthFormClassNames
    localization: Partial<AuthLocalization>
    passwordValidation?: PasswordValidation
}

export function ResetPasswordForm({
    className,
    classNames,
    localization,
    passwordValidation
}: ResetPasswordFormProps) {
    const tokenChecked = useRef(false)

    const {
        authClient,
        basePath,
        confirmPassword: confirmPasswordEnabled,
        localization: contextLocalization,
        viewPaths,
        navigate,
        toast,
        passwordValidation: contextPasswordValidation
    } = useContext(AuthUIContext)

    localization = { ...contextLocalization, ...localization }
    passwordValidation = { ...contextPasswordValidation, ...passwordValidation }

    const passwordSchema = (defaultErrorMessage?: string) => {
        let schema = passwordValidation?.minLength
            ? z.string().min(passwordValidation.minLength, {
                message: localization.passwordTooShort
            })
            : z.string().min(1, {
                message: defaultErrorMessage
            })

        if (passwordValidation?.maxLength) {
            schema = schema.max(passwordValidation.maxLength, {
                message: localization.passwordTooLong
            })
        }
        if (passwordValidation?.regex) {
            schema = schema.regex(passwordValidation.regex, {
                message: localization.passwordInvalid
            })
        }
        return schema
    }

    const formSchema = z
        .object({
            newPassword: passwordSchema(localization.newPasswordRequired),
            confirmPassword: confirmPasswordEnabled
                ? passwordSchema(localization.confirmPasswordRequired)
                : z.string().optional()
        })
        .refine((data) => !confirmPasswordEnabled || data.newPassword === data.confirmPassword, {
            message: localization.passwordsDoNotMatch,
            path: ["confirmPassword"]
        })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: ""
        }
    })

    const isSubmitting = form.formState.isSubmitting

    useEffect(() => {
        if (tokenChecked.current) return
        tokenChecked.current = true

        const searchParams = new URLSearchParams(window.location.search)
        const token = searchParams.get("token")

        if (!token || token === "INVALID_TOKEN") {
            navigate(`${basePath}/${viewPaths.signIn}${window.location.search}`)
            toast({ variant: "error", message: localization.resetPasswordInvalidToken })
        }
    }, [basePath, navigate, toast, viewPaths, localization])

    async function resetPassword({ newPassword }: z.infer<typeof formSchema>) {
        try {
            const searchParams = new URLSearchParams(window.location.search)
            const token = searchParams.get("token") as string

            await authClient.resetPassword({
                newPassword,
                token,
                fetchOptions: { throw: true }
            })

            toast({
                variant: "success",
                message: localization.resetPasswordSuccess
            })

            navigate(`${basePath}/${viewPaths.signIn}${window.location.search}`)
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({ error, localization })
            })

            form.reset()
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(resetPassword)}
                className={cn("grid w-full gap-6", className, classNames?.base)}
            >
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={classNames?.label}>
                                {localization.newPassword}
                            </FormLabel>

                            <FormControl>
                                <PasswordInput
                                    autoComplete="new-password"
                                    className={classNames?.input}
                                    placeholder={localization.newPasswordPlaceholder}
                                    disabled={isSubmitting}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage className={classNames?.error} />
                        </FormItem>
                    )}
                />

                {confirmPasswordEnabled && (
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={classNames?.label}>
                                    {localization.confirmPassword}
                                </FormLabel>

                                <FormControl>
                                    <PasswordInput
                                        autoComplete="new-password"
                                        className={classNames?.input}
                                        placeholder={localization.confirmPasswordPlaceholder}
                                        disabled={isSubmitting}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage className={classNames?.error} />
                            </FormItem>
                        )}
                    />
                )}

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn("w-full", classNames?.button, classNames?.primaryButton)}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        localization.resetPasswordAction
                    )}
                </Button>
            </form>
        </Form>
    )
}
