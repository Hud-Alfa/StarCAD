import type { ExportPdfSettings } from './ExportPdfOptions'
import { DEFAULT_ORIENTATION, DEFAULT_PAPER_SIZE, DEFAULT_PDF_SCALE } from '../../core/pdf/paper'

/**
 * "Proje Dosyasını İndir" penceresinin açılış ayarları. Ayrı dosyada duruyor
 * (react-refresh yalnız bileşen ihraç eden dosyalardan hoşlanıyor) —
 * `ExportPdfDialog` bunu doğrudan kullanıyor, proje detayındaki "PDF İndir"
 * (`useDownloadProjectPdf`) ayar sormadan aynen basıyor.
 */
export const DEFAULT_EXPORT_PDF_SETTINGS: ExportPdfSettings = {
  paper: DEFAULT_PAPER_SIZE,
  orientation: DEFAULT_ORIENTATION,
  scale: DEFAULT_PDF_SCALE,
  isCoverVisible: true,
  isSitePlanVisible: true,
  isIsometricVisible: true,
}
