import { useSyncExternalStore } from 'react';

export type Lang = 'uz' | 'ru' | 'en';
export const LANGS: Lang[] = ['uz', 'ru', 'en'];
const KEY = 'edutop-lang';
const read = (): Lang => { try { const v = localStorage.getItem(KEY); return v === 'ru' || v === 'en' ? v : 'uz'; } catch { return 'uz'; } };
let current: Lang = read();
const listeners = new Set<() => void>();
export const getLang = () => current;
export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  document.documentElement.lang = l;
  listeners.forEach(f => f());
}
document.documentElement.lang = current;
export function useLang() {
  const lang = useSyncExternalStore(f => { listeners.add(f); return () => { listeners.delete(f); }; }, () => current);
  return { lang, toggle: setLang };
}

/** Pick an original user-written value: show the requested language when present, otherwise whatever exists. */
export const L = (lang: Lang, uz?: string | null, ru?: string | null) => (lang === 'ru' ? (ru || uz) : (uz || ru)) || '';

export const CATEGORY_EN: Record<string, string> = {
  languages: 'Foreign languages', technology: 'Programming & IT', design: 'Design', business: 'Business & marketing',
  science: 'Science', creative: 'Arts & creativity', personal: 'Personal development', computer: 'Computer skills',
  ecommerce: 'Online selling & Uzum', professions: 'Professional skills', beauty: 'Beauty & care', cooking: 'Cooking',
  finance: 'Finance & accounting', other: 'Other courses',
};
export const catName = (c: { id: string; nameUz: string; nameRu: string }, lang: Lang) =>
  lang === 'en' ? (CATEGORY_EN[c.id] ?? c.nameUz) : lang === 'ru' ? c.nameRu : c.nameUz;

