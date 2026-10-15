import {
  getProjectApproverName,
  getProjectDesignerName,
  splitStreetDoorNo,
} from './projectSummaryFields'
import {
  getProjectDetail,
  getProjectHistory,
  type ProjectHistoryRow,
  type ProjectServerFields,
} from '../api/projectDetail'
import { getProjectFirmAuthorizations } from '../api/projectFirmAuthorizations'
import { getProjectFirm } from '../api/projectFirmForm'

/**
 * Editörün ihtiyaç duyduğu proje künyesi — PDF kapağının veri kaynağı.
 *
 * ⚠️ Kapakta artık MOCK ALAN YOK (K159): her değer ya gerçek bir uçtan ya
 * çizimden geliyor. `ProjectDetail.extras` bu yoldan tümüyle çıktı — detay
 * ekranı onu kullanmaya devam ediyor, kâğıt kullanmıyor.
 *
 * Dört kaynak birleşiyor:
 * - `GET /api/projects/{id}` — ad, numara, adres, tip, adetler, gaz dağıtım
 *   firmasının ADI
 * - `GET /api/project-firm-authorizations` — projenin firma KİMLİĞİ
 * - `GET /api/projectfirms/{id}` — firma künyesi
 * - `GET /api/projects/{id}/history` — tasarımcı ve onaylayan
 *
 * ⚠️ `GET /api/gasdistributionfirms/{id}` ÇAĞRILMIYOR: sunucuda admin-only ve
 * proje firması kullanıcısında 403 dönüyordu; gereken tek alan (firma adı)
 * zaten projenin kendi gövdesinde.
 *
 * ⚠️ Firma kimliği araya bir istek SOKUYOR: canlı `GET /api/projects/{id}`
 * yanıtı `projectFirmId` DÖNDÜRMÜYOR (OpenAPI örneğinde var, telde yok —
 * ölçüldü), yalnız `projectFirmAuthorizationId` veriyor. Zincir bu yüzden üç
 * halkalı: proje → yetki → firma.
 */
export type ProjectSummary = {
  name: string
  /** Serbest biçimli proje numarası (`pId`); kapak ve dosya adı bunu kullanır. */
  number: string
  building: {
    city: string
    district: string
    address: string
    blockLotParcel: string
    projectType: string
    heatingType: string
    floorCount: string
    residenceCount: string
    shopCount: string
    totalAreaSquareMeters: string
  }
  /**
   * Projeyi oluşturan kişi; sistem yöneticisi oluşturmuşsa firma yetkilisi
   * (bkz. `getProjectDesignerName`). Kayıt/yeterlilik numaraları YOK — ikisinin
   * de sunucuda karşılığı bulunmadığı için kapaktan kaldırıldılar (K159).
   */
  designer: { name: string }
  firm: {
    title: string
    address: string
    phone: string
    /** Vergi DAİRESİ yok: `GET /api/projectfirms/{id}` yalnız numarayı taşıyor. */
    taxNumber: string
  }
  approval: {
    gasFirmName: string
    /** Projeyi ONAYLAYAN kişi (geçmişteki `projeOnay` satırı); yoksa boş. */
    approverName: string
    /** Dağıtım şirketinin yetkilisi; kaşe kutusu onaylayan yoksa buna düşer. */
    gasFirmContactPerson: string
  }
  /** Vaziyet planındaki sokak/kapı bilgisi; tam adresten ayrıştırılır. */
  streetName: string
  doorNumber: string
}

const EMPTY_SUMMARY: ProjectSummary = {
  name: '',
  number: '',
  building: {
    city: '',
    district: '',
    address: '',
    blockLotParcel: '',
    projectType: '',
    heatingType: '',
    floorCount: '',
    residenceCount: '',
    shopCount: '',
    totalAreaSquareMeters: '',
  },
  designer: { name: '' },
  firm: { title: '', address: '', phone: '', taxNumber: '' },
  approval: { gasFirmName: '', approverName: '', gasFirmContactPerson: '' },
  streetName: '',
  doorNumber: '',
}

function toText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'number' ? String(value) : value.trim()
}

