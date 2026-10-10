/* App-tartalom: témák (lapozható kártyák), menük.
   A részletoldalak, források, levélkérdések stb. a data.gen.js-ből jönnek (a weboldalból generálva). */
window.CONTENT = {
  topics: [
    {
      id: 'lenyeg', title: 'A lényeg 60 mp alatt', sub: 'Öt mondat, amit érdemes megjegyezni', icon: 'st-book', tone: 'pink',
      cards: [
        { t: 'cover', img: 'hero', eyebrow: 'Kezdd itt', title: 'A papír jobb, mint a tablet.', text: 'Miért legyen az általános iskolában a <b>könyv, a papír, a ceruza és a tanár</b> az alap – és miért nem az iskola dolga, hogy csillagokra, ládákra és avatárokra szoktassa a gyereket?' },
        { t: 'text', bg: 'cream', eyebrow: 'Az alapállás', title: 'A képernyőnek kell bizonyítania.', text: 'Nem azt állítjuk, hogy minden képernyő mérgező. Azt állítjuk, hogy 7–14 éves korban <b>a digitális eszköznek kell bizonyítania</b>, hogy egy konkrét feladatban többet ad a könyvnél, a füzetnél és a tanárnál – nem fordítva.' },
        { t: 'stat', bg: 'pink', num: '1', icon: 'st-book', title: 'Az analóg az alap, a digitális a kivétel.', text: 'Svédország, Dánia és Norvégia is ebbe az irányba fordult: vissza a tankönyvhöz, az íráshoz, az olvasáshoz.', more: 'analog' },
        { t: 'stat', bg: 'cream', num: '2', icon: 'st-eye', title: 'A figyelem a legértékesebb kincs.', text: 'A digitális figyelemelvonás az egyik legjobban dokumentált iskolai probléma – és rosszabb teljesítménnyel jár együtt.', more: 'figyelem' },
        { t: 'stat', bg: 'blue', num: '3', icon: 'st-chest', title: 'A jutalom kiszoríthatja a kíváncsiságot.', text: 'A várt jutalmak gyerekeknél átlagosan csökkentik a belső motivációt – a szimbolikus jutalmak, oklevelek is.', more: 'jutalom' },
        { t: 'stat', bg: 'cream', num: '4', icon: 'st-pencil', title: 'A kéz tanítja az agyat.', text: 'A kézírás olyan mozgásos és észlelési folyamatokat mozgósít, amelyeket a koppintás nem. Hosszabb szöveget papíron átlagosan jobban értünk.', more: 'kez' },
        { t: 'stat', bg: 'pink', num: '5', icon: 'st-brain', title: 'Minden képernyőperc csak pótlék.', text: 'A legerősebb érv a kiszorítás: ami a tableten történik, az nem kézzel írt munka, nem tárgyi tapasztalat, nem közös gondolkodás.', more: 'kiszoritas' },
        { t: 'quote', bg: 'blue', text: '„Az alapkészségek elsajátításának <em>alapját analóg tevékenységek</em> képezzék. Digitális taneszközt csak ott, ahol <em>bizonyítottan segíti</em> a tanulást.”', cite: 'a svéd kormány oktatáspolitikai elve, összefoglalva <sup class="c" data-s="swe1"></sup>' },
        { t: 'stats', bg: 'cream', title: 'Számokban', items: [
          { n: '79', l: 'oktatási rendszerben volt iskolai telefonkorlátozás 2024 végére', s: 'unesco-blog' },
          { n: '540 M', u: 'DKK', l: 'Dánia nyomtatott könyvekre, „a képernyő ellensúlyaként”', s: 'dk1' },
          { n: '59%', l: 'a diákoknak eltereli a figyelmét a társak eszköze matekórán', s: 'pisa22' },
          { n: '+21%', l: 'rövidlátás-esély minden további napi képernyőóránként (összefüggés)', s: 'ha2025' },
        ] },
        { t: 'cta', bg: 'pink', icon: 'st-chest', title: 'Most jön a lényeg.', text: 'A legfontosabb téma: miért nem jó ötlet, ha az iskola pontokkal, ládákkal és avatárokkal tanít.', label: 'A jutalomcsapda', go: 'learn/csapda' },
      ],
    },
    {
      id: 'csapda', title: 'A jutalomcsapda', sub: 'Ne az iskola szoktassa rá a gyereket a gamingre', icon: 'st-chest', tone: 'blue',
      cards: [
        { t: 'cover', img: 'tablet', pos: '62% 30%', eyebrow: 'Egy kérdés', title: 'Mire tanít a matekóra, ha jutalmat oszt?', text: 'Csillag a helyes válaszért, láda a sorozatért, új sapka az avatárnak. Működik – a gyerek kattint. De mit tanul meg arról, <b>miért</b> érdemes gondolkodni?' },
        { t: 'text', bg: 'pink', eyebrow: 'A fő üzenet', title: 'Ne az iskola szoktassa rá a gyereket a gamingre.', text: 'Egy gamifikált matekapp nem csak feladatokat ad. Csillagot, ládát, avatár-tárgyat, célokat és ranglistát is – ugyanazokat az eszközöket, amelyekkel a játékipar a visszatérést optimalizálja.<br><br><b>A kérdés nem az, hogy ez működik-e. Hanem, hogy mire tanít.</b>' },
        { t: 'loop', bg: 'blue', kind: 'ext', eyebrow: 'Külső jutalomhurok', title: '„Még kettő, és jön a láda.”', text: 'A motor a következő jutalom. A kör egyre gyorsul – a tananyag lassan <b>eszközzé</b> válik a gyűjtögetéshez.' },
        { t: 'loop', bg: 'cream', kind: 'int', eyebrow: 'Belső tanulási hurok', title: '„Rájöttem valamire!”', text: 'A motor maga a megértés. Lassabb, van benne elakadás – de <b>a gyereké</b> marad, és nem kell hozzá egyre több külső inger.' },
        { t: 'list', bg: 'cream', eyebrow: 'Mechanizmusok', title: 'Négy működési elv, amit érdemes ismerni', rows: [
          { icon: 'st-chest', title: 'Kiszámíthatatlan jutalom', sub: 'A „láda” logikája: a nyerőgépek elve', d: 'varratio' },
          { icon: 'st-star', title: 'Túligazolási hatás', sub: 'Amit jutalomért csinálunk, azt kevésbé magáért', d: 'overjust' },
          { icon: 'st-avatar', title: 'Csábító részletek', sub: 'Figurák, animációk elviszik a figyelmet', d: 'seductive' },
          { icon: 'st-trophy', title: 'Szokásformálás', sub: 'Napi célok, sorozatok, szintek', d: 'habit' },
        ] },
        { t: 'bars', bg: 'cream', eyebrow: 'Klasszikus kísérlet, 1973', title: 'A filctollas óvodások.', text: 'Rajzolni szerető óvodások. Az egyik csoport előre tudta: aki rajzol, oklevelet kap. Két héttel később, szabad játékidőben ők <b>kb. feleannyit</b> rajzoltak.<sup class="c" data-s="lepper"></sup>', note: 'A szabad játékidő hány %-ában rajzoltak. Kerekítve.', bars: [
          { l: 'Nem kapott jutalmat', v: '≈17%', w: 83 }, { l: 'Váratlan jutalom', v: '≈18%', w: 90 }, { l: 'Előre megígért jutalom', v: '≈9%', w: 43, hl: true },
        ] },
        { t: 'stat', bg: 'blue', big: 'd = −0,42', title: 'A jelvény is jutalom.', text: '128 kísérlet metaanalízise: gyerekeknél a várt jutalmak csökkentették a belső motivációt (d = −0,39) – a <b>szimbolikus jutalmak, például oklevelek</b> ugyanúgy (d = −0,42), mint a játékok vagy édességek.<sup class="c" data-s="deci"></sup>', more: 'overjust' },
        { t: 'mirror', bg: 'ink' },
        { t: 'text', bg: 'cream', dashed: true, eyebrow: 'Őszintén', title: 'Amit nem állítunk.', text: '<b>Nem állítjuk, hogy egy gamifikált matekapp bizonyítottan játékfüggőséget okoz</b> – erre nincs közvetlen bizonyíték, és a gamifikáció átlagosan kis–közepes pozitív hatást is mutat.<sup class="c" data-s="sailer"></sup><br><br>Amit állítunk: az iskola mintát ad. Ha a matematikát pontokba, ládákba és avatár-tárgyakba csomagolja, azt tanítja, hogy <b>a tanulás valami más megszerzésének eszköze</b>.', more: 'matific', moreLabel: 'Példa: mit tartalmaz egy gamifikált matekapp?' },
      ],
    },
    {
      id: 'kez', title: 'Kéz és papír', sub: 'Kézírás, nyomtatott szöveg, megfogható matek', icon: 'st-pencil', tone: 'pink',
      cards: [
        { t: 'cover', img: 'handwriting', eyebrow: 'Kézírás', title: 'A kéz tanítja az agyat.', text: 'Egy betű kézzel leírva egyedi mozdulatsor, amelyet az agy összekapcsol a látott formával. A billentyűn minden betű ugyanaz a koppintás.' },
        { t: 'text', bg: 'cream', eyebrow: 'Amit a kutatás mutat', title: 'Nem nosztalgia, hanem mechanizmus.', text: 'Kisgyerekeknél a kézzel gyakorolt betűket jobban ismerték fel, mint a gépelve gyakoroltakat.<sup class="c" data-s="longcamp"></sup><br><br>Képalkotó vizsgálatban az olvasáshoz kapcsolódó agyi hálózat csak kézírásos gyakorlás után aktiválódott – gépelés után nem.<sup class="c" data-s="james"></sup>', more: 'eeg', moreLabel: 'És a sokat idézett EEG-kutatás?' },
        { t: 'cta', bg: 'pink', icon: 'st-pencil', title: 'Próbáld ki magadon.', text: 'Írj le valamit az ujjaddal, aztán „gépeld be”. Nézd meg, mennyivel több döntés van egy kézírásos vonásban.', label: 'Kézírás-labor', go: 'lab/pad' },
        { t: 'stat', bg: 'blue', big: 'g = −0,21', title: 'Papíron jobban értjük.', text: '54 vizsgálat, 171 055 résztvevő: a nyomtatott szöveget átlagosan jobban értették meg. A különbség <b>időnyomás alatt és ismeretterjesztő szövegeknél</b> nagyobb – és az évek során nem csökkent.<sup class="c" data-s="delgado"></sup>', more: 'reading', moreLabel: 'Mi lehet az oka?' },
        { t: 'readdemo', bg: 'cream', title: 'A lapnak van helye. A görgetésnek nincs.', text: 'Papíron az emlék „helyhez kötődik” – bal oldal, lap alja. Görgetéskor a fogódzó elcsúszik.<sup class="c" data-s="clinton"></sup>' },
        { t: 'photo', img: 'manipulatives', bg: 'cream', eyebrow: 'Megfogható matematika', title: 'Rudak, kockák, törtkorongok.', text: '55 vizsgálat: tárgyi eszközökkel jobb eredmény (d = 0,37); a <b>megtartásban 0,59</b>, a <b>törteknél 0,69</b>.<sup class="c" data-s="carbonneau"></sup>' },
      ],
    },
    {
      id: 'figyelem', title: 'Figyelem', sub: 'A legértékesebb kincs', icon: 'st-eye', tone: 'blue',
      cards: [
        { t: 'text', bg: 'blue', eyebrow: 'Figyelem', title: 'A figyelem a legértékesebb kincs.', text: 'Nem „agykárosodás” a legjobban dokumentált probléma, hanem valami egyszerűbb: <b>a képernyő elviszi a figyelmet</b> – a sajátunkat és a padtársét is.' },
        { t: 'stat', bg: 'cream', big: '59%', title: 'Társak eszköze, elvesző figyelem.', text: 'A 15 évesek 59%-ának legalább néhány matekórán eltereli a figyelmét a társak eszköze; akiket gyakran, azok átlagosan <b>15 ponttal</b> gyengébben teljesítettek.<sup class="c" data-s="pisa22"></sup>', more: 'pisa' },
        { t: 'stat', bg: 'pink', big: '38,6 → 28,4%', title: 'Már a falon lévő képek is számítanak.', text: 'Óvodások figyelmen kívüli ideje dúsan dekorált vs. visszafogott teremben – a tesztpontosság 42% → 55%. Mit tesz egy mozgó, csilingelő felület?<sup class="c" data-s="fisher"></sup>' },
        { t: 'stat', bg: 'cream', big: 'g = −0,33', title: 'Csábító részletek.', text: 'A tananyaghoz nem tartozó érdekes képek, figurák, animációk átlagosan rontják a tanulást (58 vizsgálat, 7500+ diák).<sup class="c" data-s="sundararajan"></sup>', more: 'seductive' },
        { t: 'curve', bg: 'blue', title: 'Nem „képernyő = rossz”.', text: 'A napi legfeljebb ~1 órás, tanulási célú használat jobb eredménnyel járt együtt, mint a semmi; a szabadidős használat 1 óra felett romlóval.<sup class="c" data-s="pisa22"></sup> A digitális eszköz <b>adagolt kivétel</b> legyen.', more: 'adhd', moreLabel: 'Figyelemzavar és képernyő' },
        { t: 'cta', bg: 'pink', icon: 'st-star', title: 'Teszteld a saját fókuszod.', text: 'Két kör fejszámolás: egy csendes és egy „gamifikált”. Mérjük az idődet.', label: 'Fókusz-teszt', go: 'lab/focus' },
      ],
    },
    {
      id: 'egeszseg', title: 'Test és egészség', sub: 'Szem, alvás, teljes expozíció', icon: 'st-moon', tone: 'pink',
      cards: [
        { t: 'anim', anim: 'eye', bg: 'cream', big: 'OR 1,21', title: 'Rövidlátás', text: '45 vizsgálat, 335 524 résztvevő: minden további napi képernyőóra kb. 21%-kal magasabb esély – 4 óránál közel kétszeres. Az oksági bizonyosság alacsony.<sup class="c" data-s="ha2025"></sup>', more: 'myopia' },
        { t: 'anim', anim: 'moon', bg: 'blue', big: 'OR 2,17', title: 'Alvás', text: '125 198 gyerek: a lefekvés körüli eszközhasználat több mint kétszeres eséllyel járt elégtelen alvással.<sup class="c" data-s="carter"></sup>', more: 'sleep' },
        { t: 'anim', anim: 'phone', bg: 'cream', big: 'OR 1,31', title: 'Saját telefon 12 évesen', text: 'Több mint 10 000 gyerek: magasabb depresszió- (1,31), elhízás- (1,40) és alváshiány- (1,62) esély.<sup class="c" data-s="barzilay"></sup>', more: 'phone12', moreLabel: 'Miért fontos ez itt?' },
        { t: 'text', bg: 'pink', eyebrow: 'Fair play', title: 'Nem keverjük össze. De összeadjuk.', text: 'A délelőtt 10:30-kor kiosztott 20 perces matekfeladat nem azonos az este 22:30-kor ágyban nyomkodott telefonnal. Ezek a kutatások főleg a <b>teljes</b> és az esti képernyőidőről szólnak – de az iskolai percek erre adódnak rá.' },
        { t: 'photo', img: 'outdoor', bg: 'cream', eyebrow: 'A legjobb ellensúly', title: 'Szabad levegő, messzire tekintés, mozgás', text: 'A szabadban töltött idő a rövidlátás egyik legjobb ellenszere – és minden perc, amit a gyerek nem a képernyő előtt tölt, ezt segíti.' },
        { t: 'cta', bg: 'blue', icon: 'st-eye', title: 'Számold ki a gyereked hetét.', text: 'Iskola + házi + szabadidő: mennyi képernyő jut egy hétre, egy évre?', label: 'Heti mérleg', go: 'lab/calc' },
      ],
    },
    {
      id: 'vilag', title: 'A világ már reagált', sub: 'Svédország, Dánia, Norvégia, USA…', icon: 'city-stockholm', tone: 'blue',
      cards: [
        { t: 'cover', img: 'classroom', pos: '50% 45%', eyebrow: '2015 óta tudjuk', title: 'Több gép nem jelent több tudást.', text: 'Az OECD szerint ahol sokat fektettek az oktatási IKT-ba, nem volt érdemi javulás olvasásban, matekban, természettudományban.<sup class="c" data-s="oecd15"></sup>' },
        { t: 'text', bg: 'pink', eyebrow: 'Nemzetközi fordulat', title: 'A képernyőnek kell bizonyítania.', text: 'Azok az országok, amelyek a leggyorsabban digitalizálták az iskolát, ma tudatosan lépnek vissza. Nem tiltással – hanem azzal, hogy <b>a bizonyítási teher megfordul</b>.' },
        { t: 'timeline', bg: 'cream', title: 'Idővonal I.', items: [
          ['2015', 'OECD', 'Sok IKT-befektetés, nincs érdemi javulás.'],
          ['2023 · ápr.', 'Karolinska Intézet', '„A digitális eszközök a tanulást inkább ronthatják, mint javíthatják.”'],
          ['2023', 'Svédország', '685 M SEK tankönyvekre, a digitalizációs stratégia leállítva.'],
        ] },
        { t: 'timeline', bg: 'cream', title: 'Idővonal II.', items: [
          ['2023 · júl.', 'UNESCO GEM', 'Technológia csak akkor, ha egyértelműen segíti a tanulást.'],
          ['2024 · jan.', 'Hollandia', 'Telefon nélküli osztálytermek.'],
          ['2024 · febr.–márc.', 'Dánia', '12 képernyő-ajánlás + 540 M DKK nyomtatott könyvekre.'],
        ] },
        { t: 'timeline', bg: 'cream', title: 'Idővonal III.', items: [
          ['2024 · szept.', 'Magyarország', 'Okoseszköz csak engedéllyel, rögzített céllal és időtartammal.'],
          ['2025 · júl.', 'Svédország', 'Óvoda: megszűnt a digitális eszközök követelménye.'],
          ['2026 · ápr.', 'Los Angeles', 'Képernyőidő-korlátozás, papír és toll előnyben.'],
          ['2026 · aug.', 'Svédország', 'Egész napos mobilmentes iskola.'],
        ] },
        { t: 'countries', bg: 'cream', title: 'Európa', items: [
          { d: 'se', name: 'Svédország', img: 'city-stockholm', tag: 'Precedens' },
          { d: 'dk', name: 'Dánia', img: 'city-copenhagen', tag: 'Könyvek' },
          { d: 'no', name: 'Norvégia', img: 'city-oslo', tag: 'Papír' },
          { d: 'nl', name: 'Hollandia', txt: 'NL', tag: 'Mért hatás' },
        ] },
        { t: 'countries', bg: 'cream', title: 'Máshol – és itthon', items: [
          { d: 'us', name: 'USA', img: 'city-losangeles', tag: '2. hullám' },
          { d: 'uk', name: 'Anglia', txt: 'UK', tag: 'Árnyalat' },
          { d: 'hu', name: 'Magyarország', txt: 'HU', tag: 'Itthon' },
          { d: 'unesco', name: 'UNESCO', txt: '79', tag: 'Globális' },
        ] },
      ],
    },
    {
      id: 'vita', title: 'Tisztességes vita', sub: 'Amit nem állítunk – és az ellenérvek', icon: 'st-brain', tone: 'pink',
      cards: [
        { t: 'text', bg: 'blue', eyebrow: 'Tisztességes vita', title: 'Amit nem állítunk.', text: 'A túlzás a legrövidebb út ahhoz, hogy egy jó ügyet elutasítsanak. Lapozz: minden kártyán egy mondat, amit mi is kerülünk – koppints, és megmutatjuk, mit mondunk helyette.' },
        { t: 'claims', bg: 'cream', from: 0, to: 2 },
        { t: 'claims', bg: 'cream', from: 2, to: 4 },
        { t: 'claims', bg: 'cream', from: 4, to: 6 },
        { t: 'counter', bg: 'pink', title: 'Ellenérvek I.', from: 0, to: 4 },
        { t: 'counter', bg: 'pink', title: 'Ellenérvek II.', from: 4, to: 7 },
        { t: 'quote', bg: 'blue', text: '„A gyerekkor nem technológiai tesztlabor. Képernyő csak akkor vegyen el időt a könyvtől, a papírtól és a tanártól, ha <em>bizonyíthatóan többet ad</em>.”', cite: 'Ez nem technológiaellenesség, hanem bizonyítékalapú óvatosság.' },
      ],
    },
  ],

  labs: [
    { id: 'jutalom', title: 'A jutalomréteg', sub: 'Mit csinált veled ez az app?', icon: 'st-chest', tone: 'ink' },
    { id: 'focus', title: 'Fókusz-teszt', sub: 'Csendes vs. gamifikált kör', icon: 'st-star', tone: 'blue' },
    { id: 'pad', title: 'Kézírás-labor', sub: 'Kéz vagy koppintás?', icon: 'st-pencil', tone: 'pink' },
    { id: 'calc', title: 'Heti mérleg', sub: 'A gyereked teljes képernyőideje', icon: 'st-eye', tone: 'cream' },
    { id: 'quiz', title: 'Kvíz', sub: '10 kérdés, néhány meglepetés', icon: 'st-brain', tone: 'pink' },
  ],

  acts: [
    { id: 'letter', title: 'Levél az iskolának', sub: '3 lépésben, kész szöveggel', icon: 'st-pencil', tone: 'blue', who: 'Szülőknek' },
    { id: 'teachers', title: 'Játékos, mégis analóg', sub: '6 bevált módszer', icon: 'st-book', tone: 'pink', who: 'Pedagógusoknak' },
    { id: 'policy', title: 'Analóg először', sub: '7 pontos keret', icon: 'st-trophy', tone: 'cream', who: 'Döntéshozóknak' },
    { id: 'share', title: 'Add tovább', sub: 'Egy szülőtársnak, egy tanárnak', icon: 'st-star', tone: 'ink', who: 'Mindenkinek' },
  ],

  sourceFilters: [['all', 'Mind'], ['policy', 'Oktatáspolitika'], ['learning', 'Tanulás'], ['motivation', 'Motiváció'], ['health', 'Egészség'], ['product', 'Termék']],
};
