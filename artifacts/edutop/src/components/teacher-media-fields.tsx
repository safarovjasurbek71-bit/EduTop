import { useState, type Dispatch, type SetStateAction } from "react";
import { useRequestUploadUrl, type TeacherProfileInput } from "@workspace/api-client-react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";

type Lang = "uz" | "ru";
function ImageUpload({ value, onChange, lang, label, onBusy }: {
  value?: string | null; onChange: (url: string | null) => void;
  lang: Lang; label: string; onBusy: (delta: number) => void;
}) {
  const upload = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function select(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10485760) {
      setError(lang === "uz" ? "JPEG, PNG yoki WebP, 10 MB gacha." : "JPEG, PNG или WebP до 10 МБ.");
      return;
    }
    setBusy(true); onBusy(1); setError("");
    try {
      const result = await upload.mutateAsync({ data: {
        name: file.name, size: file.size, contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
      } });
      const response = await fetch(result.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error("Upload failed");
      onChange(`/api/storage${result.objectPath}`);
    } catch {
      setError(lang === "uz" ? "Rasm yuklanmadi. Qayta urinib ko‘ring." : "Не удалось загрузить фото. Попробуйте снова.");
    } finally { setBusy(false); onBusy(-1); }
  }
  return <div className="media-field">
    <strong>{label}</strong>
    {value && <a href={value} target="_blank" rel="noreferrer"><img className="media-preview" src={value} alt={label} /></a>}
    <label className="button button-outline upload-button">
      <ImagePlus size={16} />{busy ? (lang === "uz" ? "Yuklanmoqda…" : "Загрузка…") : (lang === "uz" ? "Rasm tanlash" : "Выбрать фото")}
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void select(e.target.files?.[0]); e.target.value = ""; }} />
    </label>
    {value && <button type="button" className="icon-btn" disabled={busy} onClick={() => onChange(null)} aria-label={lang === "uz" ? "Rasmni olib tashlash" : "Удалить фото"}><Trash2 size={16}/></button>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}

export function TeacherMediaFields({ form, setForm, lang, onBusy, busy }: {
  form: TeacherProfileInput; setForm: Dispatch<SetStateAction<TeacherProfileInput>>;
  lang: Lang; onBusy: (delta: number) => void; busy: boolean;
}) {
  function changeCertificate(index: number, key: string, value: string | null) {
    setForm(old => ({ ...old, certificates: (old.certificates ?? []).map((cert, i) => i === index ? { ...cert, [key]: value } : cert) }));
  }
  return <section className="teacher-media-fields">
    <ImageUpload value={form.avatarUrl} onChange={url => setForm(old => ({ ...old, avatarUrl: url }))} lang={lang} label={lang === "uz" ? "Profil surati" : "Фото профиля"} onBusy={onBusy}/>
    <div className="form-section-head"><h3>{lang === "uz" ? "Sertifikatlar" : "Сертификаты"}</h3>
      <button type="button" disabled={busy || (form.certificates?.length ?? 0) >= 20} className="button button-outline" onClick={() => setForm(old => ({ ...old, certificates: [...(old.certificates ?? []), { titleUz: "", titleRu: "", issuer: null, imageUrl: null }] }))}><Plus size={16}/>{lang === "uz" ? "Sertifikat qo‘shish" : "Добавить сертификат"}</button>
    </div>
    {(form.certificates ?? []).map((cert, index) => <div className="certificate-editor" key={index}>
      <div className="form-grid">
        <label>{lang === "uz" ? "Nomi (o‘zbekcha)" : "Название (узбекский)"}<input required value={cert.titleUz} onChange={e => changeCertificate(index, "titleUz", e.target.value)} /></label>
        <label>{lang === "uz" ? "Nomi (ruscha)" : "Название (русский)"}<input required value={cert.titleRu} onChange={e => changeCertificate(index, "titleRu", e.target.value)} /></label>
        <label>{lang === "uz" ? "Bergan tashkilot" : "Выдавшая организация"}<input value={cert.issuer ?? ""} onChange={e => changeCertificate(index, "issuer", e.target.value || null)} /></label>
      </div>
      <ImageUpload value={cert.imageUrl} onChange={url => changeCertificate(index, "imageUrl", url)} lang={lang} label={lang === "uz" ? "Sertifikat rasmi (ommaviy)" : "Фото сертификата (публичное)"} onBusy={onBusy}/>
      <button type="button" disabled={busy} className="button button-outline" onClick={() => setForm(old => ({ ...old, certificates: old.certificates?.filter((_, i) => i !== index) }))}><Trash2 size={15}/>{lang === "uz" ? "Olib tashlash" : "Удалить"}</button>
    </div>)}
    <p className="subtle">{lang === "uz" ? "Faqat ommaga ko‘rsatmoqchi bo‘lgan rasmlarni yuklang. Sertifikatdagi shaxsiy ma’lumotlarni oldindan yoping." : "Загружайте только публичные изображения. Заранее скройте личные данные в сертификатах."}</p>
  </section>;
}
