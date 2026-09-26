import type { RulesContent } from './types.ts';

/**
 * Czech is the source of truth for the rules too. Keep the text plain: no bold, no dashes as
 * punctuation, and name buttons and chips exactly as the app shows them.
 */
export const rulesCs: RulesContent = {
  title: 'Pravidla hry',
  intro: 'Všechna pravidla na jednom místě. Ťukni na pravidlo s otazníkem a dozvíš se podrobnosti.',
  contents: 'Obsah',
  related: 'Souvisí',
  checkedAt: 'Pravidla odpovídají hře ke dni {date}.',
  sections: {
    basics: { title: 'Jak se hraje', short: 'Jak se hraje' },
    character: { title: 'Skupina a postava', short: 'Postava' },
    tasks: { title: 'Úkoly', short: 'Úkoly' },
    reservations: { title: 'Rezervace na příští kolo', short: 'Rezervace' },
    currentRound: { title: 'Úkol na probíhající kolo', short: 'Probíhající kolo' },
    teams: { title: 'Dvojice a skupiny', short: 'Dvojice a skupiny' },
    auction: { title: 'Dražba odměn', short: 'Dražba' },
    punishments: { title: 'Tresty', short: 'Tresty' },
    evaluation: { title: 'Vyhodnocení kola', short: 'Vyhodnocení' },
    coins: { title: 'Mince', short: 'Mince' },
    visibility: { title: 'Co je veřejné a co tajné', short: 'Kdo co vidí' },
    settings: { title: 'Nastavení skupiny', short: 'Nastavení' },
  },
  rules: {
    goal: {
      summary:
        'Plníš úkoly, vyděláváš mince a utrácíš je v dražbě za odměny, nebo za tresty pro ostatní.',
      detail: {
        title: 'O co ve hře jde',
        blocks: [
          'KWEST hraje skupina lidí, kteří spolu tráví pár dní, třeba na výletě nebo na táboře. Každý hraje za svou postavu. Za splněné úkoly dostáváš mince, za nesplněné platíš pokutu. Mince pak utrácíš v dražbě: za odměnu pro sebe, nebo za trest pro někoho jiného.',
          'Úkoly, odměny i tresty se odehrávají ve skutečném světě. Aplikace hlídá pravidla, počítá mince a pamatuje si, kdo co má.',
        ],
      },
    },
    rounds: {
      summary:
        'Hra běží po kolech. V každém kole plníš jeden úkol a chystáš si úkol na příští kolo.',
      detail: {
        title: 'Kolo',
        blocks: [
          'Kolo trvá od jednoho vyhodnocení do dalšího. Nemusí to být den, ale doporučuje se to, protože úkoly v katalogu jsou dělané tak, aby se plnily celý den. Organizátor ovšem může vyhodnocovat víckrát denně nebo jednou za pár dní, podle vaší domluvy.',
          'Během kola:',
          [
            'plníš svůj úkol na probíhající kolo,',
            'rezervuješ si úkol na příští kolo,',
            'přihazuješ v dražbě na odměny.',
          ],
          'Na konci kola organizátor zapíše, kdo svůj úkol splnil. Aplikace rozdá mince, rozdělí úkoly na příští kolo, vyhodnotí dražbu a začne nové kolo.',
        ],
      },
    },
    joinGroup: {
      summary:
        'Do skupiny vstoupíš kódem od organizátora. Aplikace si ji zapamatuje a příště tě pustí rovnou dovnitř.',
      detail: {
        title: 'Vstup do skupiny',
        blocks: [
          'Na záložce Skupiny ťukni na svou skupinu a zadej kód. Stačí to jednou, při dalším spuštění tě aplikace pustí rovnou dovnitř. Ze skupiny odejdeš ikonou vlevo v hlavičce a zpátky se vrátíš bez kódu.',
          'Tip: Nainstaluj si aplikaci na plochu ještě před vstupem do skupiny. Na iPhonu má nainstalovaná aplikace vlastní paměť, oddělenou od Safari. Kdo vstoupí v Safari a teprve potom aplikaci nainstaluje, musí v ní zadat kód i PIN postavy znovu.',
        ],
      },
    },
    newCharacter: {
      summary:
        'Založ si postavu se jménem a čtyřmístným PINem. Hrát můžeš, až ji organizátor schválí.',
      detail: {
        title: 'Nová postava',
        blocks: [
          'Na záložce Hráči ťukni na +, zadej jméno a PIN. Dokud postavu organizátor neschválí, čeká šedě v sekci „Čeká na schválení“ a nejde si ji vzít. Schválením dostane postava počáteční mince.',
          'PIN si zapamatuj. Bez něj se ke své postavě na jiném zařízení nedostaneš.',
        ],
      },
    },
    claimCharacter: {
      summary:
        'Postavu si zabereš PINem. Jedno zařízení drží jednu postavu, jedna postava může být na víc zařízeních.',
      detail: {
        title: 'Tvoje postava',
        blocks: [
          'Ťukni na svou postavu v seznamu Hráči a zaber si ji zadáním PINu. Ten je potřeba jen jednou, aby si nikdo omylem nevzal cizí postavu. Tvoje zařízení si pak přihlášení k postavě pamatuje.',
          [
            'Když si na zařízení zabereš jinou postavu, tu předchozí tím pustíš.',
            'Svou postavu můžeš mít zároveň na víc zařízeních, třeba na telefonu i na tabletu.',
            'Od postavy se odhlásíš na její kartě tlačítkem „Odhlásit se od postavy“.',
          ],
        ],
      },
    },
    taskCoins: {
      summary:
        'V každém kole máš mít úkol. Splněný vynese mince, nesplněný stojí pokutu. Kolo bez úkolu taky.',
      detail: {
        title: 'Mince za úkoly',
        blocks: [
          'Každý úkol má obtížnost (tečky na kartě) a podle ní odměnu. Nejlehčí úkol vynese 100 mincí, nejtěžší 200. Kolik který úkol vynese, vidíš na jeho kartě.',
          [
            'Nesplněný úkol stojí pokutu za nesplnění. Je stejná pro všechny, ať byl úkol lehký nebo těžký.',
            'Kolo bez úkolu stojí pokutu bez úkolu.',
          ],
          'Kdo úkol splnil, rozhoduje organizátor při vyhodnocení. Mince se připisují i strhávají až tehdy.',
        ],
      },
    },
    taskTypes: {
      summary: 'Úkoly jsou pro jednotlivce, pro dvojice a pro skupiny.',
      detail: {
        title: 'Typy úkolů',
        blocks: [
          [
            'Jednotlivci: úkol děláš sám.',
            'Dvojice (chip „Dvojice“): přesně dva hráči. Parťáka si pozveš sám.',
            'Skupiny (chip „Skupina“ s počtem hráčů, třeba „Skupina (3–4)“): každý se hlásí sám a skupina se poskládá při vyhodnocení.',
          ],
          'Za splnění dostane každý člen dvojice nebo skupiny celou odměnu úkolu. Organizátor posuzuje každého zvlášť.',
        ],
      },
    },
    categories: {
      summary: 'Úkol si můžeš vzít jen z kategorie, kterou organizátor pro dané kolo otevřel.',
      detail: {
        title: 'Otevřené kategorie',
        blocks: [
          'Úkoly mají kategorie (štítky na kartě). Organizátor otevírá kategorie zvlášť pro probíhající kolo a zvlášť pro příští kolo. Jako kategorie fungují i typy úkolů: otevřít „Dvojice“ otevře všechny úkoly pro dvojice. Úkol je otevřený, když je otevřená aspoň jedna jeho kategorie nebo jeho typ.',
          'Při vyhodnocení se kategorie příštího kola stanou kategoriemi nového kola. Nabídka na další kolo je pak prázdná, dokud ji organizátor znovu neotevře.',
          'Tip: Filtry „Jen na probíhající kolo“ a „Jen na příští kolo“ ukážou, co si právě můžeš vzít.',
        ],
      },
    },
    onceOnly: {
      summary: 'Každý úkol uděláš nejvýš jednou za celou hru, i ten, který se ti nepovedl.',
      detail: {
        title: 'Úkol jen jednou',
        blocks: [
          'Úkol, který jsi splnil i nesplnil, už znovu nerezervuješ ani nevezmeš. Aplikace napíše „Tenhle úkol už si měl.“ Stejně tak nejde rezervovat úkol, který máš právě teď. Ostatní hráči ho dělat můžou.',
          'Na úkol, který už máš za sebou, tě nikdo nepozve ani do dvojice. Úkol, ze kterého ses během kola přepnul jinam, se nepočítá, ten jsi nedělal.',
        ],
      },
    },
    reserve: {
      summary:
        'Úkol na příští kolo si rezervuješ. Mít můžeš jen jednu rezervaci, nová nahradí tu starou.',
      detail: {
        title: 'Rezervace',
        blocks: [
          'Otevři úkol a dej „Rezervovat na příští kolo“. Až do zamčení kola můžeš rezervaci zrušit nebo vyměnit za jinou. Svou rezervaci vidíš na Profilu. Přijatá pozvánka do dvojice je taky tvoje rezervace.',
          'Rezervace ještě neznamená, že úkol dostaneš. To se rozhodne až při vyhodnocení.',
          'Rezervace je tajná. Ostatní vidí jen, že nějakou máš („Má rezervaci“), a u úkolu počet zájemců („Má zájemce (2)“). Dvojice se počítá jako jeden zájemce. Kdo úkol dostal, uvidí všichni až po vyhodnocení.',
        ],
      },
    },
    poorerRule: {
      summary: 'Když o stejný úkol stojí víc hráčů, dostane ho chudší.',
      detail: {
        title: 'Pravidlo chudšího',
        blocks: [
          'Když si stejný úkol na příští kolo zarezervuje víc hráčů, dostane ho ten, kdo má méně mincí. Hra tak pomáhá těm, kterým se zatím tolik nedaří.',
          'Počítá se zůstatek po zúčtování právě končícího kola, tedy už s odměnou nebo pokutou za úkol z tohoto kola. Ne ten, který vidíš během kola. Útraty v dražbě ze stejného vyhodnocení se nepočítají, dražba přijde na řadu až po rozdělení úkolů.',
          'Když o úkol stojí dva hráči, vyhraje ten s nižším zůstatkem.',
          { example: 'Příklad: Bára má po zúčtování 380 mincí, Cyril 220. Úkol dostane Cyril.' },
          'Za dvojici se počítá zůstatek jejího chudšího člena.',
          {
            example:
              'Příklad: Adam (300) a Bára (150) mají jako dvojice 150. Porazí Cyrila (200) a Danu (250), kteří mají 200.',
          },
          'U skupinových úkolů nesoupeří skupina se skupinou, ale hráči o místa ve skupině. Když se přihlásí víc hráčů, než je míst, dostanou je nejchudší.',
          'Když mají obě strany stejně, vyhraje dřívější rezervace. U dvojice rozhoduje čas, kdy ji zakladatel zarezervoval, ne kdy parťák přijal. Kdo rezervaci zruší a zarezervuje znovu, dostane nový čas.',
          'Když se shoduje i čas, rozhodne pevné pořadí v systému, ne náhoda. Stejná situace tak dopadne vždycky stejně. V praxi se to skoro nestane.',
          'Kdo úkol nedostane, zůstane v příštím kole bez úkolu.',
        ],
      },
    },
    noTask: {
      summary:
        'Když ti rezervace nevyjde, zůstaneš bez úkolu. Vezmi si pak volný úkol na probíhající kolo.',
      detail: {
        title: 'Nevyšlo to',
        blocks: [
          'Kdo při vyhodnocení úkol nedostane, začne nové kolo s chipem „Nemá úkol“. Stane se to, když prohraje s chudším, když se jeho dvojice nebo skupina nesejde, nebo když si nic nezarezervoval.',
          'Náhradní úkol se nepřiděluje sám. Vezmi si některý volný úkol z kategorií otevřených pro probíhající kolo. Kdo do vyhodnocení žádný úkol mít nebude, zaplatí pokutu bez úkolu.',
        ],
      },
    },
    takeNow: {
      summary:
        'Volný úkol si můžeš vzít rovnou na probíhající kolo. Kdo dřív přijde, ten dřív bere.',
      detail: {
        title: 'Vzít na probíhající kolo',
        blocks: [
          'U úkolu dej „Vzít na probíhající kolo“. Jde to jen u úkolů z kategorií otevřených pro probíhající kolo, které si v tomhle kole ještě nikdo nevzal. Zabrané úkoly mají chip „Zabraný“. Když ťuknete dva naráz, dostane ho jen jeden.',
          [
            'Úkol pro jednotlivce je tvůj hned.',
            'Dvojici založíš pozvánkou a úkol dostanete oba, až parťák přijme. Dokud pozvánka čeká, je úkol pro ostatní zabraný. Když parťák odmítne, úkol se uvolní.',
            'Skupinový úkol na probíhající kolo vzít nejde, jen rezervovat.',
          ],
          'Úkol vzatý na probíhající kolo se vyhodnocuje stejně jako rezervovaný.',
        ],
      },
    },
    switchTask: {
      summary:
        'Úkol v probíhajícím kole můžeš vyměnit za jiný volný, pokud to organizátor povolil.',
      detail: {
        title: 'Výměna úkolu',
        blocks: [
          'Otevři jiný volný úkol a dej „Přepnout na tenhle“. Tvůj původní úkol se uvolní pro ostatní a nepočítá se ti jako použitý.',
          'Organizátor může výměny vypnout. Kdo už úkol má, ho pak nevymění a nemůže ani zakládat nebo přijímat dvojici na probíhající kolo. Kdo úkol nemá, si ho vzít může vždycky.',
          'Pozor: Když opustíš úkol pro dvojici, přijde o něj i tvůj parťák.',
        ],
      },
    },
    pairInvite: {
      summary: 'Dvojici založíš pozvánkou. Platí, až ji parťák přijme.',
      detail: {
        title: 'Pozvánka do dvojice',
        blocks: [
          'U úkolu pro dvojici vyber parťáka a dej „Rezervovat na příští kolo“ nebo „Vzít na probíhající kolo“. Parťák uvidí nahoře kartu s pozvánkou a tlačítky „Přijmout“ a „Odmítnout“. Odpověď se nedá vzít zpět. Kdo přijal, může už jen dvojici zrušit pro oba.',
          [
            'Pozvat můžeš jen hráče, který ten úkol ještě nedělal.',
            'Pozvánek můžeš dostat víc, přijmout ale jen jednu. Přijetím další se ta předchozí zruší, a to oběma.',
            'Přijetím pozvánky se zruší tvoje vlastní rezervace.',
            'Pozvánka na příští kolo, kterou parťák do vyhodnocení nepřijme, propadne. Úkol pak nedostane nikdo z vás.',
          ],
          'V pravidle chudšího se za dvojici počítá zůstatek chudšího z vás.',
        ],
      },
    },
    pairTogether: {
      summary: 'Dvojice se dělá spolu, nebo vůbec. Kdo z ní vycouvá, zruší ji oběma.',
      detail: {
        title: 'Spolu, nebo vůbec',
        blocks: [
          'Dvojice se zruší oběma, když kdokoli z vás:',
          [
            'ťukne na „Zrušit pro oba“ nebo zruší rezervaci,',
            'zarezervuje si jiný úkol,',
            'přijme jinou dvojici,',
            'se v probíhajícím kole přepne na jiný úkol.',
          ],
          'Aplikace tě na to vždycky předem upozorní. U skupinových úkolů to neplatí: když jeden odejde, ostatním úkol zůstane.',
        ],
      },
    },
    groupTasks: {
      summary:
        'Ke skupinovému úkolu se hlásí každý sám. Skupina vznikne při vyhodnocení, když se sejde dost lidí.',
      detail: {
        title: 'Skupinové úkoly',
        blocks: [
          'Skupinový úkol má rozsah hráčů, třeba 3 až 4. Parťáky nezveš, každý si úkol rezervuje sám. Kolik se jich zatím přihlásilo, ukazuje karta úkolu.',
          'Při vyhodnocení:',
          [
            'když je zájemců méně, než je minimum, skupina propadne a úkol nedostane nikdo,',
            'když je jejich počet v rozsahu, úkol dostanou všichni,',
            'když je zájemců víc, než je maximum, místa dostanou nejchudší (při shodě dřívější rezervace) a ostatní zůstanou bez úkolu.',
          ],
          {
            example:
              'Příklad: Úkol pro 3 až 4 hráče si zarezervuje pět lidí se 120, 90, 300, 90 a 200 mincemi. Úkol dostanou ti se 90, 90, 120 a 200. Hráč s 300 zůstane bez úkolu.',
          },
          'Na kartě pak uvidíš, s kým ve skupině jsi.',
        ],
      },
    },
    blindAuction: {
      summary: 'Odměny se draží naslepo. Přihodíš aspoň vyvolávací cenu a nejvyšší přihoz vyhraje.',
      detail: {
        title: 'Dražba naslepo',
        blocks: [
          'Cena na kartě odměny je vyvolávací cena, tedy nejnižší možný přihoz. Přihodit můžeš víc a zvýšit si tak šanci. Kdo kolik přihodil, nevidí nikdo. U odměny je vidět jen počet zájemců.',
          'Až do zamčení kola můžeš přihoz změnit nebo stáhnout. Svoje přihozy vidíš na Profilu.',
          'Při stejném přihozu vyhraje ten dřívější. Změnou přihozu se jeho čas posune na okamžik změny.',
        ],
      },
    },
    paying: {
      summary:
        'Platíš až při vyhodnocení, a jen když vyhraješ. Když na svůj přihoz nemáš, jde odměna dalšímu.',
      detail: {
        title: 'Placení',
        blocks: [
          'Přihoz ti mince neblokuje. Prohraný přihoz tě nestojí nic. Přihodit smíš i víc, než zrovna máš, třeba když čekáš, že ti je vynese úkol z tohoto kola. Vítěz zaplatí celý svůj přihoz.',
          'Při vyhodnocení se ale počítá zůstatek po zúčtování úkolů, snížený o odměny, které jsi při stejném vyhodnocení už vyhrál. Když na svůj přihoz nemáš, odměna jde dalšímu nejvyššímu přihozu. Když nemá nikdo, zůstane neprodaná. Odměny se vyhodnocují jedna po druhé v pevném pořadí.',
        ],
      },
    },
    rewardLimit: {
      summary:
        'Přihazovat můžeš najednou jen na omezený počet odměn. Víc jich za kolo ani nevyhraješ.',
      detail: {
        title: 'Limit odměn',
        blocks: [
          'Limit určuje organizátor a v základu je nastavený na 1 odměnu za kolo. Když ho dosáhneš, další přihoz nepůjde, dokud některý nestáhneš.',
          'Limit platí i pro výhry. Kdybys měl vyhrát víc odměn, než smíš, další připadnou dalšímu nejvyššímu přihozu. Počítají se všechny formy, odměny i tresty.',
        ],
      },
    },
    rewardWon: {
      summary: 'Vyhraná odměna platí v příštím kole. Odehraje se mimo aplikaci.',
      detail: {
        title: 'Vyhraná odměna',
        blocks: [
          'Kdo co vyhrál, uvidí po vyhodnocení všichni. Na kartě výherce se objeví „Má odměnu“ a hráč, kterého trest postihne, má chip „Je terčem“. Na kartách to zůstane do dalšího vyhodnocení, v historii transakcí navždy.',
          'Samotnou odměnu nebo trest zařídí organizátoři. Aplikace jen zaznamená, kdo co vyhrál.',
        ],
      },
    },
    rewardForms: {
      summary: 'Odměny mají tři formy: odměna pro tebe, trest pro někoho a trest pro všechny.',
      detail: {
        title: 'Formy odměn',
        blocks: [
          [
            'Odměna: výhoda pro tebe.',
            'Trest pro někoho: postihne hráče, které vybereš.',
            'Trest pro všechny: postihne všechny kromě tebe.',
          ],
          'Všechny formy se draží stejně.',
        ],
      },
    },
    pickTargets: {
      summary: 'U trestu pro někoho vybíráš terče už při přihozu. Sebe vybrat nemůžeš.',
      detail: {
        title: 'Výběr terčů',
        blocks: [
          'Kolik terčů vybrat, stojí u odměny, třeba 1 až 2. Terče můžeš měnit spolu s přihozem až do zamčení kola. Konečné terče se určí až při vyhodnocení, takže se od tvého výběru můžou lišit.',
        ],
      },
    },
    targetLimit: {
      summary:
        'Jeden hráč může být terčem jen omezeněkrát za kolo. Obsazený hráč má v nabídce „už zabráno“.',
      detail: {
        title: 'Limit terčů',
        blocks: [
          'Limit určuje organizátor a v základu je nastavený tak, že každý může být během kola terčem jednoho trestu. Na trest pro všechny se limit nevztahuje.',
          'Během kola: když na hráče míří tolik přihozů, kolik povoluje limit, nové přihozy ho vybrat nemůžou. Uvolní se, jakmile některý z těch přihozů změní terč nebo se stáhne. Kdo už ho v přihozu má, o něj nepřijde.',
          'Při vyhodnocení se terče rozdělí znovu, od nejvyššího vyhraného přihozu:',
          [
            'vítěz dostane své vybrané terče, pokud ještě nevyčerpaly limit,',
            'terče, které limit vyčerpaly, mu propadnou,',
            'když mu tak zbude méně terčů, než je minimum, doplní se z hráčů, kteří jsou terčem nejméně. Pořadí doplňování se každé kolo mění, aby to nepadalo pořád na stejné.',
          ],
        ],
      },
    },
    lockedRound: {
      summary:
        'Když organizátor kolo zamkne, všechno zamrzne. Úkoly, rezervace, pozvánky ani přihozy pak měnit nejde.',
      detail: {
        title: 'Zamčené kolo',
        blocks: [
          'Organizátor kolo zamkne, když ho začne vyhodnocovat, a zamčené zůstane jen do konce vyhodnocení. Mezitím nejde brát ani měnit úkoly, rezervovat, rušit rezervace, odpovídat na pozvánky, přihazovat ani stahovat přihozy. Kolo tak zůstane přesně takové, jaké ho organizátor vyhodnocuje.',
        ],
      },
    },
    evaluationOrder: {
      summary: 'Vyhodnocení jde v pevném pořadí: zúčtování úkolů, rozdělení rezervací, dražba.',
      detail: {
        title: 'Průběh vyhodnocení',
        blocks: [
          {
            steps: [
              'Zúčtování: organizátor zaškrtne, kdo svůj úkol splnil. Splněný úkol vynese svou odměnu, nezaškrtnutý stojí pokutu za nesplnění. Kdo úkol neměl, zaplatí pokutu bez úkolu.',
              'Rezervace: úkoly na příští kolo se rozdělí podle pravidla chudšího, ze zůstatků po zúčtování.',
              'Dražba: odměny dostanou nejvyšší přihozy, které na ně mají. Platí se ze zůstatku po zúčtování.',
              'Nové kolo: rezervace se stanou úkoly a vyhrané odměny začnou platit.',
            ],
          },
          'Díky tomuhle pořadí utrácení v dražbě nerozhoduje o tom, jestli dostaneš rezervovaný úkol.',
        ],
      },
    },
    newRound: {
      summary:
        'Po vyhodnocení začíná nové kolo. Rezervace se stanou úkoly a vyhrané odměny začnou platit.',
      detail: {
        title: 'Nové kolo',
        blocks: [
          [
            'Kdo rezervaci vyhrál, má úkol na nové kolo. U dvojic a skupin i se jmény parťáků.',
            'Kdo nevyhrál, má „Nemá úkol“ a může si vzít volný úkol.',
            'Kategorie příštího kola se stanou kategoriemi nového kola. Nabídku na další kolo otevře organizátor znovu.',
            'Rezervace a přihozy se smažou, na další kolo začínáš od nuly.',
            'Odměny a terče z předchozího kola z karet zmizí. V historii transakcí zůstanou.',
          ],
        ],
      },
    },
    profile: {
      summary:
        'Na Profilu najdeš svoje statistiky a historii transakcí. Vidíš je jen ty a organizátoři.',
      detail: {
        title: 'Profil',
        blocks: [
          [
            'Tvoje karta: úkol, rezervace, přihozy a vyhrané odměny.',
            'Statistiky: splněné úkoly, získané odměny, vydělané a utracené mince. Vydělané jsou jen mince za splněné úkoly, utracené jen mince za vyhrané odměny. Pokuty a úpravy od organizátora najdeš v historii.',
            'Historie transakcí: každá odměna za úkol, pokuta, vyhraná odměna a úprava od organizátora, i se zůstatkem po každé změně. Celá historie („Zobrazit víc“) začíná počátečním zůstatkem.',
          ],
        ],
      },
    },
    adjustments: {
      summary: 'Organizátor může mince ručně přidat nebo ubrat. Důvod vždycky uvidíš v historii.',
    },
    negativeBalance: {
      summary: 'Jestli může zůstatek klesnout pod nulu, určuje organizátor.',
      detail: {
        title: 'Záporný zůstatek',
        blocks: [
          'Když záporný zůstatek povolený není, zastaví se pokuty i úpravy na nule. Když povolený je, můžeš se dostat do dluhu. V pravidle chudšího se pak dluh počítá jako méně než nula.',
        ],
      },
    },
    whoSeesWhat: {
      summary:
        'Všichni vidí, kolik kdo má mincí, jaký má úkol a co vyhrál. Co kdo rezervuje a na co přihazuje, je tajné.',
      detail: {
        title: 'Kdo co vidí',
        blocks: [
          'Všichni vidí:',
          [
            'zůstatek mincí každého hráče,',
            'úkol na probíhající kolo (název, popis, parťáci),',
            'jestli má hráč rezervaci, ale ne na co,',
            'počet zájemců u úkolů a odměn,',
            'zabrané úkoly,',
            'vyhrané odměny a jejich terče.',
          ],
          'Jen ty a organizátoři:',
          [
            'na co máš rezervaci,',
            'kolik a na co přihazuješ a koho chceš potrestat,',
            'tvoje statistiky a historie transakcí.',
          ],
          'Pozvánku do dvojice vidíte jen vy dva.',
        ],
      },
    },
    groupSettings: {
      summary: 'Výši pokut, limity a další podrobnosti určuje organizátor.',
      detail: {
        title: 'Nastavení skupiny',
        blocks: [
          'Organizátor může nastavit:',
          [
            'počáteční mince, které dostane nová postava při schválení,',
            'pokutu za nesplnění úkolu,',
            'pokutu za kolo bez úkolu,',
            'kolik odměn může hráč za kolo přihazovat a vyhrát,',
            'kolikrát může být hráč za kolo terčem trestu,',
            'jestli může zůstatek klesnout pod nulu,',
            'jestli jde úkol v probíhajícím kole vyměnit.',
          ],
        ],
      },
    },
  },
};
