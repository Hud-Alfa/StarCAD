import { useQuery } from '@tanstack/react-query'

import { buildProjectSummary, type ProjectSummary } from './projectSummarySource'
import { getProjectDetail, getProjectHistory } from '../api/projectDetail'
import { getProjectFirmAuthorizations } from '../api/projectFirmAuthorizations'
import { getProjectFirm } from '../api/projectFirmForm'

/**
 * Künyenin tipi ve birleştirme kuralı `projectSummarySource.ts`'te; burada
 * yalnız SORGU tarafı var. Çağıranlar tipi buradan da alabilsin diye
 * yeniden dışa aktarılıyor.
 */
export type { ProjectSummary }

/**
 * Künye proje DETAY ucundan çözülüyor (K63 deseni): rota
 * `/projects/:projectId/editor` olduğu için id her zaman elde, yani yer imiyle
 * ya da F5 ile girişte de çalışıyor. Çizim store'u proje adını/numarasını
 * taşımıyor — orada yalnız kaydedilecek JSON var (CLAUDE.md kural 4).
 *
 * Ekran açılır açılmaz çekiyor: editörde künye her an gerekebilir. Tek seferlik
 * ihtiyaç için `fetchProjectSummary` var (proje detayındaki "PDF İndir").
 */
export function useProjectSummary(projectId: number | undefined): ProjectSummary {
  const { data } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: ({ signal }) => getProjectDetail(projectId ?? 0, signal),
    enabled: projectId !== undefined,
  })

  const server = data?.server

  const { data: history } = useQuery({
    queryKey: ['project-summary-history', projectId],
    queryFn: ({ signal }) => getProjectHistory(projectId ?? 0, signal),
    enabled: projectId !== undefined,
  })

  const authorizationId = server?.projectFirmAuthorizationId ?? undefined
  const { data: authorizations } = useQuery({
    queryKey: ['project-summary-authorizations'],
    queryFn: ({ signal }) => getProjectFirmAuthorizations({}, signal),
    enabled: authorizationId !== undefined,
  })

  const projectFirmId = authorizations?.find((row) => row.id === authorizationId)?.projectFirmId
  const { data: projectFirm } = useQuery({
    queryKey: ['project-summary-firm', projectFirmId],
    queryFn: ({ signal }) => getProjectFirm(projectFirmId ?? 0, { signal }),
    enabled: projectFirmId !== undefined,
  })

  return buildProjectSummary({
    projectId,
    server,
    history: history ?? [],
    projectFirm,
  })
}
