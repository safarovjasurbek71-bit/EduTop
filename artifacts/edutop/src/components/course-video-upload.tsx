import { useState } from "react";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Video, Trash2 } from "lucide-react";
import { type Lang, tr } from "@/i18n";

const TYPES = ["video/mp4", "video/webm"] as const;
export function CourseVideoUpload({ value, onChange, onBusy, lang, poster }: {
  value: string; onChange: (url: string) => void; onBusy: (busy: boolean) => void; lang: Lang; poster?: string;
}) {
  const upload = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function select(file?: File) {
    if (!file) return;
    setError("");
    if (!(TYPES as readonly string[]).includes(file.type)) { setError(tr("Faqat MP4 yoki WebM video mumkin.", "Допустимы только видео MP4 или WebM.", lang)); return; }
    if (file.size === 0) { setError(tr("Fayl bo‘sh.", "Файл пустой.", lang)); return; }
    if (file.size > 52428800) { setError(tr("Video 50 MB dan oshmasligi kerak.", "Видео не должно превышать 50 МБ.", lang)); return; }
    setBusy(true); onBusy(true);
    try {
      const res = await upload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type as typeof TYPES[number] } });
      const put = await fetch(res.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) throw new Error("upload");
      onChange(`/api/storage${res.objectPath}`);
    } catch { setError(tr("Video yuklanmadi. Kirganingizni tekshiring va qayta urinib ko‘ring.", "Не удалось загрузить видео. Проверьте вход и попробуйте снова.", lang)); }
    finally { setBusy(false); onBusy(false); }
  }
  return <div className="upload-area video-upload" style={{ flexWrap: "wrap" }}>
    <Video size={23} />
    <div><b>{tr("Kurs videosi (ixtiyoriy)", "Видео курса (необязательно)", lang)}</b><small>{tr("MP4 yoki WebM · 50 MB gacha", "MP4 или WebM · до 50 МБ", lang)}</small></div>
    <label className="button button-outline upload-button">{busy ? tr("Yuklanmoqda…", "Загрузка…", lang) : tr("Video tanlash", "Выбрать видео", lang)}
      <input type="file" accept="video/mp4,video/webm" disabled={busy} data-testid="input-course-video" onChange={e => { void select(e.target.files?.[0]); e.target.value = ""; }} /></label>
    {value && <button type="button" className="icon-btn" disabled={busy} onClick={() => onChange("")} aria-label={tr("Videoni olib tashlash", "Удалить видео", lang)} data-testid="button-remove-video"><Trash2 size={16} /></button>}
    {value && <video src={value} poster={poster || undefined} controls playsInline preload="metadata" style={{ width: "100%", maxHeight: 280, borderRadius: 10 }} />}
    {error && <p className="form-error" role="alert" style={{ width: "100%" }}>{error}</p>}
  </div>;
}
