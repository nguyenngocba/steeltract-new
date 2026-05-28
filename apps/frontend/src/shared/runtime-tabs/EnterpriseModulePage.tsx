type Props = {

  children:
    React.ReactNode
}

export function EnterpriseModulePage({
  children,
}: Props) {

  return (

    <div className="min-h-screen bg-black p-8 text-white">

      {children}

    </div>
  )
}
