import type { RulesContent } from './types.ts';

export const rulesDe: RulesContent = {
  title: 'Spielregeln',
  intro:
    'Alle Regeln an einem Ort. Tippe auf eine Regel mit Fragezeichen, um die Details zu lesen.',
  contents: 'Inhalt',
  related: 'Siehe auch',
  checkedAt: 'Diese Regeln entsprechen dem Spiel mit Stand vom {date}.',
  sections: {
    basics: { title: 'So wird gespielt', short: 'So geht’s' },
    character: { title: 'Gruppe und Figur', short: 'Figur' },
    tasks: { title: 'Aufgaben', short: 'Aufgaben' },
    reservations: { title: 'Reservieren für die nächste Runde', short: 'Reservierung' },
    currentRound: { title: 'Eine Aufgabe für die laufende Runde', short: 'Laufende Runde' },
    teams: { title: 'Paare und Gruppenaufgaben', short: 'Paare und Gruppen' },
    auction: { title: 'Belohnungs-Auktion', short: 'Auktion' },
    punishments: { title: 'Strafen', short: 'Strafen' },
    evaluation: { title: 'Rundenabschluss', short: 'Abschluss' },
    coins: { title: 'Münzen', short: 'Münzen' },
    visibility: { title: 'Was öffentlich ist und was geheim', short: 'Wer sieht was' },
    settings: { title: 'Gruppen-Einstellungen', short: 'Einstellungen' },
  },
  rules: {
    goal: {
      summary:
        'Du erledigst Aufgaben, verdienst Münzen und gibst sie in einer Auktion für Belohnungen aus, oder für Strafen für die anderen.',
      detail: {
        title: 'Worum es geht',
        blocks: [
          'KWEST spielt eine Gruppe, die ein paar Tage zusammen verbringt, etwa auf einem Ausflug oder in einem Lager. Jeder spielt seine eigene Figur. Für erledigte Aufgaben bekommst du Münzen, für nicht geschaffte zahlst du eine Strafe. Die Münzen gibst du in der Auktion aus: für eine Belohnung für dich oder für eine Strafe für jemand anderen.',
          'Aufgaben, Belohnungen und Strafen passieren in der echten Welt. Die App achtet auf die Regeln, zählt die Münzen und merkt sich, wer was hat.',
        ],
      },
    },
    rounds: {
      summary:
        'Das Spiel läuft in Runden. In jeder Runde erledigst du eine Aufgabe und planst deine Aufgabe für die nächste Runde.',
      detail: {
        title: 'Runden',
        blocks: [
          'Eine Runde dauert von einem Abschluss bis zum nächsten. Das muss kein Tag sein, ein Tag ist aber empfohlen, weil die Aufgaben im Katalog auf einen ganzen Tag ausgelegt sind. Der Organisator kann trotzdem mehrmals am Tag oder alle paar Tage abschließen, ganz wie ihr es vereinbart.',
          'Während einer Runde:',
          [
            'erledigst du deine Aufgabe für die laufende Runde,',
            'reservierst du eine Aufgabe für die nächste Runde,',
            'bietest du in der Auktion auf Belohnungen.',
          ],
          'Am Ende der Runde trägt der Organisator ein, wer seine Aufgabe erledigt hat. Die App zahlt die Münzen aus, verteilt die Aufgaben für die nächste Runde, wertet die Auktion aus und startet eine neue Runde.',
        ],
      },
    },
    joinGroup: {
      summary:
        'Du trittst einer Gruppe mit einem Code vom Organisator bei. Die App merkt sie sich und lässt dich beim nächsten Mal direkt hinein.',
      detail: {
        title: 'Einer Gruppe beitreten',
        blocks: [
          'Tippe im Reiter Gruppen auf deine Gruppe und gib den Code ein. Das reicht einmal, beim nächsten Start lässt dich die App direkt hinein. Mit dem Symbol links im Kopfbereich verlässt du die Gruppe, und zurück kommst du ohne Code.',
          'Tipp: Installiere die App auf dem Startbildschirm, bevor du beitrittst. Auf dem iPhone hat die installierte App einen eigenen Speicher, getrennt von Safari. Wer in Safari beitritt und die App erst danach installiert, muss darin den Code und die PIN der Figur noch einmal eingeben.',
        ],
      },
    },
    newCharacter: {
      summary:
        'Lege eine Figur mit Namen und vierstelliger PIN an. Spielen kannst du, sobald der Organisator sie freigibt.',
      detail: {
        title: 'Eine neue Figur',
        blocks: [
          'Tippe im Reiter Spieler auf +, gib einen Namen und eine PIN ein. Bis der Organisator die Figur freigibt, wartet sie ausgegraut unter „Wartet auf Freigabe“ und niemand kann sie übernehmen. Mit der Freigabe bekommt sie die Start-Münzen.',
          'Merk dir deine PIN. Ohne sie kommst du von einem anderen Gerät nicht an deine Figur.',
        ],
      },
    },
    claimCharacter: {
      summary:
        'Deine Figur übernimmst du mit ihrer PIN. Ein Gerät hält eine Figur, eine Figur kann auf mehreren Geräten sein.',
      detail: {
        title: 'Deine Figur',
        blocks: [
          'Tippe in der Liste Spieler auf deine Figur und übernimm sie mit ihrer PIN. Die PIN brauchst du nur einmal, damit niemand aus Versehen eine fremde Figur nimmt. Dein Gerät merkt sich danach, dass du als diese Figur angemeldet bist.',
          [
            'Übernimmst du auf einem Gerät eine andere Figur, gibst du die vorherige damit frei.',
            'Deine Figur kann gleichzeitig auf mehreren Geräten sein, etwa auf Handy und Tablet.',
            'Abmelden kannst du dich auf ihrer Karte mit „Von dieser Figur abmelden“.',
          ],
        ],
      },
    },
    taskCoins: {
      summary:
        'In jeder Runde solltest du eine Aufgabe haben. Eine erledigte bringt Münzen, eine nicht geschaffte kostet eine Strafe. Eine Runde ohne Aufgabe auch.',
      detail: {
        title: 'Münzen für Aufgaben',
        blocks: [
          'Jede Aufgabe hat eine Schwierigkeit (die Punkte auf der Karte) und danach eine Belohnung. Die leichteste Aufgabe bringt 100 Münzen, die schwerste 200. Was eine Aufgabe bringt, siehst du auf ihrer Karte.',
          [
            'Eine nicht geschaffte Aufgabe kostet die Strafe bei Nichterfüllung. Sie ist für alle gleich, egal ob die Aufgabe leicht oder schwer war.',
            'Eine Runde ohne Aufgabe kostet die Strafe ohne Aufgabe.',
          ],
          'Wer seine Aufgabe erledigt hat, entscheidet der Organisator beim Rundenabschluss. Erst dann werden Münzen gutgeschrieben und abgezogen.',
        ],
      },
    },
    taskTypes: {
      summary: 'Es gibt Aufgaben für Einzelne, für Paare und für Gruppen.',
      detail: {
        title: 'Arten von Aufgaben',
        blocks: [
          [
            'Einzel: du erledigst die Aufgabe allein.',
            'Paare (Chip „Paar“): genau zwei Spieler. Deinen Partner lädst du selbst ein.',
            'Gruppen (Chip „Gruppe“ mit der Spielerzahl, etwa „Gruppe (3–4)“): jeder meldet sich selbst an, und die Gruppe wird beim Rundenabschluss zusammengestellt.',
          ],
          'Für das Erledigen bekommt jedes Mitglied eines Paars oder einer Gruppe die volle Belohnung. Der Organisator beurteilt jeden einzeln.',
        ],
      },
    },
    categories: {
      summary:
        'Du kannst nur eine Aufgabe aus einer Kategorie nehmen, die der Organisator für diese Runde geöffnet hat.',
      detail: {
        title: 'Offene Kategorien',
        blocks: [
          'Aufgaben haben Kategorien (die Tags auf der Karte). Der Organisator öffnet Kategorien getrennt für die laufende und für die nächste Runde. Auch die Arten von Aufgaben wirken wie Kategorien: „Paare“ zu öffnen öffnet alle Paar-Aufgaben. Eine Aufgabe ist offen, wenn mindestens eine ihrer Kategorien oder ihre Art offen ist.',
          'Beim Rundenabschluss werden die Kategorien der nächsten Runde zu denen der neuen Runde. Das Angebot für die Runde danach bleibt leer, bis der Organisator es wieder öffnet.',
          'Tipp: Die Filter „Nur laufende Runde“ und „Nur nächste Runde“ zeigen, was du gerade nehmen kannst.',
        ],
      },
    },
    onceOnly: {
      summary:
        'Jede Aufgabe machst du höchstens einmal im ganzen Spiel, auch eine, die nicht geklappt hat.',
      detail: {
        title: 'Jede Aufgabe nur einmal',
        blocks: [
          'Eine Aufgabe, die du schon hattest, ob erledigt oder nicht, kannst du weder erneut reservieren noch nehmen. Die App sagt „Diese Aufgabe hattest du schon.“ Auch die Aufgabe, die du gerade hast, kannst du nicht reservieren. Andere Spieler können sie trotzdem machen.',
          'Zu einer Aufgabe, die du schon hinter dir hast, lädt dich auch niemand ins Paar ein. Eine Aufgabe, von der du in einer Runde gewechselt bist, zählt nicht, die hast du nie gemacht.',
        ],
      },
    },
    reserve: {
      summary:
        'Deine Aufgabe für die nächste Runde reservierst du. Du kannst nur eine Reservierung haben, eine neue ersetzt die alte.',
      detail: {
        title: 'Reservierungen',
        blocks: [
          'Öffne eine Aufgabe und tippe auf „Für die nächste Runde reservieren“. Bis die Runde gesperrt wird, kannst du die Reservierung stornieren oder gegen eine andere tauschen. Deine Reservierung siehst du in deinem Profil. Auch eine angenommene Paar-Einladung ist deine Reservierung.',
          'Eine Reservierung garantiert die Aufgabe noch nicht. Das entscheidet sich erst beim Rundenabschluss.',
          'Reservierungen sind geheim. Die anderen sehen nur, dass du eine hast („Hat eine Reservierung“), und bei der Aufgabe die Zahl der Interessenten („Gefragt (2)“). Ein Paar zählt als einer. Wer die Aufgabe bekommen hat, sehen alle erst nach dem Rundenabschluss.',
        ],
      },
    },
    poorerRule: {
      summary: 'Wollen mehrere Spieler dieselbe Aufgabe, bekommt sie der Ärmere.',
      detail: {
        title: 'Die Regel des Ärmeren',
        blocks: [
          'Reservieren mehrere Spieler dieselbe Aufgabe für die nächste Runde, bekommt sie der mit weniger Münzen. So hilft das Spiel denen, bei denen es bisher nicht so gut lief.',
          'Es zählt der Stand nach der Abrechnung der endenden Runde, also schon mit der Belohnung oder Strafe für die Aufgabe dieser Runde. Nicht der, den du während der Runde siehst. Ausgaben in der Auktion beim selben Rundenabschluss zählen nicht, denn die Auktion kommt erst nach der Verteilung der Aufgaben.',
          'Wollen zwei Spieler die Aufgabe, gewinnt der mit dem niedrigeren Stand.',
          {
            example:
              'Beispiel: Nach der Abrechnung hat Bára 380 Münzen, Cyril 220. Die Aufgabe bekommt Cyril.',
          },
          'Für ein Paar zählt der Stand seines ärmeren Mitglieds.',
          {
            example:
              'Beispiel: Adam (300) und Bára (150) haben als Paar 150. Sie schlagen Cyril (200) und Dana (250), die 200 haben.',
          },
          'Bei Gruppenaufgaben tritt nicht Gruppe gegen Gruppe an, sondern die Spieler kämpfen um die Plätze in der Gruppe. Melden sich mehr an, als Plätze da sind, bekommen sie die Ärmsten.',
          'Haben beide Seiten gleich viel, gewinnt die frühere Reservierung. Bei einem Paar zählt, wann der Einladende reserviert hat, nicht wann der Partner angenommen hat. Wer eine Reservierung storniert und neu reserviert, bekommt eine neue Zeit.',
          'Stimmt auch die Zeit überein, entscheidet eine feste Reihenfolge im System, nie der Zufall. Dieselbe Lage geht also immer gleich aus. In der Praxis kommt das fast nie vor.',
          'Wer die Aufgabe nicht bekommt, bleibt in der nächsten Runde ohne Aufgabe.',
        ],
      },
    },
    noTask: {
      summary:
        'Klappt deine Reservierung nicht, bleibst du ohne Aufgabe. Nimm dir dann eine freie Aufgabe für die laufende Runde.',
      detail: {
        title: 'Wenn es nicht klappt',
        blocks: [
          'Wer beim Rundenabschluss keine Aufgabe bekommt, startet die neue Runde mit dem Chip „Keine Aufgabe“. Das passiert, wenn jemand gegen einen Ärmeren verliert, wenn sein Paar oder seine Gruppe nicht zustande kommt, oder wenn er nichts reserviert hat.',
          'Eine Ersatzaufgabe wird nicht automatisch zugeteilt. Nimm dir eine freie Aufgabe aus den Kategorien, die für die laufende Runde offen sind. Wer bis zum Rundenabschluss keine Aufgabe hat, zahlt die Strafe ohne Aufgabe.',
        ],
      },
    },
    takeNow: {
      summary:
        'Eine freie Aufgabe kannst du sofort für die laufende Runde nehmen. Wer zuerst kommt, mahlt zuerst.',
      detail: {
        title: 'Für die laufende Runde nehmen',
        blocks: [
          'Tippe bei einer Aufgabe auf „Für die laufende Runde nehmen“. Das geht nur bei Aufgaben aus Kategorien, die für die laufende Runde offen sind, und die sich in dieser Runde noch niemand genommen hat. Vergebene Aufgaben haben den Chip „Vergeben“. Tippt ihr zu zweit gleichzeitig, bekommt sie nur einer.',
          [
            'Eine Einzel-Aufgabe gehört sofort dir.',
            'Ein Paar startest du mit einer Einladung, und ihr bekommt die Aufgabe beide, sobald dein Partner annimmt. Solange die Einladung wartet, ist die Aufgabe für alle anderen vergeben. Lehnt der Partner ab, wird sie wieder frei.',
            'Eine Gruppenaufgabe kann man nicht für die laufende Runde nehmen, nur reservieren.',
          ],
          'Eine für die laufende Runde genommene Aufgabe wird genauso abgerechnet wie eine reservierte.',
        ],
      },
    },
    switchTask: {
      summary:
        'Deine Aufgabe in der laufenden Runde kannst du gegen eine andere freie tauschen, wenn der Organisator das erlaubt.',
      detail: {
        title: 'Aufgabe tauschen',
        blocks: [
          'Öffne eine andere freie Aufgabe und tippe auf „Zu dieser wechseln“. Deine bisherige Aufgabe wird für die anderen frei und zählt für dich nicht als erledigt.',
          'Der Organisator kann das Tauschen ausschalten. Wer schon eine Aufgabe hat, kann sie dann nicht tauschen und auch kein Paar für die laufende Runde starten oder annehmen. Wer keine Aufgabe hat, kann sich immer eine nehmen.',
          'Achtung: Verlässt du eine Paar-Aufgabe, verliert sie auch dein Partner.',
        ],
      },
    },
    pairInvite: {
      summary: 'Ein Paar startest du mit einer Einladung. Es gilt, sobald dein Partner annimmt.',
      detail: {
        title: 'Paar-Einladungen',
        blocks: [
          'Wähle bei einer Paar-Aufgabe einen Partner und tippe auf „Für die nächste Runde reservieren“ oder „Für die laufende Runde nehmen“. Dein Partner sieht oben eine Karte mit der Einladung und den Knöpfen „Annehmen“ und „Ablehnen“. Die Antwort lässt sich nicht zurücknehmen. Ihr seht sie beide auf der Karte, bis ihr sie mit dem Kreuz ausblendet.',
          [
            'Einladen kannst du nur jemanden, der diese Aufgabe noch nicht gemacht hat.',
            'Du kannst mehrere Einladungen bekommen, aber nur eine annehmen. Nimmst du eine weitere an, wird das vorherige Paar abgebrochen, und zwar für beide.',
            'Nimmst du eine Einladung an, wird deine eigene Reservierung storniert.',
            'Eine Einladung für die nächste Runde, die der Partner bis zum Rundenabschluss nicht annimmt, verfällt. Dann bekommt keiner von euch die Aufgabe.',
          ],
          'Bei der Regel des Ärmeren zählt für ein Paar der Stand des Ärmeren von euch.',
        ],
      },
    },
    pairTogether: {
      summary: 'Ein Paar macht man zusammen oder gar nicht. Wer aussteigt, bricht es für beide ab.',
      detail: {
        title: 'Zusammen oder gar nicht',
        blocks: [
          'Das Paar wird für euch beide abgebrochen, wenn einer von euch:',
          [
            'auf „Für beide abbrechen“ tippt oder die Reservierung storniert,',
            'eine andere Aufgabe reserviert,',
            'ein anderes Paar annimmt,',
            'in der laufenden Runde zu einer anderen Aufgabe wechselt.',
          ],
          'Die App warnt dich immer vorher. Für Gruppenaufgaben gilt das nicht: Geht einer, behalten die anderen die Aufgabe.',
        ],
      },
    },
    groupTasks: {
      summary:
        'Für eine Gruppenaufgabe meldet sich jeder selbst an. Die Gruppe entsteht beim Rundenabschluss, wenn genug Leute zusammenkommen.',
      detail: {
        title: 'Gruppenaufgaben',
        blocks: [
          'Eine Gruppenaufgabe hat eine Spannweite an Spielern, etwa 3 bis 4. Du lädst niemanden ein, jeder reserviert die Aufgabe selbst. Wie viele sich bisher angemeldet haben, zeigt die Karte der Aufgabe.',
          'Beim Rundenabschluss:',
          [
            'sind es weniger als das Minimum, fällt die Gruppe aus und niemand bekommt die Aufgabe,',
            'liegt die Zahl in der Spannweite, bekommen alle die Aufgabe,',
            'sind es mehr als das Maximum, bekommen die Ärmsten die Plätze (bei Gleichstand die frühere Reservierung) und die übrigen bleiben ohne Aufgabe.',
          ],
          {
            example:
              'Beispiel: Fünf Spieler mit 120, 90, 300, 90 und 200 Münzen reservieren eine Aufgabe für 3 bis 4 Spieler. Sie bekommen die mit 90, 90, 120 und 200. Der mit 300 bleibt ohne Aufgabe.',
          },
          'Auf deiner Karte siehst du dann, mit wem du in der Gruppe bist.',
        ],
      },
    },
    blindAuction: {
      summary:
        'Belohnungen werden verdeckt versteigert. Du bietest mindestens den Startpreis, und das höchste Gebot gewinnt.',
      detail: {
        title: 'Verdeckte Auktion',
        blocks: [
          'Der Preis auf der Karte einer Belohnung ist der Startpreis, also das niedrigste mögliche Gebot. Du kannst mehr bieten und so deine Chancen erhöhen. Wer wie viel geboten hat, sieht niemand. Bei einer Belohnung sieht man nur die Zahl der Interessenten.',
          'Bis die Runde gesperrt wird, kannst du dein Gebot ändern oder zurückziehen. Deine Gebote siehst du in deinem Profil.',
          'Bei gleichen Geboten gewinnt das frühere. Änderst du ein Gebot, rückt seine Zeit auf den Moment der Änderung.',
        ],
      },
    },
    paying: {
      summary:
        'Du zahlst erst beim Rundenabschluss und nur, wenn du gewinnst. Kannst du dein Gebot nicht bezahlen, geht die Belohnung an den Nächsten.',
      detail: {
        title: 'Bezahlen',
        blocks: [
          'Ein Gebot blockiert keine Münzen. Ein verlorenes Gebot kostet dich nichts. Du darfst sogar mehr bieten, als du gerade hast, etwa wenn du erwartest, dass dir deine Aufgabe in dieser Runde den Rest bringt. Der Gewinner zahlt sein volles Gebot.',
          'Beim Rundenabschluss zählt aber dein Stand nach der Abrechnung der Aufgaben, abzüglich der Belohnungen, die du beim selben Rundenabschluss schon gewonnen hast. Kannst du dein Gebot nicht bezahlen, geht die Belohnung an das nächsthöhere Gebot. Kann es niemand bezahlen, bleibt sie unverkauft. Die Belohnungen werden nacheinander in einer festen Reihenfolge ausgewertet.',
        ],
      },
    },
    rewardLimit: {
      summary:
        'Du kannst nur auf eine begrenzte Zahl von Belohnungen gleichzeitig bieten. Mehr gewinnst du in einer Runde auch nicht.',
      detail: {
        title: 'Limit für Belohnungen',
        blocks: [
          'Das Limit legt der Organisator fest, standardmäßig ist es 1 Belohnung pro Runde. Hast du es erreicht, geht kein weiteres Gebot, bis du eines zurückziehst.',
          'Das Limit gilt auch für Gewinne. Würdest du mehr Belohnungen gewinnen als erlaubt, gehen die weiteren an das nächsthöhere Gebot. Alle Formen zählen, Belohnungen wie Strafen.',
        ],
      },
    },
    rewardWon: {
      summary:
        'Eine gewonnene Belohnung gilt in der nächsten Runde. Sie findet außerhalb der App statt.',
      detail: {
        title: 'Eine gewonnene Belohnung',
        blocks: [
          'Wer was gewonnen hat, sehen nach dem Rundenabschluss alle. Auf der Karte des Gewinners steht „Hat eine Belohnung“, und wen eine Strafe trifft, der bekommt den Chip „Ist Ziel“. Das bleibt bis zum nächsten Rundenabschluss auf den Karten und im Transaktionsverlauf für immer.',
          'Die Belohnung oder Strafe selbst organisieren die Organisatoren. Die App hält nur fest, wer was gewonnen hat.',
        ],
      },
    },
    rewardForms: {
      summary:
        'Belohnungen gibt es in drei Formen: eine Belohnung für dich, eine Strafe für jemanden und eine Strafe für alle.',
      detail: {
        title: 'Formen von Belohnungen',
        blocks: [
          [
            'Belohnung: ein Vorteil für dich.',
            'Strafe für jemanden: trifft die Spieler, die du wählst.',
            'Strafe für alle: trifft alle außer dir.',
          ],
          'Alle Formen werden gleich versteigert.',
        ],
      },
    },
    pickTargets: {
      summary:
        'Bei einer Strafe für jemanden wählst du die Ziele schon beim Bieten. Dich selbst kannst du nicht wählen.',
      detail: {
        title: 'Ziele wählen',
        blocks: [
          'Wie viele Ziele du wählst, steht bei der Belohnung, etwa 1 bis 2. Die Ziele kannst du zusammen mit dem Gebot ändern, bis die Runde gesperrt wird. Die endgültigen Ziele werden erst beim Rundenabschluss bestimmt und können daher von deiner Wahl abweichen.',
        ],
      },
    },
    targetLimit: {
      summary:
        'Ein Spieler kann pro Runde nur begrenzt oft Ziel sein. Wer ausgebucht ist, steht in der Auswahl als „schon vergeben“.',
      detail: {
        title: 'Limit für Ziele',
        blocks: [
          'Das Limit legt der Organisator fest, standardmäßig kann jeder pro Runde Ziel von höchstens einer Strafe sein. Für Strafen für alle gilt es nicht.',
          'Während der Runde: Zielen so viele Gebote auf einen Spieler, wie das Limit erlaubt, können neue Gebote ihn nicht wählen. Er wird wieder frei, sobald eines dieser Gebote sein Ziel ändert oder zurückgezogen wird. Ein Gebot, das ihn schon hat, behält ihn.',
          'Beim Rundenabschluss werden die Ziele neu verteilt, angefangen beim höchsten gewinnenden Gebot:',
          [
            'der Gewinner bekommt seine gewählten Ziele, solange sie das Limit noch nicht erreicht haben,',
            'Ziele, die das Limit erreicht haben, fallen weg,',
            'bleiben so weniger Ziele als das Minimum, wird mit den Spielern aufgefüllt, die am seltensten Ziel sind. Die Reihenfolge beim Auffüllen wechselt jede Runde, damit es nicht immer dieselben trifft.',
          ],
        ],
      },
    },
    lockedRound: {
      summary:
        'Sperrt der Organisator die Runde, friert alles ein. Aufgaben, Reservierungen, Einladungen und Gebote lassen sich dann nicht ändern.',
      detail: {
        title: 'Eine gesperrte Runde',
        blocks: [
          'Der Organisator sperrt die Runde, wenn er mit dem Abschluss beginnt, und sie bleibt nur bis zum Ende des Abschlusses gesperrt. In der Zeit kann niemand Aufgaben nehmen oder ändern, reservieren, Reservierungen stornieren, auf Einladungen antworten, bieten oder Gebote zurückziehen. Die Runde bleibt genau so, wie der Organisator sie abschließt.',
        ],
      },
    },
    evaluationOrder: {
      summary:
        'Der Rundenabschluss läuft in fester Reihenfolge: Abrechnung der Aufgaben, Verteilung der Reservierungen, Auktion.',
      detail: {
        title: 'Ablauf des Rundenabschlusses',
        blocks: [
          {
            steps: [
              'Abrechnung: der Organisator hakt ab, wer seine Aufgabe erledigt hat. Eine erledigte Aufgabe bringt ihre Belohnung, eine nicht abgehakte kostet die Strafe bei Nichterfüllung. Wer keine Aufgabe hatte, zahlt die Strafe ohne Aufgabe.',
              'Reservierungen: die Aufgaben für die nächste Runde werden nach der Regel des Ärmeren verteilt, mit den Ständen nach der Abrechnung.',
              'Auktion: jede Belohnung geht an das höchste Gebot, das sie bezahlen kann, bezahlt vom Stand nach der Abrechnung.',
              'Neue Runde: Reservierungen werden zu Aufgaben, und gewonnene Belohnungen gelten.',
            ],
          },
          'Dank dieser Reihenfolge entscheiden Ausgaben in der Auktion nie darüber, ob du deine reservierte Aufgabe bekommst.',
        ],
      },
    },
    newRound: {
      summary:
        'Nach dem Rundenabschluss beginnt eine neue Runde. Reservierungen werden zu Aufgaben, und gewonnene Belohnungen gelten.',
      detail: {
        title: 'Eine neue Runde',
        blocks: [
          [
            'Wer seine Reservierung gewonnen hat, hat eine Aufgabe für die neue Runde, bei Paaren und Gruppen mit den Namen der Partner.',
            'Wer nicht, hat „Keine Aufgabe“ und kann sich eine freie Aufgabe nehmen.',
            'Die Kategorien der nächsten Runde werden zu denen der neuen Runde. Das Angebot für die Runde danach öffnet der Organisator wieder.',
            'Reservierungen und Gebote werden gelöscht, du startest die nächste Runde von vorn.',
            'Belohnungen und Ziele der vorigen Runde verschwinden von den Karten. Im Transaktionsverlauf bleiben sie.',
          ],
        ],
      },
    },
    profile: {
      summary:
        'In deinem Profil findest du deine Statistiken und deinen Transaktionsverlauf. Sie sehen nur du und die Organisatoren.',
      detail: {
        title: 'Profil',
        blocks: [
          [
            'Deine Karte: Aufgabe, Reservierung, Gebote und gewonnene Belohnungen.',
            'Statistiken: erledigte Aufgaben, gewonnene Belohnungen, verdiente und ausgegebene Münzen. Verdient zählt nur Münzen für erledigte Aufgaben, ausgegeben nur Münzen für gewonnene Belohnungen. Strafen und Anpassungen durch den Organisator stehen im Verlauf.',
            'Transaktionsverlauf: jede Belohnung für eine Aufgabe, jede Strafe, jede gewonnene Belohnung und jede Anpassung durch den Organisator, mit deinem Stand nach jeder Änderung. Der ganze Verlauf („Mehr anzeigen“) beginnt mit dem Anfangsstand.',
          ],
        ],
      },
    },
    adjustments: {
      summary:
        'Der Organisator kann Münzen von Hand hinzufügen oder abziehen. Den Grund siehst du immer im Verlauf.',
    },
    negativeBalance: {
      summary: 'Ob ein Stand unter null fallen kann, entscheidet der Organisator.',
      detail: {
        title: 'Negativer Stand',
        blocks: [
          'Ist ein negativer Stand nicht erlaubt, stoppen Strafen und Anpassungen bei null. Ist er erlaubt, kannst du Schulden machen, und bei der Regel des Ärmeren zählen Schulden dann als weniger als null.',
        ],
      },
    },
    whoSeesWhat: {
      summary:
        'Alle sehen, wie viele Münzen jeder hat, welche Aufgabe er hat und was er gewonnen hat. Was jemand reserviert oder worauf er bietet, ist geheim.',
      detail: {
        title: 'Wer sieht was',
        blocks: [
          'Alle sehen:',
          [
            'den Münzstand jedes Spielers,',
            'die Aufgabe jedes Spielers für die laufende Runde (Name, Beschreibung, Partner),',
            'ob ein Spieler eine Reservierung hat, aber nicht wofür,',
            'die Zahl der Interessenten bei Aufgaben und Belohnungen,',
            'welche Aufgaben vergeben sind,',
            'gewonnene Belohnungen und ihre Ziele.',
          ],
          'Nur du und die Organisatoren:',
          [
            'was du reserviert hast,',
            'worauf und wie viel du bietest und wen du bestrafen willst,',
            'deine Statistiken und dein Transaktionsverlauf.',
          ],
          'Eine Paar-Einladung seht nur ihr beide.',
        ],
      },
    },
    groupSettings: {
      summary:
        'Die Höhe der Strafen, die Limits und ein paar weitere Details legt der Organisator fest.',
      detail: {
        title: 'Gruppen-Einstellungen',
        blocks: [
          'Der Organisator kann festlegen:',
          [
            'die Start-Münzen, die eine neue Figur bei der Freigabe bekommt,',
            'die Strafe bei Nichterfüllung einer Aufgabe,',
            'die Strafe für eine Runde ohne Aufgabe,',
            'auf wie viele Belohnungen ein Spieler pro Runde bieten und wie viele er gewinnen kann,',
            'wie oft ein Spieler pro Runde Ziel einer Strafe sein kann,',
            'ob ein Stand unter null fallen kann,',
            'ob man eine Aufgabe in der laufenden Runde tauschen kann.',
          ],
        ],
      },
    },
  },
};
