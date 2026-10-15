import type { ProjectSummary } from '../../pages/useProjectSummary'
import { DialogShell } from '../controls/DialogShell'
import { dialogActionVariants } from '../controls/buttonVariants'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70'

/** Uçtan boş gelen alan UYDURULMAZ, boşluk işaretiyle çizilir. */
const EMPTY_MARK = '—'

type Row = { label: string; value: string }

type ProjectInfoDialogProps = {
  project: ProjectSummary
  onClose: () => void
}

function Section({ title, rows }: { title: string; rows: readonly Row[] }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <dl className="divide-y divide-edge border-t border-edge">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-4 py-1.5 text-sm">
            <dt className="w-44 shrink-0 text-ink-muted">{row.label}</dt>
            {/* `break-words`: adres ve unvan boşluksuz uzun olabiliyor. */}
            <dd className="min-w-0 break-words text-ink">
              {row.value.trim() === '' ? EMPTY_MARK : row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * Üst bardaki bilgi ikonunun açtığı pencere: projenin künyesi, salt OKUMA.
 *
 * ⚠️ Burada PDF indirme YOK (kullanıcı kararı). Bir süre bu ikon "Proje
 * Dosyasını İndir" ile aynı belgeyi tek tıkla indiriyordu; ikonun sözü
 * "bilgileri göster"di, yaptığı iş dosya indirmekti. İndirme kendi yerinde
 * duruyor: Dosya ▸ Proje Dosyasını İndir.
 *
 * Veri `useProjectSummary` ile aynı künye, yani PDF kapağının okuduğu kaynağın
 * TA KENDİSİ — kâğıtta ne yazacaksa kullanıcı onu görüyor. Alanlar burada
 * DÜZENLENMEZ: proje kaydı yönetici panelindeki proje formunun işi.
 */
export function ProjectInfoDialog({ project, onClose }: ProjectInfoDialogProps) {
  const { building, designer, firm, approval } = project

  return (
    <DialogShell title="Proje Bilgileri" onClose={onClose}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <Section
          title="Proje"
          rows={[
            { label: 'Proje Adı', value: project.name },
            { label: 'Proje No', value: project.number },
            { label: 'Proje Tipi', value: building.projectType },
            { label: 'Isınma Tipi', value: building.heatingType },
          ]}
        />

        <Section
          title="Yapı"
          rows={[
            { label: 'İl', value: building.city },
            { label: 'İlçe', value: building.district },
            { label: 'Adres', value: building.address },
            { label: 'Ada / Pafta / Parsel', value: building.blockLotParcel },
            { label: 'Konut Adedi', value: building.residenceCount },
            { label: 'İşyeri Adedi', value: building.shopCount },
            { label: 'Toplam Alan (m²)', value: building.totalAreaSquareMeters },
          ]}
        />

        <Section
          title="Proje Firması"
          rows={[
            { label: 'Unvan', value: firm.title },
            { label: 'Adres', value: firm.address },
            { label: 'Telefon', value: firm.phone },
            { label: 'Vergi No', value: firm.taxNumber },
            { label: 'Proje Tasarımcısı', value: designer.name },
          ]}
        />

        <Section
          title="Onay"
          rows={[
            { label: 'Gaz Dağıtım Firması', value: approval.gasFirmName },
            { label: 'Onaylayan', value: approval.approverName },
          ]}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end border-t border-edge px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className={`${dialogActionVariants({ tone: 'cancel' })} ${FOCUS_RING}`}
        >
          Kapat
        </button>
      </div>
    </DialogShell>
  )
}