export type ProjectSummarySources = {
  projectId: number | undefined
  server: ProjectServerFields | undefined
  history: readonly ProjectHistoryRow[]
  projectFirm: Awaited<ReturnType<typeof getProjectFirm>> | undefined
}

/**
 * Beş kaynağı tek künyeye indirger. Saf: hem sorgularla besleyen hook hem tek
 * seferlik indiren `fetchProjectSummary` bunu çağırıyor, birleştirme kuralı iki
 * kez yazılmasın diye.
 *
 * Uç yanıt vermezse iş DURMAZ: PDF yine üretilir, proje numarası id'ye düşer.
 * Künye yüzünden dışa aktarmayı engellemek orantısız olurdu.
 */
export function buildProjectSummary(sources: ProjectSummarySources): ProjectSummary {
  const { projectId, server, history, projectFirm } = sources

  if (!server) {
    return { ...EMPTY_SUMMARY, number: projectId === undefined ? '' : String(projectId) }
  }

  const { streetName, doorNumber } = splitStreetDoorNo(toText(server.addressLine))

  return {
    name: server.name,
    number: server.pId,
    building: {
      city: toText(server.cityName),
      district: toText(server.districtName),
      address: toText(server.addressLine),
      blockLotParcel: toText(server.blockLotParcel),
      projectType: toText(server.projectTypeName),
      heatingType: toText(server.heatingTypeName),
      // Kat adedi uçta YOK; boş bırakılıyor ve kapak çizimdeki kat sayısına
      // düşüyor (`buildCoverInfo`) — o da uydurma değil, kullanıcının çizdiği.
      floorCount: '',
      residenceCount: toText(server.apartmentCount),
      shopCount: toText(server.workplaceCount),
      totalAreaSquareMeters: toText(server.areaSquareMeters),
    },
    designer: {
      name: getProjectDesignerName(history, projectFirm?.contactPerson ?? null),
    },
    firm: {
      title: toText(projectFirm?.title),
      address: toText(projectFirm?.address),
      phone: toText(projectFirm?.phone),
      taxNumber: toText(projectFirm?.taxNumber),
    },
    approval: {
      // Ad projenin KENDİ gövdesinden (`ProjectDetailDto.GasDistributionFirmName`):
      // ikinci bir istek gerekmiyor ve `GET /api/gasdistributionfirms/{id}`
      // sunucuda `[Authorize(Roles = Admin)]` olduğu için proje firması
      // kullanıcısında 403 dönüyordu.
      gasFirmName: toText(server.gasDistributionFirmName),
      approverName: getProjectApproverName(history),
      // Dağıtım yetkilisi YALNIZ admin-only tekil uçta var; istek kalktığı için
      // boş bırakılıyor. Kaşe kutusu zaten onaylayanın adına düşüyor
      // (`coverPageFields`) ve o ad artık gerçek geçmişten geliyor.
      gasFirmContactPerson: '',
    },
    streetName,
    doorNumber,
  }
}

/** Yan kaynaklar künyeyi ENGELLEMEZ: gelmeyeni yutup boş bırakıyoruz. */
async function optional<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise
  } catch {
    return undefined
  }
}

/**
 * Künyeyi TEK SEFERDE indirir — sorgu abonesi olmadan.
 *
 * Proje detayındaki "PDF İndir" bunu kullanıyor: hook sürümü ekran açılır
 * açılmaz beş isteği başlatıyor, oysa orada künye yalnız düğmeye BASILINCA
 * gerekiyor ve detay ekranı zaten kendi sorgularını yapıyor.
 */
export async function fetchProjectSummary(projectId: number): Promise<ProjectSummary> {
  const detail = await optional(getProjectDetail(projectId))
  const server = detail?.server
  const authorizationId = server?.projectFirmAuthorizationId ?? undefined

  const [history, authorizations] = await Promise.all([
    optional(getProjectHistory(projectId)),
    authorizationId === undefined
      ? Promise.resolve(undefined)
      : optional(getProjectFirmAuthorizations({})),
  ])

  const projectFirmId = authorizations?.find((row) => row.id === authorizationId)?.projectFirmId

  return buildProjectSummary({
    projectId,
    server,
    history: history ?? [],
    projectFirm:
      projectFirmId === undefined ? undefined : await optional(getProjectFirm(projectFirmId)),
  })
}
