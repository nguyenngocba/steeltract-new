import {
  useEffect,
  useState,
} from 'react'

export function useRuntimeQuery(
  queryFn: any,
) {

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    data,
    setData,
  ] = useState<any>(null)

  const [
    error,
    setError,
  ] = useState<any>(null)

  async function fetchData() {

    try {

      setLoading(true)

      const response =
        await queryFn()

      setData(response)

    } catch (err) {

      setError(err)

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    fetchData()

  }, [])

  return {

    loading,
    data,
    error,
    refetch:
      fetchData,
  }
}
