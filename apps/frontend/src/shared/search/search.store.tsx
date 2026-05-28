import {
  createContext,
  useContext,
  useState,
} from 'react'

const SearchContext =
  createContext<any>(null)

export function SearchProvider({
  children,
}: any) {

  const [
    open,
    setOpen,
  ] = useState(false)

  return (

    <SearchContext.Provider

      value={{

        open,
        setOpen,
      }}
    >

      {children}

    </SearchContext.Provider>
  )
}

export function useSearch() {

  return useContext(
    SearchContext,
  )
}
