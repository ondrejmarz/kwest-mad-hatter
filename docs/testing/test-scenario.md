# Testovací scénář

Ruční end-to-end test celé hry na třech zařízeních. Prochází aplikaci tak, jak ji používá skupina:
vstup, založení postav, příprava katalogu a šest herních kol, každé zakončené vyhodnocením. Kroky na
sebe navazují, proto je neprohazuj a nepřeskakuj. Pozdější kola počítají se stavem z předchozích,
hlavně se zůstatky mincí.

Pouštěj ho po každém vydání, které mění herní logiku nebo obrazovky. Na drobné opravy stačí
[rychlá verze](#rychlá-verze-smoke-test). Celý průchod trvá zhruba hodinu a půl.

Tlačítka a volby jsou **tučně**, texty, které má aplikace ukázat, jsou v „uvozovkách“. Kroky mají
čísla (např. **K2.6**), aby šlo chybu nahlásit jako „padá v K2.6“.

## Zařízení a postavy

|       | Zařízení | Prohlížeč     | Postava | PIN  | Role                   |
| ----- | -------- | ------------- | ------- | ---- | ---------------------- |
| **A** | Android  | Chrome        | Adam    | 1111 | hráč                   |
| **B** | iPhone   | Safari        | Bára    | 2222 | hráč                   |
| **C** | Windows  | Chrome / Edge | Cyril   | 3333 | hráč **a** organizátor |

Organizátorem je C, protože import katalogu znamená kopírovat řádky z tabulky, a to jde nejlíp na
počítači.

## Příprava

1. Nasaď verzi, kterou chceš testovat, a poznamenej si její číslo (build ho tvoří jako
   `RRRR.MM.DD.HHmm`).
2. Ve Firebase konzoli založ **prázdnou skupinu**, protože z aplikace se zakládat nedá. Na každý
   průchod novou, např. s id `test-20260926`:
   - dokument `turnuses/test-20260926` s poli `name` (string, např. „Test 26. 9.“), `slug`
     (string, stejné jako id), `archived` = `false`, `currentDay` = `1`, `dayLocked` = `false`,
     `publicProfiles` = `false`, `startingCoins` = `0`, `failPenalty` = `100`, `noPickPenalty` =
     `100`, `allowNegativeBalance` = `true`, `maxActiveRewardsPerPlayer` = `1`,
     `maxActivePunishesPerPlayer` = `1`, `allowTaskSwitch` = `true`, `currentDayCategories` a `nextDayCategories` (prázdná pole).
     Čísla zadej jako typ `number`, ne `string`. Na hodnotách nezáleží, v kroku 3.2 je
     organizátor přepíše. (V kódu se kolu říká `day`, proto `currentDay` a `dayLocked`.)
   - dokument `turnuses/test-20260926/private/config` s poli `playerCode` (např. `TEST1`) a
     `adminCode` (např. `ADMTEST1`).
3. Na C otevři testovací data [`tasks.tsv`](tasks.tsv) (15 úkolů) a [`rewards.tsv`](rewards.tsv)
   (5 odměn). Budeš je kopírovat do importu.
4. Pokud si zařízení pamatuje jinou skupinu a rovnou do ní skočí, odejdi z ní ikonou vlevo v
   hlavičce.

### Tahák: zůstatky mincí

Pro test platí: počáteční mince 100, pokuta za nesplnění 50, pokuta za kolo bez úkolu 30. Úkol
vynese `80 + 20 × obtížnost`, takže obtížnost 1 dá 100 a obtížnost 4 dá 160.

| Po kroku                 | Adam (A) | Bára (B) | Cyril (C) |
| ------------------------ | -------: | -------: | --------: |
| 3.3 schválení            |      100 |      100 |       100 |
| K1.14 vyhodnocení kola 1 |      200 |      220 |       240 |
| K2.12 bonus +40          |      240 |      260 |       280 |
| K2.17 vyhodnocení kola 2 |      290 |      260 |       150 |
| K3.6 vyhodnocení kola 3  |      410 |      280 |       270 |
| K4.5 vyhodnocení kola 4  |      560 |      430 |       390 |
| K5.6 vyhodnocení kola 5  |      360 |      280 |       250 |
| K6.10 vyhodnocení kola 6 |      380 |      380 |       170 |
| Z.2 test podlahy         |      380 |      380 |         0 |

Když se po vyhodnocení zůstatek liší, zastav se a zjisti proč. Další kola na něm stojí.

---

## Fáze 0 — Před vstupem: instalace a vzhled

- [ ] **0.1** · všichni — Otevři adresu aplikace.
  - Nahoře záložky **Skupiny**, **Pravidla**, **Kontakt**, **Aplikace**. Na telefonu se mezi nimi
    dá přejíždět prstem.
  - V hlavičce vlevo verze a ©. Na **Aplikace** je nadpis „O aplikaci“ a „Verze …“ s číslem
    nasazené verze.
  - **Pravidla**: „Pravidla hry se objeví v další fázi.“ **Kontakt**: odkaz **GitHub Projekt**.
- [ ] **0.2** · všichni — Nainstaluj aplikaci ještě **před** vstupem do skupiny. Na iPhonu má
      aplikace na ploše vlastní úložiště, oddělené od Safari. Kdo vstoupí v Safari a teprve pak
      nainstaluje, je v nainstalované aplikaci nové zařízení.
  - A: banner „Přidej si aplikaci na plochu“ → **Nainstalovat** → objeví se systémové okno Chromu →
    nainstaluj a spusť z plochy. Banner už tam není.
  - B: banner → **Jak na to** → návod pro Safari → přidej na plochu a spusť. Volitelně otevři odkaz
    v Chromu na iPhonu, návod má varovat „Otevři odkaz v Safari…“.
  - C: **Nainstalovat** v Chromu nebo Edgi → aplikace se otevře ve vlastním okně.
  - Zbytek testu dělej na A a B v nainstalované aplikaci.
- [ ] **0.3** · A, B — Přepni telefon do tmavého režimu.
  - Aplikace ztmavne. Na iPhonu jsou u výběrových polí vidět šipky. Pak přepni zpátky.
- [ ] **0.4** · A nebo B — V prohlížeči (ne v nainstalované aplikaci) otoč telefon naležato.
  - Zobrazí se „Otoč telefon na výšku“.
- [ ] **0.5** · kdokoli — Přepínačem jazyka vpravo nahoře zkus CS → EN → DE a zase CS.
  - Texty rozhraní se přeloží celé. Názvy skupin zůstanou, jak je organizátor napsal.

## Fáze 1 — Vstup do skupiny

- [ ] **1.1** · všichni — Záložka **Skupiny**.
  - V seznamu je testovací skupina.
- [ ] **1.2** · A — Ťukni na skupinu, zadej špatný kód a dej **Vstoupit**.
  - Pozadí za dialogem je ztmavené a rozostřené.
  - „Neplatný kód. Zkus to znovu.“
  - Se správným hráčským kódem se otevře záložka **Hráči**. Dole jsou záložky **Hráči**,
    **Úkoly**, **Odměny**, **Profil**. Na Hráčích je „Zatím tu nejsou žádní hráči.“, na Odměnách
    „Zatím žádné odměny.“
- [ ] **1.3** · B, C — Vstupte do skupiny hráčským kódem. Organizátorem se C stane až v 3.1.
- [ ] **1.4** · A — **Profil**.
  - „Nemáš vybranou postavu“. Tlačítko **Přejít na Hráče** přepne na Hráče.
- [ ] **1.5** · A — Aplikaci úplně zavři a spusť znovu.
  - Otevře se rovnou ve skupině, bez kódu.
- [ ] **1.6** · A — Přejížděj prstem po obsahu doleva a doprava.
  - Záložky se přepínají ve stejném pořadí jako na liště.

## Fáze 2 — Postavy

- [ ] **2.1** · A — **Hráči** → **+** → „Nový hráč“.
  - S prázdným jménem **Přidat** ukáže „Zadej jméno.“
  - Jméno „Adam“ a PIN `12`: „PIN musí být 4 číslice.“
  - S PINem `1111` se Adam objeví všem v sekci „Čeká na schválení“, šedě a bez tlačítek (zatím tu
    není organizátor).
- [ ] **2.2** · B, C — B založí Báru (PIN 2222), C Cyrila (3333) a navíc postavu „Omyl“ (0000).
  - B: když ťukneš do textového pole, stránka se nepřiblíží.
- [ ] **2.3** · všichni — Zkus ťuknout na čekající postavu.
  - Nic se neotevře. Čekající postavu si nejde vzít.

## Fáze 3 — Organizátor, nastavení a katalog

- [ ] **3.1** · C — Stiskni a 3 s drž název aplikace uprostřed hlavičky (na PC drž tlačítko myši).
  - Otevře se „Admin přístup“. Se špatným kódem **Odemknout** ukáže „Admin kód není platný.“
  - S admin kódem se čtvrtá záložka změní na **Profil+** a na ní přibudou **Zamknout kolo**,
    **Výběr kategorií úkolů**, **Import z tabulky**, **Nastavení turnusu** a **Odhlásit z admina**.
    Na Úkolech a Odměnách se objeví **+**, u čekajících postav **Zamítnout** / **Schválit**.
  - A a B mají dál jen **Profil** a nic z toho nevidí.
- [ ] **3.2** · C — **Nastavení turnusu**. Musí to být **před** schválením hráčů, protože
      počáteční mince se připisují v okamžiku schválení.
  - Nastav: Počáteční mince **100**, Pokuta za nesplnění **50**, Pokuta bez úkolu **30**, Hráč max
    odměn za kolo **1**, Hráč max terčem za kolo **1**, ✓ Povolit záporný zůstatek, ✓ Lze měnit probíhající úkoly, ☐ Veřejné
    profily → **Uložit**.
  - Po znovuotevření jsou hodnoty uložené.
- [ ] **3.3** · C — **Schválit** Adama, Báru a Cyrila, **Zamítnout** Omyl.
  - Všichni: Omyl zmizel. Tři karty mají **100** mincí a chipy „Nemá úkol“ a „Nemá rezervaci“.
- [ ] **3.4** · A — Ťukni na Adama.
  - Text „Zadej PIN a přihlas se jako Adam…“. PIN `9999` ukáže „Špatný PIN.“
  - `1111` → **Přihlásit se**: Adam je nahoře, zvýrazněný a s chipem „Ty“, ale jen na A.
  - B si stejně vezme Báru (2222) a C Cyrila (3333).
  - **Profil**: karta postavy, Statistiky samé nuly, Historie „Zatím žádné transakce.“, „Tvoje
    rezervace na příští kolo“ je „Zatím žádná“.
- [ ] **3.5** · C — Ťukni na Báru a přihlas se PINem 2222.
  - C má teď „Ty“ u Báry a Cyril ho ztratil. Jedno zařízení drží jednu postavu.
  - B má Báru pořád. Jedna postava může být na víc zařízeních.
  - C se vrátí na Cyrila (3333). Na B se nic nezmění.
  - C ťukne na svou kartu: „Podrobnosti a historii najdeš na svém Profilu.“ a **Odhlásit se od
    postavy**. Na to zatím neťukej.
- [ ] **3.6** · C — **Import z tabulky** → **Úkoly** → vlož celý `tasks.tsv`.
  - Ukáže se „Náhled: 15 nových, 0 úprav“. **Naimportovat** → „Hotovo: 15 nových, 0 úprav.“
  - Vlož to samé znovu: „Náhled: 0 nových, 15 úprav“ → **Naimportovat**.
  - Všichni vidí na Úkolech 15 úkolů, žádný dvakrát. P1–P4 mají chip „Dvojice“, G1 „Skupina
    (3–4)“, G2 „Skupina (4–6)“. S1 má +100 a jednu tečku obtížnosti, S6 +160 a čtyři.
- [ ] **3.7** · C — Import → **Odměny** → vlož `rewards.tsv`.
  - Ukáže se „Náhled: 5 nových, 0 úprav“ → **Naimportovat**.
  - Pět odměn a každá má chip formy (Odměna / Trest pro někoho / Trest pro všechny).
- [ ] **3.8** · C — Tužka u **S4 Schody**, Obtížnost **1**.
  - Formulář ukazuje „Podle obtížnosti: +100“. Po **Uložit** má S4 +100 a jednu tečku.
- [ ] **3.9** · C — Tužka u **P3 Tandem**, ✓ **Ruční mince**, Odměna **150** → **Uložit**.
  - P3 má +150. Po znovuotevření je Ruční mince pořád zaškrtnuté.
- [ ] **3.10** · C — **+** na Úkolech.
  - Bez názvu **Uložit** ukáže „Zadej název.“
  - Vyplň: Název „H4 Origami“, Popis „Poskládej z papíru zvířátko.“, Štítky „Hlava|Head|Kopf“,
    Obtížnost 2, Min. hráčů 1, Max. hráčů 1. Ukáže se „Podle obtížnosti: +120“ → **Uložit**.
  - Úkolů je 16 a H4 má chip „Hlava“.
- [ ] **3.11** · C — Tužka u **R1 Dezert navíc**, Cena **50** → **Uložit**.
- [ ] **3.12** · C — **+** na Odměnách.
  - Vyplň: „R6 Nosič batohu“, „Vybraní hráči ponesou na výletě batoh.“, Cena 90, Forma **Trest
    pro někoho**. Objeví se Min. terčů / Max. terčů, dej **1** a **2** → **Uložit**.
- [ ] **3.13** · A — Řazení a filtry.
  - Úkoly: **Nejtěžší** dá nahoru úkoly s obtížností 4 (G2, S6). Filtr **Dvojice** nechá P1–P4,
    **Skupiny** G1 a G2, **Hlava** H1–H4.
  - Odměny: filtr **Trest pro někoho** nechá R4 a R6.
  - Zavři a spusť aplikaci. Řazení i filtry zůstaly. Pak vrať **Abecedně A–Z** a všechny
    kategorie/formy.
  - B: při rolování dlouhého seznamu zůstává hlavička i lišta na místě.

---

## Herní kola

Každé kolo má stejný rytmus: organizátor otevře kategorie, hráči si berou úkol na probíhající kolo
a rezervují na příští, na konci organizátor kolo vyhodnotí. Kol může být víc za den nebo jedno na
několik dní, podle toho, jak skupina hraje. Při vyhodnocení se kategorie pro příští kolo stanou
kategoriemi probíhajícího kola a nabídka na příští kolo se vyprázdní. Proto každé kolo začíná
otevřením kategorií.

Dokud je kolo otevřené, nabízí dialog úkolu i **Přepnout na tenhle** nebo **Vzít na probíhající
kolo**. Ťukej na ně jen tam, kde to krok výslovně říká.

Dvojice se dělá spolu, nebo vůbec: kdo z dvojice zruší rezervaci, zarezervuje si něco jiného nebo
se v probíhajícím kole přepne na jiný úkol, zruší dvojici i parťákovi.

## Kolo 1 — úkol na probíhající kolo, rezervace na příští

- [ ] **K1.1** · C — **Výběr kategorií úkolů**.
  - Obě kolonky nabízejí Jednotlivci, Dvojice, Skupiny, Hlava, Pohyb, Spolupráce, Tým.
  - Kategorie pro probíhající kolo: ✓ **Jednotlivci**. Kategorie pro příští kolo: ✓ **Pohyb**.
    Zavři.
- [ ] **K1.2** · A — Úkoly → ✓ **Jen na probíhající kolo**.
  - Zůstanou jen úkoly pro jednotlivce (S1–S6, H1–H4), bez dvojic a skupin. Filtr pak vypni.
- [ ] **K1.3** · A, B — Oba otevřete **S1 Dřepy**. A čte „Nevyšla ti rezervace? Vezmi si tenhle
      úkol na probíhající kolo.“ a ťukne **Vzít na probíhající kolo**.
  - A: S1 má chip „Vybraný“. Na Hráčích má Adam „Má úkol“ a kartu „Úkol“ s názvem a popisem.
  - B: tlačítko v otevřeném dialogu zmizí. Když B ťukne ve stejnou chvíli, dostane „Tenhle úkol už
    si v tomhle kole někdo vzal.“ V seznamu má S1 u B i C chip „Zabraný“.
- [ ] **K1.4** · B — Vezmi si **S2 Běh kolem budovy** na probíhající kolo.
- [ ] **K1.5** · C — Vezmi si **H1 Hádanka**. Pak otevři **S3 Plank**, kde stojí „Chceš jiný úkol?
      Přepni se na tenhle, dokud je volný.“ a ťukni **Přepnout na tenhle**.
  - C má S3. H1 už u nikoho nemá „Zabraný“, uvolnil se.
- [ ] **K1.6** · C, B — Měnění úkolů jde vypnout. C: **Nastavení turnusu** → odškrtni **Lze měnit
      probíhající úkoly** → **Uložit**.
  - B otevře **H1 Hádanka**. Tlačítko **Přepnout na tenhle** tam není, místo něj stojí „Úkol v
    probíhajícím kole teď měnit nejde.“ Hráč bez úkolu by si úkol vzít mohl, zakázané je jen
    měnění.
  - C nastavení zase zaškrtne. U B se **Přepnout na tenhle** vrátí, neťukej na něj.
- [ ] **K1.7** · A — ✓ **Jen na příští kolo**.
  - Zbudou jen S2–S6. S1 máš v tomhle kole, takže ho rezervovat nejde. Filtr vypni.
- [ ] **K1.8** · A — Otevři **H2 Básnička**, pak **S1 Dřepy**.
  - H2: „Tahle kategorie není v příštím kole otevřená.“
  - S1: „Tenhle úkol už si měl.“
- [ ] **K1.9** · A — **S5 Kliky** → **Rezervovat na příští kolo**.
  - A: S5 má chip „Rezervováno“. Na Profilu je „Tvoje rezervace na příští kolo: S5 Kliky“.
  - B, C: S5 má „Má zájemce“, ale bez jména. Na Hráčích má Adam „Má rezervaci“.
- [ ] **K1.10** · A — Otevři **S4 Schody**. Stojí tam „Nahradí tvoji rezervaci: S5 Kliky“ →
      **Rezervovat na příští kolo**.
  - U B a C zájemce ze S5 zmizel a je teď na S4.
- [ ] **K1.11** · B, C — B rezervuje **S5 Kliky**, C **S6 Švihadlo**.
- [ ] **K1.12** · C — Otevři S6: „Rezervováno na příští kolo“ → **Zrušit rezervaci**.
  - Cyril má „Nemá rezervaci“, S6 nemá zájemce. Pak S6 zase rezervuj.
- [ ] **K1.13** · C — Zkouška zámku: **Profil+** → **Zamknout kolo**. Dialog nech otevřený.
  - A otevře libovolný úkol: „Kolo je zamčené, teď to měnit nejde.“ a žádná tlačítka.
  - B otevře libovolnou odměnu: „Kolo je zamčené, teď přihazovat nejde.“
  - C zavře dialog (✕ pod ním) bez vyhodnocení. U A se tlačítka v úkolu vrátí.
- [ ] **K1.14** · C — **Zamknout kolo**. Otevře se „Vyhodnocení kola“, „Kolo 1“ a seznam Adam,
      Bára, Cyril s popisem jejich úkolu.
  - Dokud nic nezaškrtneš, ukazuje náhled všem „Nesplněno −50“. Nezaškrtnutý hráč úkol nesplnil.
  - Zaškrtni všechny tři. **Zúčtování**: Adam Splněno +100, Bára +120, Cyril +140. **Přiděleno
    na příští kolo**: Adam → S4 Schody, Bára → S5 Kliky, Cyril → S6 Švihadlo.
  - **Vyhodnotit kolo** → dialog se sám zavře.
- [ ] **K1.15** · všichni — Kontrola.
  - Hráči: **200 / 220 / 240**. Každý má „Má úkol“ (S4 / S5 / S6) a „Nemá rezervaci“.
  - Profil, Statistiky: Splněné úkoly 1, Vydělané mince 100 / 120 / 140, zbytek 0.
  - Historie: „Splněno: S1 Dřepy“, „Kolo 1“, +100 a zůstatek 200. **Zobrazit víc** ukáže nahoře
    „Počáteční zůstatek“ 100.

## Kolo 2 — dvojice, bonus, přihozy, nesplněný úkol

- [ ] **K2.1** · A — Zkus rezervovat jakýkoli úkol.
  - „Tahle kategorie není v příštím kole otevřená.“ S **Jen na příští kolo** je seznam prázdný:
    „Žádné úkoly neodpovídají filtru.“ Nabídka na příští kolo se po vyhodnocení vynulovala.
- [ ] **K2.2** · C — **Výběr kategorií úkolů**.
  - Pro probíhající kolo je zaškrtnutý Pohyb, přešel z nabídky na příští kolo.
  - Pro příští kolo zaškrtni **Dvojice** a **Hlava**.
- [ ] **K2.3** · A — **P1 Tichá dohoda** → „Vyber parťáka“.
  - V nabídce jsou Bára a Cyril, ne Adam. Vyber Cyrila → **Rezervovat na příští kolo**.
  - A má na každé záložce nahoře kartu „Pozvánka“: „Cyril byl(a) pozván(a) na „P1 Tichá dohoda““,
    „Čeká na odpověď“ a **Zrušit pro oba**.
  - C: „Adam tě zve na úkol „P1 Tichá dohoda““ s **Odmítnout** / **Přijmout**.
  - B z toho nevidí nic, jen „Má zájemce“ u P1.
- [ ] **K2.4** · C — **Odmítnout**.
  - C i A vidí „✗ Odmítnuto“. Tlačítka u C jsou zamčená a vpravo nahoře je ✕ na schování karty.
- [ ] **K2.5** · A — Otevři P1: „Rezervováno na příští kolo“ → **Zrušit rezervaci**. Pak P1 znovu,
      tentokrát s Bárou → **Rezervovat na příští kolo**.
  - Pozvánka u C zmizí a objeví se u B.
- [ ] **K2.6** · B — **Přijmout**.
  - A i B vidí „✓ Přijato“. U B se místo Odmítnout / Přijmout objeví **Zrušit pro oba**.
  - B: Profil ukazuje „Tvoje rezervace na příští kolo: P1 Tichá dohoda“, v seznamu má P1 chip
    „Rezervováno“.
  - C: P1 má „Má zájemce“ bez čísla, dvojice se počítá jako jeden zájemce. Adam i Bára mají „Má
    rezervaci“.
- [ ] **K2.7** · B — Na kartě pozvánky ťukni **Zrušit pro oba**.
  - Dvojice se zruší oběma: karta zmizí u A i B, oba mají „Nemá rezervaci“ a na Profilu „Zatím
    žádná“. U C zmizí zájemce z P1.
- [ ] **K2.8** · A, B — A znovu **P1** s Bárou → **Rezervovat na příští kolo**, B **Přijmout**.
  - B otevře P1: „Rezervováno na příští kolo“, „Dvojice se zruší i tvému parťákovi.“ a **Zrušit
    rezervaci**. Na to neťukej.
- [ ] **K2.9** · B — Otevři **H1 Hádanka**. Stojí tam „Nahradí tvoji rezervaci: P1 Tichá dohoda“
      a „Dvojice se zruší i tvému parťákovi.“ → **Rezervovat na příští kolo**.
  - Kdo z dvojice si zarezervuje něco jiného, zruší ji oběma: A už nemá kartu pozvánky, má „Nemá
    rezervaci“ a na Profilu „Zatím žádná“. B má rezervaci H1.
- [ ] **K2.10** · B, A — B otevře H1 → **Zrušit rezervaci**. A znovu **P1** s Bárou →
      **Rezervovat na příští kolo**, B **Přijmout**.
  - Platí zase stav z K2.6: A i B mají rezervaci P1 a „✓ Přijato“.
- [ ] **K2.11** · C — Rezervuj **H2 Básnička**.
- [ ] **K2.12** · C — **Hráči** → tužka u Adama → „Upravit hráče“ → do „Změna mincí (±)“ napiš 40
      (tlačítko **+** je zapnuté) a dej **Uložit** bez poznámky.
  - „U změny mincí doplň poznámku.“
  - S poznámkou „Bonus za úklid“ → **Uložit**: Adam má na všech zařízeních 240. A má v Historii
    „Úprava organizátorem“, „Bonus za úklid“, +40.
  - Stejně přidej Báře (260) a Cyrilovi (280).
- [ ] **K2.13** · A — **R1 Dezert navíc**. Pole má popisek „Tvůj přihoz (min. 50)“, cena odpovídá
      úpravě z 3.11. Napiš 30 → **Přihodit**.
  - „Přihoz musí být aspoň 50.“
  - Se 50 → **Přihodit** má A u R1 chip „Máš přihoz“ a na Profilu „Tvoje přihozy na odměny: R1
    Dezert navíc 50“. B a C vidí u R1 „Má zájemce“.
- [ ] **K2.14** · A — Otevři **R2**.
  - „V tomhle kole už máš maximum 1 přihozených odměn.“ Formulář se nezobrazí.
- [ ] **K2.15** · B — **R4 Úklid chatky** → „Vyber terč“.
  - V nabídce jsou Adam a Cyril, ne Bára. Vyber Cyrila, dej 100 → **Přihodit**.
  - Otevři R4 znovu → **Změnit přihoz** na 120.
  - C v dialogu R4 vidí „Zájemců: 1“ bez jména a bez částky.
- [ ] **K2.16** · C — **R3 Výběr hudby** → 80 → **Přihodit**.
- [ ] **K2.17** · C — **Zamknout kolo** → zaškrtni jen Adama a Báru. Cyril nesplnil.
  - Zúčtování: Adam Splněno +100, Bára Splněno +120, Cyril Nesplněno −50.
  - Přiděleno na příští kolo: Adam → P1 a Bára → P1 (obě s chipem „Skupina“), Cyril → H2
    Básnička.
  - Dražba odměn: Adam → R1 −50, Bára → R4 −120, Cyril → R3 −80.
  - **Vyhodnotit kolo**.
- [ ] **K2.18** · všichni — Kontrola.
  - Hráči: **290 / 260 / 150**.
  - Adam: úkol P1 „Ve dvojici s hráčem Bára“, chip „Má odměnu“, karta „Odměna“ R1 Dezert navíc.
  - Bára: P1 „Ve dvojici s hráčem Adam“, „Má odměnu“, R4 Úklid chatky „Terč je hráč Cyril“.
  - Cyril: úkol H2, „Má odměnu“ (R3), červený chip „Je terčem“ a karta „Terčem“: R4 Úklid chatky.
  - Filtr na Hráčích: **Jen úkoly** nechá jen karty Úkol, **Jen odměny** jen Odměna a Terčem. Pak
    vrať **Vše**.
  - C, Historie od nejstaršího: Splněno S3 +140, Úprava +40, „Nesplněno: S6 Švihadlo“ −50,
    „Odměna: R3 Výběr hudby“ −80. Statistiky: 1 splněný úkol, 1 odměna, vydělané 140, utracené 80.
  - B, Historie: „Trest: R4 Úklid chatky“ −120.
  - Přihozy z Profilu zmizely a rezervace je „Zatím žádná“.

## Kolo 3 — druhá pozvánka, všichni na jednu odměnu

- [ ] **K3.1** · C — Kategorie pro příští kolo: ✓ **Dvojice**.
  - Pro probíhající kolo jsou zaškrtnuté Dvojice a Hlava.
- [ ] **K3.2** · C — **P2 Zrcadlo** → parťák Adam → **Rezervovat na příští kolo**. Pozor, ne
      **Vzít na probíhající kolo**, dvojice se teď dají brát i na probíhající kolo.
  - A **Přijmout**. Na Profilu má A rezervaci P2 Zrcadlo.
- [ ] **K3.3** · B — **P3 Tandem** (+150) → parťák Adam → **Rezervovat na příští kolo**.
  - A má dvě pozvánky: od Cyrila „✓ Přijato“ a od Báry čekající.
- [ ] **K3.4** · A — U pozvánky od Báry **Přijmout**.
  - Hráč nemůže být ve dvou dvojicích zároveň, takže přijetím druhé se ta první zruší, a to oběma.
    Pozvánka od Cyrila u A zmizí. C už nemá kartu „Pozvánka“, má „Nemá rezervaci“ a na Profilu
    „Zatím žádná“.
  - A: Profil ukazuje rezervaci P3 Tandem. V seznamu je „Rezervováno“ u P3 a u P2 už ne.
  - C si schválně nic jiného nerezervuje.
- [ ] **K3.5** · všichni — Přihoďte na **R2 Přednost u jídla** (min. 60): A 80, B 100, C 60.
  - R2 má u všech „Máš přihoz“ a „Má zájemce (3)“, v dialogu je „Zájemců: 3“. Kdo kolik dal,
    nevidí nikdo.
- [ ] **K3.6** · C — **Zamknout kolo** → zaškrtni všechny.
  - Zúčtování: +120 / +120 / +120.
  - Přiděleno na příští kolo: Adam → P3 Tandem, Bára → P3 Tandem. Cyril tam není.
  - Bez úkolu: Cyril.
  - Dražba odměn: jen Bára → R2 −100 (nejvyšší přihoz).
  - **Vyhodnotit kolo**.
- [ ] **K3.7** · všichni — Kontrola.
  - Hráči: **410 / 280 / 270**. Adam a Cyril za prohranou dražbu nic nezaplatili.
  - Cyril má „Nemá úkol“, Adam a Bára mají P3 ve dvojici.
  - „Má odměnu“ má jen Bára (R2). Odměny z minulého kola a Cyrilův chip „Je terčem“ z karet
    zmizely, v Historii ale zůstaly.

## Kolo 4 — úkol na probíhající kolo pro toho, komu nic nevyšlo, a skupina

- [ ] **K4.1** · C — Otevři **H4 Origami**.
  - Tlačítko **Vzít na probíhající kolo** tam není, v probíhajícím kole jsou otevřené jen
    Dvojice. Dole stojí „Tahle kategorie není v příštím kole otevřená.“
- [ ] **K4.2** · C — Kategorie pro probíhající kolo: přidej ✓ **Jednotlivci**. Pro příští kolo:
      ✓ **Skupiny**.
- [ ] **K4.3** · C — **H4 Origami** → **Vzít na probíhající kolo**.
  - Cyril má „Má úkol“ a úkolem je H4 z kroku 3.10. U A a B má H4 chip „Zabraný“.
- [ ] **K4.4** · A, B, C — Postupně otevřete **G1 Týmová stavba** („Skupina (3–4)“) a dejte
      **Rezervovat na příští kolo**. Parťáka nevybíráte, ke skupině se každý hlásí sám.
  - Po rezervaci A vidí B u G1 „Má zájemce“. Po rezervaci A i B vidí C „Má zájemce (2)“.
- [ ] **K4.5** · C — **Zamknout kolo** → zaškrtni všechny.
  - Zúčtování: +150 / +150 / +120 (P3 má ruční mince, H4 je obtížnost 2).
  - Přiděleno: Adam, Bára i Cyril → G1 Týmová stavba, každý s chipem „Skupina“. Dražba chybí.
  - **Vyhodnotit kolo**.
- [ ] **K4.6** · všichni — Kontrola.
  - Hráči: **560 / 430 / 390**. Každý má úkol G1 „Ve skupině s hráči …“ a jsou tam ti druzí dva.
  - Nikdo nemá „Má odměnu“, Bářina R2 z karty zmizela.

## Kolo 5 — skupina se nesejde, tresty a terče

- [ ] **K5.1** · C — Kategorie pro příští kolo: ✓ **Skupiny**.
- [ ] **K5.2** · A, B, C — Rezervujte **G2 Velká výprava** („Skupina (4–6)“). Jste jen tři.
- [ ] **K5.3** · B — **R4 Úklid chatky** → terč Adam → 100 → **Přihodit**.
- [ ] **K5.4** · C — **R6 Nosič batohu** (z 3.12).
  - Místo nabídky je seznam zaškrtávátek „Vyber terče (min 1 – max 2)“. Položka „Adam — už
    zabráno“ nejde zaškrtnout. Adam je terčem jednoho přihozu a limit je 1.
  - B teď u R4 dá **Zrušit přihoz**. U C se Adam odemkne, i bez zavření dialogu.
  - B přihodí na R4 znovu, na Adama za 100. U C je Adam zase zabraný.
  - C zaškrtne Báru → 90 → **Přihodit**.
- [ ] **K5.5** · A — **R5 Rozcvička pro všechny** → 150 → **Přihodit**. Terč se nevybírá.
- [ ] **K5.6** · C — **Zamknout kolo** a nezaškrtávej nikoho.
  - Zúčtování: všichni Nesplněno −50.
  - Přiděleno na příští kolo: „Nic“, skupina G2 nemá dost lidí. Bez úkolu: Adam, Bára, Cyril.
  - Dražba: Adam → R5 −150, Bára → R4 −100, Cyril → R6 −90.
  - **Vyhodnotit kolo**.
- [ ] **K5.7** · všichni — Kontrola.
  - Hráči: **360 / 280 / 250**. Všichni „Nemá úkol“.
  - Adam: Odměna R5 „Terč: všichni“, chip „Je terčem“ a karta „Terčem“: R4 Úklid chatky.
  - Bára: R4 „Terč je hráč Adam“, „Je terčem“ a karta „Terčem“: R6 Nosič batohu.
  - Cyril: R6 „Terč je hráč Bára“.
  - Historie: „Nesplněno: G1 Týmová stavba“ −50 a „Trest: …“.

## Kolo 6 — dvojice na probíhající kolo, souboj o úkol, přihoz nad poměry

- [ ] **K6.1** · C — Kategorie pro probíhající kolo: přidej ✓ **Dvojice**. Pro příští kolo:
      ✓ **Hlava**.
- [ ] **K6.2** · A — **P4 Duet** → parťák Cyril → **Vzít na probíhající kolo**. Rezervace se
      nenabízí, protože Dvojice nejsou v příštím kole otevřené.
  - A má kartu „Dvojice na probíhající kolo“: „Pozval(a) jsi Cyril na úkol „P4 Duet“ v
    probíhajícím kole“, „Čeká na potvrzení“ a **Zrušit pro oba**.
  - C: „Adam tě zve na úkol „P4 Duet“ v probíhajícím kole“.
  - B vidí u P4 chip „Zabraný“, dokud Cyril neodpoví.
- [ ] **K6.3** · C — **Odmítnout**.
  - Obě karty zmizí a P4 u B už „Zabraný“ nemá.
- [ ] **K6.4** · A — **P4 Duet** → parťák Bára → **Vzít na probíhající kolo**.
- [ ] **K6.5** · C — Než Bára odpoví, otevři **P4 Duet**.
  - P4 má chip „Zabraný“ a dialog **Vzít na probíhající kolo** nenabízí, čekající pozvánka úkol
    drží. Kdyby C ťukl přesně ve chvíli, kdy A zve, dostane „Tenhle úkol už si v tomhle kole někdo
    vzal.“, ne „Jsi offline!“.
- [ ] **K6.6** · B — **Přijmout**.
  - Adam i Bára mají „Má úkol“ P4 Duet ve dvojici. Cyril si v tomhle kole schválně nic nebere.
- [ ] **K6.7** · rezervace — B a C rezervují **stejný** úkol **H3 Kvíz**, A rezervuje **H1
      Hádanka**.
  - B vidí u H3 „Má zájemce“, ale ne kdo.
- [ ] **K6.8** · přihozy — B dá na **R3 Výběr hudby** 500, víc, než má. Přihoz nad zůstatek je
      povolený. A dá na R3 80, C na **R1 Dezert navíc** 50.
- [ ] **K6.9** · C — **Zamknout kolo** a dialog nech otevřený.
  - A otevře H1: „Rezervováno na příští kolo“ a „Kolo je zamčené, teď to měnit nejde.“ Zrušit to
    nejde.
  - B otevře R3: „Kolo je zamčené, teď přihazovat nejde.“ Tlačítko **Zrušit přihoz** tam zůstává,
    stáhnout přihoz jde i při zamčeném kole. Neťukej na něj.
- [ ] **K6.10** · C — Zaškrtni Adama a Báru.
  - Zúčtování: Adam +100, Bára +100, Cyril „Bez úkolu“ −30.
  - Přiděleno: Cyril → H3 Kvíz, Adam → H1 Hádanka. **Nevyšlo**: „Bára: H3 Kvíz“. Když o úkol
    stojí víc hráčů, dostane ho chudší: Cyril má po zúčtování 220, Bára 380.
  - Bez úkolu: Bára.
  - Dražba: Adam → R3 −80 (Bára na svých 500 nemá), Cyril → R1 −50.
  - **Vyhodnotit kolo**.
- [ ] **K6.11** · všichni — Kontrola.
  - Hráči: **380 / 380 / 170**.
  - Cyril má v Historii „Nevybraný úkol“ −30. Bára nemá úkol ani odměnu a nic nezaplatila.
  - Statistiky:

    | Hráč  | Splněné úkoly | Získané odměny | Vydělané mince | Utracené mince |
    | ----- | ------------: | -------------: | -------------: | -------------: |
    | Adam  |             5 |              3 |            570 |            280 |
    | Bára  |             5 |              3 |            610 |            320 |
    | Cyril |             3 |              3 |            380 |            220 |

---

## Závěr — doplňkové kontroly

- [ ] **Z.1** · C — **Nastavení turnusu**: do Pokuty za nesplnění napiš `-5` → **Uložit**.
  - „Zadej platné hodnoty.“ Nic se neuloží.
- [ ] **Z.2** · C — Test podlahy: v nastavení vypni **Povolit záporný zůstatek** → **Uložit**. U
      Cyrila dej **−** a 1000, poznámka „Test podlahy“ → **Uložit**.
  - Cyril má **0**, ne −830. V Historii je „Úprava organizátorem“, „Test podlahy“, −170.
  - Záporný zůstatek zase povol.
- [ ] **Z.3** · C — Zapni **Veřejné profily**.
  - Všichni mají na Profilu u Statistik **Zobrazit víc** a ukáže „Tahle funkce bude dostupná v
    nadcházejících verzích.“ Pak to vypni.
- [ ] **Z.4** · C — Znovu naimportuj `tasks.tsv`.
  - „Náhled: 0 nových, 15 úprav“ → **Naimportovat**. Úkolů je pořád 16, H4 zůstal.
  - P3 má dál +150, ruční mince import nepřepíše. S4 má zpátky +140, obtížnost z tabulky přepsala
    úpravu z 3.8.
- [ ] **Z.5** · C, B, A — Dvojice se ruší oběma i v probíhajícím kole. C: Kategorie pro
      probíhající kolo přidej ✓ **Dvojice**. B: **P2 Zrcadlo** → parťák Adam → **Vzít na
      probíhající kolo**.
  - C v nastavení odškrtne **Lze měnit probíhající úkoly**. A má na kartě „Dvojice na probíhající
    kolo“ „Úkol v probíhajícím kole teď měnit nejde.“ a **Přijmout** je šedé, protože už má H1. C
    nastavení zase zaškrtne.
  - A: **Přijmout**. Adam i Bára mají úkol P2 ve dvojici. Adam tím pustil H1 a nikomu jinému se nic nestalo, H1 je
    úkol pro jednoho.
  - B otevře **H4 Origami**. Pod „Chceš jiný úkol?…“ stojí „Tvůj parťák Adam tím o společný úkol
    taky přijde.“ → **Přepnout na tenhle**.
  - Bára má H4, Adam „Nemá úkol“ a P2 už u nikoho nemá „Zabraný“.
- [ ] **Z.6** · C — Přejmenuj Báru na „Barbora“.
  - Změna se ukáže na všech zařízeních. Pak ji vrať.
- [ ] **Z.7** · C — U **H2 Básnička** odškrtni **Aktivní** → **Uložit**.
  - A a B úkol v seznamu nevidí. C ho vidí dál, zašedlý s chipem „Neaktivní“ na konci seznamu.
  - C: tužka u H2 → ✓ **Aktivní** → **Uložit**. Úkol se všem vrátí na své místo.
- [ ] **Z.8** · A — Druhý organizátor: 3 s drž název aplikace → admin kód → **Profil+**.
  - C otevře **Zamknout kolo** a nechá ho otevřený. U A je **Zamknout kolo** zašedlé a pod ním
    „Kolo je zamčené. Jestli ho teď nevyhodnocuje jiný organizátor, můžeš ho odemknout.“ s
    **Odemknout kolo**. Neťukej na něj, C právě vyhodnocuje.
  - C dialog zavře. U A je **Zamknout kolo** zase aktivní a upozornění zmizí.
  - A → **Odhlásit z admina**: vrátí se **Profil** a zmizí admin tlačítka, tužky i **+**.
- [ ] **Z.9** · B — Ťukni na Báru → **Odhlásit se od postavy**.
  - Profil ukazuje „Nemáš vybranou postavu“. **Přejít na Hráče** → Bára → PIN 2222. Karta,
    statistiky i historie jsou zpátky.
- [ ] **Z.10** · A — Ťukni na ikonu vlevo v hlavičce.
  - Otevře se výběr skupin a verze v hlavičce sedí s nasazenou.
  - Ťukni na skupinu. Pustí tě dovnitř bez kódu, rovnou na Hráče jako Adam.
- [ ] **Z.11** · A — Zapni režim letadlo.
  - Objeví se pruh „Offline! Změny se odešlou po připojení“.
  - Rezervace skončí hláškou „Jsi offline! Připoj se a zkus to znovu.“
  - Po vypnutí režimu letadlo pruh zmizí a data se načtou.
- [ ] **Z.12** · B — Přepni na **EN**, pak na **DE**.
  - Aplikace je anglicky: S1 je „S1 Squats“, R1 „R1 Extra dessert“, štítky „Movement“ / „Head“,
    tlačítko rezervace „Reserve for the next round“. Úkoly bez překladu zůstanou česky.
  - V DE je „S1 Kniebeugen“ a „Für die nächste Runde reservieren“. Pak zpět na CS.
- [ ] **Z.13** · C — Pád během vyhodnocení. **Zamknout kolo**, dialog nezavírej a zavři celé okno
      aplikace. Pak ji znovu otevři.
  - Kolo zůstalo zamčené: **Zamknout kolo** je zašedlé a pod ním stojí „Kolo je zamčené. Jestli ho
    teď nevyhodnocuje jiný organizátor, můžeš ho odemknout.“
  - **Odemknout kolo** → upozornění zmizí, **Zamknout kolo** je zase aktivní a hráči mohou
    rezervovat.
- [ ] **Z.14** · Úklid — V konzoli nastav skupině `archived` = `true`.
  - Skupina zmizí z výběru.

---

## Rychlá verze (smoke test)

Na drobná vydání, zhruba 15 minut na nové testovací skupině. Zůstatky nemusí přesně sedět s
tahákem.

0.1 (verze) → 1.2 → 2.1–2.2 → 3.1–3.4 → 3.6–3.7 → K1.1 → K1.3–K1.4 → K1.9 → K1.11 → K1.14 → K2.2
→ K2.3 + K2.6 (dvojice) → K2.9 (dvojice se zruší oběma) → K2.13 + K2.16 (přihozy) → K2.17–K2.18 →
Z.10 (návrat bez kódu).

## Co scénář nepokrývá

Pravidla, která se na třech lidech nedají pořádně vyvolat, hlídají automatické testy (`npm run
verify` a `npm run test:rules`). Patří sem ořezání přeplněné skupiny na nejchudší hráče,
automatické doplnění terčů při překročení limitu, shoda přihozů a pořadí dražby a všechna
oprávnění ve Firestore Rules. Tenhle scénář ověřuje, že celek drží pohromadě na skutečných
zařízeních a v reálných prohlížečích.

## Jak scénář rozšiřovat

- Nová funkce dostane krok tam, kde ji hráči přirozeně použijí, ne na konec. Čísla kroků klidně
  přečísluj.
- Každý krok říká, kdo, co udělat (přesný text tlačítka) a co ověřit (přesný text, který má
  aplikace ukázat).
- Když krok hýbe mincemi, přepočítej [tahák](#tahák-zůstatky-mincí) a kontroly v dalších kolech.
- Když potřebuje nová data, doplň je do `tasks.tsv` / `rewards.tsv` a oprav počty v krocích 3.6,
  3.7 a Z.4.

## Záznam z testování

| Datum | Verze | Testoval | Výsledek | Chyby (krok → popis) |
| ----- | ----- | -------- | -------- | -------------------- |
|       |       |          |          |                      |
