---
name: Preview jarayonlari va React keshi
description: To‘g‘ri kod va paketlarga qaramay preview buzilishiga olib keladigan mahalliy muhit holatlari.
---

Managed workflow “port already in use” bilan yiqilsa, portni yoki artifact sozlamalarini darhol almashtirmang: eski Vite jarayoni oldingi workflow’dan qolgan bo‘lishi mumkin.
**Why:** Bu muhitda workflow restart muvaffaqiyat xabari bersa ham, avvalgi Vite portni ushlab qolgan va keyingi managed ishga tushirish port to‘qnashuvi bilan yiqilgan.
**How to apply:** Port egasining bu artifact’ga tegishli eski jarayon ekanini tekshiring, faqat o‘sha jarayonni to‘xtating va mavjud managed workflow’ni bir marta qayta ishga tushiring. Yangi parallel server yoki boshqa port yaratmang.

React va ReactDOM versiyalari to‘g‘ri bo‘lsa ham, versiya o‘zgarishidan so‘ng Vite optimallashtirgan eski paketlar qolishi mumkin.
**Why:** Mos manifest va qayta ishga tushirishga qaramay renderer versiyasi yoki hook xatosi eski optimallashtirilgan keshlardan kelgan.
**How to apply:** Avval haqiqiy paket versiyalarini tekshiring; zarur bo‘lsa faqat shu artifact’ning yaratilgan Vite dependency keshini o‘chirib, toza managed restart qiling. Ishlayotgan paketlarni taxminan qayta almashtirmang.