const EN: Record<string, string> = {
  'Kurslar': 'Courses', 'E’lon berish': 'Post a listing', 'Kabinet': 'Dashboard', 'Xabarlar': 'Messages', 'Kirish': 'Sign in',
  'Boshlash': 'Get started', 'O‘zingizga mos kursni toping.': 'Find the course that fits you.',
  'Ma’lumotni yuklab bo‘lmadi': 'Could not load data', 'Ulanishni tekshirib, qayta urinib ko‘ring.': 'Check your connection and try again.',
  'Qayta urinish': 'Try again', 'Yangi bilimlar sari': 'Toward new knowledge', 'Tavsiya': 'Featured', 'Onlayn': 'Online',
  'Aralash': 'Hybrid', 'Oflayn': 'In person', 'Sharh yo‘q': 'No reviews', 'Batafsil': 'Details',
  'O‘ZBEKISTONDA TA’LIM TANLOVI': 'LEARNING ACROSS UZBEKISTAN', 'Yangi mahorat.<br/>Yangi imkoniyatlar.': 'New skills.<br/>New opportunities.',
  'Har qanday kasb va yo‘nalishdagi kurslarni toping — shahringizda yoki onlayn. Mos mutaxassis bilan bugunoq boshlang.': 'Find courses in any profession or field — in your city or online. Start today with the right specialist.',
  'O‘qituvchi bilan bevosita aloqa': 'Direct contact with the teacher', 'O‘quvchilar sharhlari': 'Student reviews',
  'Yangi mahorat': 'A new skill', 'bugundan boshlanadi': 'starts today',
  'Kurs yoki o‘qituvchi nomi bo‘yicha qidiring': 'Search by course or teacher name', 'Shahar': 'City', 'Format': 'Format',
  'Kurs topish': 'Find a course', 'O‘ZINGIZGA MOSINI TANLANG': 'PICK WHAT FITS YOU', 'Qiziqishingiz qayerda?': 'What are you into?',
  'Kategoriyalar': 'Categories', 'Barchasi': 'All', 'EDUTOP TANLOVI': 'EDUTOP PICKS', 'Tavsiya etilgan kurslar': 'Featured courses',
  'KURS KATALOGI': 'COURSE CATALOG', 'Siz uchun topilganlar': 'Picked for you', 'Faol kurslar orasidan keyingi qadamingizni tanlang.': 'Choose your next step among active courses.',
  'Saralash': 'Sort', 'Mosligi': 'Relevance', 'Reyting': 'Rating', 'Yangi': 'Newest', 'Narx: pastdan': 'Price: low to high',
  'Narx: yuqoridan': 'Price: high to low', 'Bepul': 'Free', 'Chegirmali': 'Discounted', 'Pullik': 'Paid', 'Oldingi': 'Previous', 'Keyingi': 'Next',
  'Hozircha kurs topilmadi': 'No courses found yet', 'Filtrlarni o‘zgartiring yoki keyinroq qaytib ko‘ring.': 'Change the filters or check back later.',
  'BILIMINGIZNI ULASHING': 'SHARE WHAT YOU KNOW', 'Mutaxassismisiz? O‘z auditoriyangizni toping.': 'Are you a specialist? Find your audience.',
  'Kursingizni joylashtiring, so‘rovlarni bir joyda boshqaring.': 'Post your course and manage inquiries in one place.',
  'O‘qituvchi sifatida boshlash': 'Start as a teacher', 'Kurslarga qaytish': 'Back to courses', 'Kelishiladi': 'To be agreed',
  'O‘qituvchi profili': 'Teacher profile', 'Kurs haqida': 'About the course', 'Dars jadvali': 'Schedule', 'Jadval kelishiladi': 'To be agreed',
  'Joylashuv': 'Location', 'Masofadan': 'Remote', 'Aniqlashtiring': 'Ask the teacher', 'Boshlanish sanasi': 'Start date',
  'O‘QUVCHILAR FIKRI': 'STUDENT FEEDBACK', 'Sharhlar': 'Reviews', 'Sharh yozish': 'Write a review', 'Ismingiz': 'Your name',
  'Kurs taassurotingiz': 'Your impressions of the course', 'Yuborilmoqda…': 'Sending…', 'Yuborish': 'Send',
  'Birinchi sharhni qoldiring': 'Leave the first review', 'Tajriba boshqalarga to‘g‘ri tanlov qilishga yordam beradi.': 'Your experience helps others choose well.',
  'Kurs narxi': 'Course price', 'O‘qituvchiga to‘g‘ridan-to‘g‘ri yozing.': 'Write to the teacher directly.', 'Ism Familiya': 'First Last name',
  'Xabar': 'Message', 'Kurs haqida so‘ramoqchiman…': 'I’d like to ask about the course…', 'So‘rov yuborish': 'Send inquiry',
  'To‘g‘ridan-to‘g‘ri aloqa': 'Direct contact', 'Veb-sayt': 'Website', 'To‘lov sahifasi': 'Payment page',
  'Javobni qaytish havolasi orqali davom ettirasiz.': 'You will continue the conversation via your return link.',
  'MUTAXASSIS': 'SPECIALIST', 'yil tajriba': 'years of experience', 'Telefon qilish': 'Call', 'Yondashuv va tajriba': 'Approach and experience',
  'Sertifikatlar': 'Certificates', 'Faol kurslar': 'Active courses', 'Hozircha faol kurs yo‘q': 'No active courses yet',
  'Yangi kurslar shu yerda ko‘rinadi.': 'New courses will appear here.', 'Davom etish uchun kiring': 'Sign in to continue',
  'O‘qituvchi kabineti va xabarlar faqat hisob bilan ochiladi.': 'The teacher dashboard and messages need an account.',
  'JPEG, PNG yoki WebP rasm 10 MB gacha bo‘lishi kerak.': 'Use a JPEG, PNG or WebP image up to 10 MB.',
  'Rasm yuklanmadi. Kirganingizni tekshiring va qayta urinib ko‘ring.': 'Photo upload failed. Check that you are signed in and try again.',
  'Kurs saqlandi. Uni quyidagi ro‘yxatda boshqarishingiz mumkin.': 'Course saved. You can manage it in the list below.',
  'KURS MA’LUMOTLARI': 'COURSE DETAILS', 'Kursni tahrirlash': 'Edit course', 'Yangi kurs yaratish': 'Create a new course',
  'Kurs muqovasi': 'Course cover', 'JPEG, PNG yoki WebP · 10 MB gacha': 'JPEG, PNG or WebP · up to 10 MB', 'Rasm biriktirildi': 'Image attached',
  'Yuklanmoqda…': 'Uploading…', 'Rasm tanlash': 'Choose image', 'Kurs nomi': 'Course title', 'Tavsif (ixtiyoriy)': 'Description (optional)',
  'Kategoriya': 'Category', 'Tanlang': 'Select', 'Dars formati': 'Delivery format', 'Narxi (so‘m)': 'Price (UZS)',
  'Eski narx (ixtiyoriy)': 'Old price (optional)', 'Boshlanish sanasi (ixtiyoriy)': 'Start date (optional)',
  'Tugash sanasi (ixtiyoriy)': 'End date (optional)', 'E’lon muddati (ixtiyoriy)': 'Listing expiry (optional)',
  'Shahar (oflayn uchun, ixtiyoriy)': 'City (for in-person, optional)', 'Jadval': 'Schedule', 'To‘lov sahifasi havolasi': 'Payment page link',
  'Qo‘shimcha tarjimalar (ixtiyoriy)': 'Extra translations (optional)', 'Kurs nomi — ruscha': 'Course title — Russian',
  'Tavsif — ruscha': 'Description — Russian', 'Shahar (ruscha)': 'City — Russian', 'Jadval (ruscha)': 'Schedule — Russian',
  'Muddat kiritilmasa, e’lon 90 kun faol turadi.': 'If no expiry is set, the listing stays active for 90 days.',
  'Darhol e’lon qilish': 'Publish immediately', 'O‘chirib qo‘ysangiz, qoralama sifatida saqlanadi.': 'If off, the course is saved as a draft.',
  'Saqlanmoqda…': 'Saving…', 'O‘zgarishlarni saqlash': 'Save changes', 'Kursni saqlash': 'Save course', 'Umumiy': 'Overview',
  'Kurslar va profil': 'Courses & profile', 'Bilimingiz — kimningdir keyingi qadami.': 'Your knowledge is someone’s next step.',
  'O‘QITUVCHI MAYDONI': 'TEACHER WORKSPACE', 'Profil va kurslar': 'Profile & courses',
  'Faqat ism-familiya majburiy. Qolganini keyin to‘ldirishingiz mumkin.': 'Only your full name is required. Fill in the rest whenever you like.',
  'Kurs qo‘shish': 'Add course', '1-QADAM · O‘QITUVCHI PROFILI': 'STEP 1 · TEACHER PROFILE', 'Siz haqingizda': 'About you',
  'Ism-familiya': 'Full name', 'Mutaxassislik (ixtiyoriy)': 'Specialization (optional)', 'Bio (ixtiyoriy)': 'Bio (optional)',
  'Tajriba (yil)': 'Experience (years, optional)', 'Telefon': 'Phone', 'Shahar (ixtiyoriy)': 'City (optional)', 'Telegram havolasi': 'Telegram link',
  'YouTube kanali': 'YouTube channel', 'Boshqa tildagi matnlar (ixtiyoriy)': 'Text in another language (optional)',
  'Ism-familiya — ruscha': 'Full name — Russian', 'Mutaxassislik (ruscha)': 'Specialization — Russian', 'Bio — ruscha': 'Bio — Russian',
  'Profil saqlandi': 'Profile saved', 'Profilni saqlash': 'Save profile', 'E’LONLARINGIZ': 'YOUR LISTINGS', 'Mening kurslarim': 'My courses',
  'Tahrirlash': 'Edit', 'Kursni o‘chirishni tasdiqlaysizmi?': 'Delete this course?', 'O‘chirish': 'Delete',
  'Hali kurs qo‘shmadingiz': 'You haven’t added a course yet', 'Yuqoridagi forma orqali birinchi e’loningizni yarating.': 'Create your first listing with the form above.',
  'Ta’lim — oldinga yo‘l.': 'Learning is the way forward.', 'XUSH KELIBSIZ': 'WELCOME', 'O‘qituvchi kabineti': 'Teacher dashboard',
  'Bugungi faoliyatingiz va o‘quvchilar bilan aloqalar.': 'Your activity today and conversations with students.',
  'Kurs e’lon qilish': 'Publish a course', 'Qoralamalar': 'Drafts', 'Yangi xabarlar': 'New messages', 'O‘rtacha reyting': 'Average rating',
  'E’LONLAR': 'LISTINGS', 'So‘nggi kurslar': 'Latest courses', 'Barchasini ko‘rish': 'View all', 'Kurslar hali yo‘q': 'No courses yet',
  'Birinchi kursingizni yarating.': 'Create your first course.', 'ALOQALAR': 'CONVERSATIONS', 'Yaqindagi so‘rovlar': 'Recent inquiries',
  'Yangi so‘rovlar shu yerda': 'New inquiries will show up here', 'Kurslaringizga kelgan xabarlar ko‘rinadi.': 'Messages about your courses appear here.',
  'Har bir savol — yangi imkoniyat.': 'Every question is a new opportunity.', 'O‘QUVCHILAR BILAN ALOQA': 'STUDENT CONVERSATIONS',
  'Kurslaringizga kelgan so‘rovlar va javoblar.': 'Inquiries and replies about your courses.', 'Hozircha xabar yo‘q': 'No messages yet',
  'O‘quvchilar kursga qiziqish bildirganda yozishmalar shu yerda chiqadi.': 'Conversations appear here when students show interest in a course.',
  'Javob yuborilmadi.': 'Reply was not sent.', 'Barcha xabarlar': 'All messages', 'Javobingizni yozing…': 'Write your reply…',
  'Javob yuborish': 'Send reply', 'Xabar yuborilmadi.': 'Message was not sent.', 'Kurslarni ko‘rish': 'Browse courses',
  'Xavfsiz suhbat': 'Secure chat', 'O‘qituvchi bilan suhbat shu yerda davom etadi. Havolani saqlab qo‘ying.': 'Your chat with the teacher continues here. Save this link to return.',
  'Xabar yozing…': 'Write a message…', 'O‘rganish uchun o‘z yo‘lingizni toping.': 'Find your own way to learn.',
  'Kabinetga o‘tish': 'Go to dashboard', 'Bilimingizga yangi sahifa oching.': 'Open a new page of knowledge.',
  'O‘zingizga mos kursni toping': 'Find the course that fits you', 'Hisobni tekshirib bo‘lmadi.': 'Could not verify your session.',
  'Telegram orqali kirish': 'Sign in with Telegram', 'Tekshirilmoqda…': 'Checking…', 'Telegram Login hali sozlanmagan': 'Telegram Login is not set up yet',
  'Chiqib bo‘lmadi. Qayta urinib ko‘ring.': 'Could not sign out. Please try again.', 'Chiqish': 'Sign out',
  'JPEG, PNG yoki WebP, 10 MB gacha.': 'JPEG, PNG or WebP, up to 10 MB.', 'Rasm yuklanmadi. Qayta urinib ko‘ring.': 'Image upload failed. Please try again.',
  'Rasmni olib tashlash': 'Remove image', 'Profil surati': 'Profile photo', 'Sertifikat qo‘shish': 'Add certificate',
  'Nomi (o‘zbekcha)': 'Title', 'Nomi (ruscha, ixtiyoriy)': 'Title — Russian (optional)', 'Bergan tashkilot': 'Issuing organization',
  'Sertifikat rasmi (ommaviy)': 'Certificate image (public)', 'Olib tashlash': 'Remove',
  'Faqat ommaga ko‘rsatmoqchi bo‘lgan rasmlarni yuklang. Sertifikatdagi shaxsiy ma’lumotlarni oldindan yoping.': 'Upload only images you are happy to show publicly. Cover personal details on certificates first.',
  'Bepul kurslar': 'Free courses', 'Chegirmali kurslar': 'Discounted courses', 'Qayta yuklash': 'Reload', 'Hozircha faol e’lon yo‘q.': 'No active listings yet.',
  'So‘rov yuborilmadi. Qayta urinib ko‘ring.': 'Inquiry was not sent. Please try again.', 'Sharh yuborilmadi.': 'Review was not sent.',
  'Kurs saqlanmadi.': 'Course was not saved.', 'Kurs yaratilmadi.': 'Course was not created.', 'Profil saqlanmadi.': 'Profile was not saved.',
  'E’lon qilingan': 'Published', 'Qoralama': 'Draft', 'Muddati tugagan': 'Expired', 'Chiqish.': 'Sign out', 'Faqat MP4 yoki WebM video mumkin.': 'Only MP4 or WebM video is allowed.', 'Fayl bo‘sh.': 'The file is empty.',
 'Video 50 MB dan oshmasligi kerak.': 'Video must not exceed 50 MB.', 'Video yuklanmadi. Kirganingizni tekshiring va qayta urinib ko‘ring.': 'Video upload failed. Check that you are signed in and try again.',
 'Kurs videosi (ixtiyoriy)': 'Course video (optional)', 'MP4 yoki WebM · 50 MB gacha': 'MP4 or WebM · up to 50 MB', 'Video tanlash': 'Choose video',
 'Videoni olib tashlash': 'Remove video', 'Kurs videosi': 'Course video', 'Videoni yuklab bo‘lmadi. Keyinroq qayta urinib ko‘ring.': 'Could not load the video. Please try again later.',
 'Reyting — foydalanuvchilarning 1–5 baholari o‘rtachasi. Yuklangan sertifikatlarni o‘qituvchining o‘zi taqdim etadi, ular mustaqil tekshirilmaydi va yulduzlarni oshirmaydi.': 'The rating is the average of user ratings from 1 to 5. Uploaded certificates are provided by the teacher, are not independently verified, and do not raise the stars.', 'Narx turi': 'Price type', 'Pulli': 'Paid',
  'Bepul e’lon uchun narx kerak emas. Pastda kanal yoki havola qo‘shishingiz mumkin.': 'No price is needed for a free listing. You can add a channel or link below.',
  'Asl narx (so‘m)': 'Original price (UZS)', 'Chegirma foizi (1–100)': 'Discount percent (1–100)', 'Yakuniy narx (avtomatik)': 'Final price (automatic)',
  'Resurs havolasi (ixtiyoriy)': 'Resource link (optional)', 'Telegram kanali, YouTube yoki boshqa kurs havolasi — bepul e’lonlar uchun ayniqsa foydali.': 'A Telegram channel, YouTube or other course link — especially useful for free listings.',
  'Pullik kurs uchun narx 0 dan katta bo‘lishi kerak.': 'A paid course needs a price above 0.',
  'Chegirma uchun asl narx va 1–100 oralig‘ida butun foiz kiriting.': 'For a discount, enter the original price and a whole percent from 1 to 100.',
  'Bepul kursni ochish': 'Open free course', 'Resursni ochish': 'Open resource', 'Dastur yaratuvchi bilan bog‘lanish': 'Developer contact',
};

