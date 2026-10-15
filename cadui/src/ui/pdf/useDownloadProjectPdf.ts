import { useState } from 'react'

import { DEFAULT_EXPORT_PDF_SETTINGS } from './exportPdfDefaults'
import { useExportPdf } from './useExportPdf'
import { loadLatestProjectVersion } from '../../api/projects'
import { fetchProjectSummary } from '../../pages/projectSummarySource'

const NO_DRAWING_MESSAGE = 'Bu projenin kayıtlı çizimi yok; PDF üretilecek bir pafta bulunamadı.'

export type DownloadProjectPdfState = {
  isDownloading: boolean
  /** Kullanıcıya gösterilecek son hata; yeni deneme temizler. */
  error: string | undefined
  download: () => Promise<void>
  dismissError: () => void
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'PDF oluşturulamadı.'
}

/**
 * Proje detayındaki "PDF İndir": editöre girmeden, projenin SON KAYITLI sürümünü
 * sunucudan indirip aynı üreticiyle (`useExportPdf`) basar.
 *
 * Sunucuda PDF üreten bir uç YOK ve olması da gerekmiyor — pafta zaten burada,
 * istemcide üretiliyor. Eskiden bu düğme `requestProjectFile('pdfReport')`
 * çağırıp "uç henüz yok" diyordu.
 *
 * Ayar SORULMUYOR: kapak + vaziyet planı + bütün katlar + izometrik, yani
 * penceredeki varsayılanın aynısı. Detay ekranındaki beklenti "projenin
 * dosyasını al", kâğıt ayarı yapmak değil; ayar gerekiyorsa editördeki pencere
 * duruyor.
 *
 * Çizim editör store'una YAZILMIYOR: store editörün açık projesinin sahibi,
 * detay ekranından doldurulsaydı sonra editöre girildiğinde kimin yüklediği
 * belirsiz bir çizim bulunurdu.
 */
export function useDownloadProjectPdf(projectId: number | undefined): DownloadProjectPdfState {
  const { isExporting, error: exportError, exportPdf } = useExportPdf()
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>(undefined)
  // Üretici kendi hatasını tutuyor ve dışarıdan temizlenemiyor; kapatma bu
  // yüzden bir BAYRAK — yeni denemede sıfırlanıyor.
  const [isDismissed, setIsDismissed] = useState(false)

  // Referansı sabitlemenin anlamı yok: künye de üretici de her render yeni
  // nesne veriyor, `useCallback` yalnız kararlılık yanılsaması yaratırdı.
  const download = async () => {
    if (projectId === undefined) {
      setLoadError('Proje kimliği okunamadı.')
      return
    }

    setLoadError(undefined)
    setIsDismissed(false)
    setIsLoading(true)
    try {
      const latest = await loadLatestProjectVersion(projectId)
      if (!latest) {
        setLoadError(NO_DRAWING_MESSAGE)
        return
      }

      // Künye çizimden SONRA çekiliyor: çizimi olmayan projede beş isteğin
      // hiçbiri yapılmıyor.
      const project = await fetchProjectSummary(projectId)

      await exportPdf({
        settings: DEFAULT_EXPORT_PDF_SETTINGS,
        // Dizinin kendi sırası zeminden yukarı; çıktı da öyle ilerliyor.
        floorIds: latest.data.floors.map((floor) => floor.id),
        project,
        source: latest.data,
      })
    } catch (cause: unknown) {
      setLoadError(toMessage(cause))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isDownloading: isLoading || isExporting,
    error: isDismissed ? undefined : loadError ?? exportError,
    download,
    dismissError: () => {
      setLoadError(undefined)
      setIsDismissed(true)
    },
  }
}
