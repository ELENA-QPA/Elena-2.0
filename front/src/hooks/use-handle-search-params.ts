"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

export const useHandleSearchParams = () => {
  const pathName = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = new URLSearchParams(searchParams)

  const setParamAndReplaceRoute = (key: string, value: string) => {
    // Verifica si el valor actual del parámetro es diferente
    const currentParam = params.get(key)

    if (currentParam !== value) {
      // Solo reemplaza si el valor ha cambiado
      params.set(key, value)
      router.replace(`${pathName}?${params.toString()}`)
    }
  }

  const setParams = (key: string, value: string) => {
    params.set(key, value)
  }

  const deleteParamAndReplaceRoute = (key: string) => {
    params.delete(key)
    router.replace(`${pathName}?${params.toString()}`)
  }

  const deleteParams = (key: string) => {
    params.delete(key)
  }

  const clearParams = () => {
    router.replace(pathName)
  }

  const getParam = (key: string) => {
    return params.get(key)
  }

  const replaceRoute = (params: URLSearchParams) => {
    router.replace(`${pathName}?${params.toString()}`)
  }

  const updateParam = (name: string, value: string | undefined) => {
    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }
  }

  return {
    params,
    pathName,
    setParams,
    setParamsAndReplaceRoute: setParamAndReplaceRoute,
    clearParams,
    deleteParamAndReplaceRoute,
    deleteParams,
    getParam,
    replaceRoute,
    updateParam,
  }
}