export const tr = (uz: string, ru: string, lang: Lang = current) => lang === 'uz' ? uz : lang === 'ru' ? ru : (EN[uz] ?? ru);

const locale = (l: Lang) => l === 'ru' ? 'ru-RU' : l === 'en' ? 'en-GB' : 'uz-UZ';
export const money = (v?: number | null) => {
  if (v == null) return '';
  if (v === 0) return tr('Bepul', 'Бесплатно');
  const l = current;
  return `${new Intl.NumberFormat(locale(l)).format(v)} ${l === 'ru' ? 'сум' : l === 'en' ? 'UZS' : 'so‘m'}`;
};
export const date = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) || d.getFullYear() < 1980 ? '' : d.toLocaleDateString(locale(current), { day: 'numeric', month: 'short', year: 'numeric' });
};
export const dateTime = (v?: string | null) => v ? new Date(v).toLocaleString(locale(current)) : '';

export const apiMsg = (e: unknown, lang: Lang, fallbackUz: string, fallbackRu: string) => {
  const message = (e as { data?: { error?: unknown } })?.data?.error;
  if (typeof message === 'string' && lang !== 'en') return message.includes(' / ') ? message.split(' / ')[lang === 'uz' ? 0 : 1] || message : message;
  return tr(fallbackUz, fallbackRu, lang);
};
