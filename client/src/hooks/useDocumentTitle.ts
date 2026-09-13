import { useEffect } from 'react'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · La Brigade` : 'La Brigade — Recettes bistronomiques'
  }, [title])
}
