import { useNavigate, useParams } from 'react-router-dom'

export const PROJECT_LIST_PATH = '/projects'

/**
 * Editörden çıkış. Menüdeki "Kapat" maddesi K111'de kalktı (aynı işi yapan iki
 * düğme vardı), geriye üst bardaki "← Proje Detay" kaldı — yol yine de tek yerde
 * duruyor: kimin çağırdığından bağımsız olarak hedef burada tanımlı.
 *
 * Hedef, editöre GİRİLEN ekran: `/projects/:projectId`. Adres proje kimliğini
 * taşımıyorsa (doğrudan açılan editör) listeye düşülür. Yol elle kuruluyor,
 * `projectDetailPath` çağrılmıyor: adminNavItems bu dosyadan PROJECT_LIST_PATH
 * alıyor, tersi import döngüsü olurdu.
 *
 * Bu hook yalnız GEZİNİR ve onay SORMAZ. Kaydedilmemiş değişiklik penceresini
 * açan şey düğme değil, gezinmenin router tarafından DURDURULMASI
 * (`useBlocker`, K112) — geri tuşu da aynı kapıdan geçsin diye. Buraya onay
 * eklenirse aynı soru iki yerden sorulur.
 */
export function useCloseEditor(): () => void {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  return () => navigate(projectId ? `${PROJECT_LIST_PATH}/${projectId}` : PROJECT_LIST_PATH)
}
