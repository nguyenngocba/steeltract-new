type Props = {

  children:
    React.ReactNode

  permission?: string
}

export function PermissionGuard({
  children,
}: Props) {

  return <>{children}</>
}
