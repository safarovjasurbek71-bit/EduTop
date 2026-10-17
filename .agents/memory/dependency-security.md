---
name: Dependency xavfsizligi
description: Glob va proxy kutubxonalarini tanlashda qayta kiritilmasligi kerak bo‘lgan xavf.
---

Oddiy fayl qidirish yoki glob filtri ishlatilmaydigan proxy uchun to‘liq glob kutubxonalarini qayta qo‘shishdan oldin ularning tranzitiv xavfsizlik holatini tekshiring.

**Why:** `braces` uchun stekni tugatish zaifligini tuzatadigan reliz mavjud bo‘lmagan; eng yangi ota paketlar ham uni olib kirgan. Shu sababli faqat versiyani yangilash barcha zaifliklarni bartaraf eta olmagan.

**How to apply:** O‘xshash vazifalarda avval Node’ning o‘z imkoniyatlari yoki mavjud kutubxonaning kerakli quyi darajali qismini baholang; autentifikatsiya proxysi almashtirilsa, cookie, body, header va javob uzunligi semantikasini regressiya testlari bilan saqlang.
