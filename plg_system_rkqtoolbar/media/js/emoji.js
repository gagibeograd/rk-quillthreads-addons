/* RK: emodži birač za traku iznad QuillThreads polja. Isti podaci i izgled kao naš birač u JComments-u
 * (templates/it_medical/html/com_jcomments/default/rk-emoji.js): kategorije, pretraga na srpskom, „Nedavno".
 * Razlika: upis u polje ide kroz prosleđenu funkciju (toolbar.js piše kroz React-ov setter), a birač se
 * kači na naše dugme. Izlaže window.rkQtEmoji.create(host, insert, anchor). */
(function () {
	'use strict';

	var RECENT_KEY = 'rkqt_emoji_recent', RECENT_MAX = 24;
	var L = ((window.Joomla && Joomla.getOptions && Joomla.getOptions('plg_system_rkqtoolbar')) || {}).labels || {};

	// Kategorije: [naslov, ikona-taba, [ "emoji|ključne reči", ... ]]
	var DATA = [
		['Smajliji', '😀', [
			'😀|osmeh srecan', '😃|osmeh', '😄|osmeh oci', '😁|kez zubi', '😆|smeh', '😅|smeh znoj', '🤣|smeh pod', '😂|smeh suze',
			'🙂|osmeh blagi', '🙃|naopako', '😉|namig', '😊|rumen srecan', '😇|andjeo oreol', '🥰|zaljubljen srca', '😍|zaljubljen oci srca',
			'🤩|zvezde ocaran', '😘|poljubac srce', '😗|poljubac', '😚|poljubac zatvorene oci', '😙|poljubac osmeh', '🥲|suza osmeh',
			'😋|ukusno njam', '😛|jezik', '😜|jezik namig', '🤪|lud', '😝|jezik zatvorene oci', '🤑|novac', '🤗|zagrljaj', '🤭|ruka usta',
			'🤫|tiho psst', '🤔|razmisljanje', '🤐|zatvorena usta', '🤨|sumnja obrva', '😐|neutralan', '😑|bezizrazan', '😶|bez usta',
			'😏|prepreden', '😒|nezadovoljan', '🙄|kolutanje ocima', '😬|grimasa', '🤥|laz nos', '😌|olaksanje', '😔|tuzan zamisljen',
			'😪|pospan', '🤤|balavljenje', '😴|spavanje', '😷|maska bolestan', '🤒|temperatura', '🤕|povreda zavoj', '🤢|muka',
			'🤮|povracanje', '🤧|kijanje', '🥵|vrucina', '🥶|hladno', '🥴|omamljen', '😵|vrtoglavica', '🤯|eksplozija glava',
			'🤠|kauboj', '🥳|zurka', '🥸|prerusen', '😎|naocare kul', '🤓|strebe naocare', '🧐|monokl', '😕|zbunjen', '😟|zabrinut',
			'🙁|tuzan', '☹️|tuzan', '😮|iznenadjen', '😯|zapanjen', '😲|sokiran', '😳|crven stid', '🥺|molim oci', '😦|uplasen',
			'😧|bol', '😨|strah', '😰|strah znoj', '😥|razocaran', '😢|plac', '😭|plac glasno', '😱|vrisak', '😖|zbunjen', '😣|uporan',
			'😞|razocaran', '😓|znoj', '😩|umoran', '😫|iscrpljen', '🥱|zevanje', '😤|besan nos', '😡|besan crven', '😠|ljut',
			'🤬|psovke', '😈|djavo', '👿|djavo ljut', '💀|lobanja', '☠️|lobanja kosti', '💩|kaka', '🤡|klovn', '👹|ogr', '👺|goblin',
			'👻|duh', '👽|vanzemaljac', '🤖|robot', '😺|macka osmeh', '😸|macka kez', '😹|macka smeh', '😻|macka srca', '😽|macka poljubac',
			'🙈|majmun ne vidi', '🙉|majmun ne cuje', '🙊|majmun ne govori'
		]],
		['Gestovi i ljudi', '👍', [
			'👋|mahanje zdravo', '🤚|dlan', '🖐️|saka prsti', '✋|dlan stop', '🖖|vulkan', '👌|ok', '🤌|prsti italijan', '🤏|malo',
			'✌️|pobeda mir', '🤞|prekrsteni prsti sreca', '🤟|volim te', '🤘|rok', '🤙|pozovi', '👈|levo', '👉|desno', '👆|gore',
			'🖕|srednji prst', '👇|dole', '☝️|kaziprst', '👍|palac gore super', '👎|palac dole', '✊|pesnica', '👊|udarac', '🤛|pesnica levo',
			'🤜|pesnica desno', '👏|aplauz', '🙌|slavlje ruke', '👐|otvorene ruke', '🤲|dlanovi', '🤝|rukovanje', '🙏|molitva hvala',
			'✍️|pisanje', '💅|nokti', '🤳|selfi', '💪|misic snaga', '🦵|noga', '🦶|stopalo', '👂|uvo', '👃|nos', '🧠|mozak', '🫀|srce organ',
			'👀|oci', '👁️|oko', '👅|jezik', '👄|usta usne', '👶|beba', '🧒|dete', '👦|decak', '👧|devojcica', '🧑|osoba', '👱|plavokos',
			'👨|muskarac', '🧔|brada', '👩|zena', '🧓|stariji', '👴|deda', '👵|baka', '🙍|mrstenje', '🙎|durenje', '🙅|ne', '🙆|ok ruke',
			'💁|informacije', '🙋|dizanje ruke', '🧏|gluv', '🙇|naklon', '🤦|facepalm', '🤷|sleganje ramenima', '👨‍⚕️|doktor', '👩‍⚕️|doktorka',
			'👨‍🍳|kuvar', '👩‍🍳|kuvarica', '👨‍🌾|farmer', '👩‍🌾|farmerka', '👨‍🏫|ucitelj', '👩‍🏫|uciteljica', '👮|policajac', '👷|gradjevinac',
			'💂|garda', '🕵️|detektiv', '🧑‍💻|programer', '👰|mlada', '🤵|mladozenja', '🤰|trudnica', '🤱|dojenje', '👼|andjeo', '🎅|deda mraz',
			'🦸|superheroj', '🧙|carobnjak', '🧚|vila', '🧛|vampir', '🧜|sirena', '🧟|zombi', '💃|ples zena', '🕺|ples muskarac', '🧘|joga',
			'👫|par', '👭|drugarice', '👬|drugari', '💏|poljubac par', '💑|par srce', '👪|porodica', '👨‍👩‍👧|porodica', '👨‍👩‍👧‍👦|porodica'
		]],
		['Životinje i priroda', '🐶', [
			'🐶|pas', '🐱|macka', '🐭|mis', '🐹|hrcak', '🐰|zec', '🦊|lisica', '🐻|medved', '🐼|panda', '🐨|koala', '🐯|tigar', '🦁|lav',
			'🐮|krava', '🐷|svinja', '🐽|njuska', '🐸|zaba', '🐵|majmun', '🐔|kokoska', '🐧|pingvin', '🐦|ptica', '🐤|pile', '🦆|patka',
			'🦅|orao', '🦉|sova', '🦇|slepi mis', '🐺|vuk', '🐗|divlja svinja', '🐴|konj', '🦄|jednorog', '🐝|pcela', '🐛|gusenica',
			'🦋|leptir', '🐌|puz', '🐞|bubamara', '🐜|mrav', '🦟|komarac', '🐢|kornjaca', '🐍|zmija', '🦎|guster', '🐙|hobotnica', '🦑|lignja',
			'🦐|skamp', '🦀|rak', '🐡|riba', '🐠|riba', '🐟|riba', '🐬|delfin', '🐳|kit', '🦈|ajkula', '🐊|krokodil', '🐘|slon', '🦒|zirafa',
			'🐪|kamila', '🦙|lama', '🐐|koza', '🐑|ovca', '🐏|ovan', '🐓|petao', '🦃|curka', '🦚|paun', '🦜|papagaj', '🐇|zec', '🦔|jez',
			'🐾|sape', '🌵|kaktus', '🎄|jelka', '🌲|cetinar', '🌳|drvo', '🌴|palma', '🌱|klica', '🌿|biljka list', '☘️|detelina', '🍀|detelina sreca',
			'🍁|javor jesen', '🍂|lisce jesen', '🍃|list vetar', '🌾|zito psenica', '💐|buket', '🌷|lala', '🌹|ruza', '🥀|uvela ruza', '🌺|hibiskus',
			'🌸|tresnja cvet', '🌼|cvet', '🌻|suncokret', '🌞|sunce lice', '🌝|mesec lice', '🌙|mesec', '⭐|zvezda', '🌟|zvezda sjaj', '✨|iskre',
			'⚡|munja', '🔥|vatra', '🌈|duga', '☀️|sunce', '⛅|oblak sunce', '☁️|oblak', '🌧️|kisa', '⛈️|oluja', '❄️|pahulja sneg', '☃️|sneško',
			'🌊|talas more', '💧|kap', '🌍|zemlja planeta', '🌎|zemlja', '🌏|zemlja'
		]],
		['Hrana i piće', '🍔', [
			'🍏|zelena jabuka', '🍎|jabuka', '🍐|kruska', '🍊|pomorandza', '🍋|limun', '🍌|banana', '🍉|lubenica', '🍇|grozdje', '🍓|jagoda',
			'🫐|borovnica', '🍈|dinja', '🍒|tresnja visnja', '🍑|breskva', '🥭|mango', '🍍|ananas', '🥥|kokos', '🥝|kivi', '🍅|paradajz',
			'🍆|patlidzan', '🥑|avokado', '🥦|brokoli', '🥬|zelena salata kupus', '🥒|krastavac', '🌶️|paprika ljuta', '🫑|paprika', '🌽|kukuruz',
			'🥕|sargarepa', '🫒|maslina', '🧄|beli luk', '🧅|crni luk', '🥔|krompir', '🍠|batat', '🥐|kroasan', '🥯|djevrek', '🍞|hleb',
			'🥖|baget', '🥨|perec', '🧀|sir', '🥚|jaje', '🍳|jaje na oko tiganj', '🧈|puter', '🥞|palacinke', '🧇|vafle', '🥓|slanina',
			'🥩|meso snicla', '🍗|batak', '🍖|meso kost', '🌭|hot dog viršla', '🍔|hamburger', '🍟|pomfrit', '🍕|pica', '🫓|lepinja', '🥪|sendvic',
			'🥙|pita giros', '🧆|falafel', '🌮|tako', '🌯|burito', '🥗|salata', '🥘|paela tiganj', '🫕|fondi', '🍝|spagete pasta', '🍜|supa nudle',
			'🍲|corba lonac', '🍛|kari pirinac', '🍣|susi', '🍱|bento', '🥟|knedla', '🦪|ostriga', '🍤|skampi przeni', '🍙|pirinac', '🍚|pirinac',
			'🍘|pirinac krekeri', '🍥|riba kolac', '🥮|mesecev kolac', '🍢|raznjic', '🧁|kapkejk', '🍰|kolac torta parce', '🎂|torta rodjendan',
			'🍮|puding', '🍭|lilihip', '🍬|bombona', '🍫|cokolada', '🍿|kokice', '🍩|krofna', '🍪|keks', '🌰|kesten', '🥜|kikiriki',
			'🍯|med', '🥛|mleko', '🍼|flasica', '☕|kafa', '🫖|cajnik', '🍵|caj', '🧃|sok kutija', '🥤|sok casa', '🧋|bubble tea', '🍶|sake',
			'🍺|pivo', '🍻|pivo zivjeli', '🥂|sampanjac zivjeli', '🍷|vino', '🥃|viski rakija', '🍸|koktel', '🍹|koktel tropski', '🧉|mate',
			'🍾|sampanjac flasa', '🧊|led', '🥄|kasika', '🍴|viljuska noz', '🍽️|tanjir pribor', '🥣|cinija', '🥢|stapici', '🧂|so', '🫙|tegla'
		]],
		['Aktivnosti', '⚽', [
			'⚽|fudbal lopta', '🏀|kosarka', '🏈|americki fudbal', '⚾|bejzbol', '🎾|tenis', '🏐|odbojka', '🏉|ragbi', '🎱|bilijar', '🏓|stoni tenis',
			'🏸|badminton', '🥅|gol', '⛳|golf', '🏹|streljastvo luk', '🎣|pecanje', '🥊|boks', '🥋|karate', '⛸️|klizanje', '🎿|skijanje',
			'🛷|sanke', '🏋️|tegovi', '🤸|gimnastika', '🤼|rvanje', '🚴|biciklizam', '🏊|plivanje', '🏄|surf', '🚣|veslanje', '🧗|penjanje',
			'🏆|pehar pobeda', '🥇|zlato medalja', '🥈|srebro', '🥉|bronza', '🏅|medalja', '🎖️|orden', '🎪|cirkus', '🎭|pozoriste maske',
			'🎨|slikanje paleta', '🎬|film klapa', '🎤|mikrofon pevanje', '🎧|slusalice', '🎼|note', '🎵|nota muzika', '🎶|note muzika',
			'🎹|klavir', '🥁|bubnjevi', '🎷|saksofon', '🎺|truba', '🎸|gitara', '🪗|harmonika', '🎻|violina', '🎲|kocka igra', '♟️|sah',
			'🎯|pikado meta', '🎳|kuglanje', '🎮|video igra', '🕹️|dzojstik', '🧩|slagalica', '🎰|slot'
		]],
		['Putovanja i mesta', '🚗', [
			'🚗|auto', '🚕|taksi', '🚙|dzip', '🚌|autobus', '🚎|trolejbus', '🏎️|trkacki auto', '🚓|policija auto', '🚑|hitna pomoc', '🚒|vatrogasci',
			'🚐|kombi', '🚚|kamion', '🚜|traktor', '🛵|skuter', '🏍️|motor', '🚲|bicikl', '🛴|trotinet', '🚏|stanica', '🛣️|autoput',
			'⛽|benzin pumpa', '🚨|rotacija', '🚥|semafor', '🚧|radovi', '⚓|sidro', '⛵|jedrilica', '🚤|gliser', '🛳️|brod', '⛴️|trajekt',
			'✈️|avion', '🛫|poletanje', '🛬|sletanje', '🪂|padobran', '💺|sediste', '🚁|helikopter', '🚀|raketa', '🛸|nlo', '🚂|voz lokomotiva',
			'🚆|voz', '🚇|metro', '🚉|zeleznicka stanica', '🗺️|mapa', '🗿|moai', '🗽|kip slobode', '🗼|toranj', '🏰|zamak', '🏯|zamak japan',
			'🏟️|stadion', '🎡|panoramski tocak', '🎢|rolerkoster', '🎠|ringispil', '⛲|fontana', '⛱️|suncobran plaza', '🏖️|plaza', '🏝️|ostrvo',
			'🏜️|pustinja', '🌋|vulkan', '⛰️|planina', '🏔️|planina sneg', '🗻|fudzi', '🏕️|kamp', '⛺|sator', '🏠|kuca', '🏡|kuca dvoriste',
			'🏘️|naselje', '🏚️|napustena kuca', '🏗️|gradiliste', '🏭|fabrika', '🏢|zgrada', '🏬|robna kuca', '🏣|posta', '🏥|bolnica', '🏦|banka',
			'🏨|hotel', '🏪|prodavnica', '🏫|skola', '💒|venčanje crkva', '🏛️|muzej', '⛪|crkva', '🕌|dzamija', '🕍|sinagoga', '🛕|hram',
			'🌅|izlazak sunca', '🌄|zora planine', '🌆|grad sumrak', '🌇|zalazak grad', '🌃|noc grad', '🌉|most noc', '🌌|mlecni put',
			'🇷🇸|srbija zastava', '🇲🇪|crna gora', '🇧🇦|bosna', '🇭🇷|hrvatska', '🇲🇰|makedonija', '🇸🇮|slovenija', '🇪🇺|eu', '🏁|cilj zastava'
		]],
		['Predmeti', '💡', [
			'⌚|sat rucni', '📱|telefon mobilni', '💻|laptop', '⌨️|tastatura', '🖥️|racunar monitor', '🖨️|stampac', '🖱️|mis racunar', '💽|disk',
			'💾|disketa', '💿|cd', '📀|dvd', '📷|fotoaparat', '📸|fotoaparat blic', '📹|kamera', '🎥|filmska kamera', '📽️|projektor', '📞|telefon',
			'☎️|telefon stari', '📺|televizor', '📻|radio', '🎙️|mikrofon studio', '⏰|budilnik', '⏳|pescani sat', '⌛|pescani sat', '📡|antena',
			'🔋|baterija', '🔌|utikac', '💡|sijalica ideja', '🔦|baterijska lampa', '🕯️|sveca', '🧯|aparat gasenje', '🛢️|bure', '💸|novac leti',
			'💵|dolar novac', '💶|evro', '💰|vreca novac', '💳|kartica', '🧾|racun', '💎|dijamant', '⚖️|vaga pravda', '🧰|alat kutija', '🔧|kljuc alat',
			'🔨|cekic', '⚒️|cekic pijuk', '🛠️|alat', '⛏️|pijuk', '🔩|zavrtanj', '⚙️|zupcanik', '🧱|cigla', '⛓️|lanac', '🧲|magnet', '🔫|pistolj',
			'💣|bomba', '🧨|petarda', '🪓|sekira', '🔪|noz', '🗡️|mac', '🛡️|stit', '🚬|cigareta', '⚰️|kovceg', '🏺|amfora vaza', '🔮|kristalna kugla',
			'📿|brojanica', '🧿|nazar', '💈|berberin', '⚗️|alembik', '🔭|teleskop', '🔬|mikroskop', '🕳️|rupa', '🩹|flaster', '🩺|stetoskop',
			'💊|pilula lek', '💉|injekcija', '🩸|krv kap', '🧬|dnk', '🦠|virus', '🧫|petri', '🧪|epruveta', '🌡️|termometar', '🧹|metla',
			'🧺|korpa ves', '🧻|toalet papir', '🚽|wc', '🚿|tus', '🛁|kada', '🧼|sapun', '🪥|cetkica zubi', '🧽|sundjer', '🛒|kolica kupovina',
			'🚪|vrata', '🪑|stolica', '🛋️|sofa', '🛏️|krevet', '🖼️|slika ram', '🛍️|kese kupovina', '🎁|poklon', '🎈|balon', '🎀|masna',
			'🎊|konfete', '🎉|zurka proslava', '🎎|lutke', '🏮|lampion', '🎐|zvonce vetar', '✉️|koverta pismo', '📩|mejl', '📦|paket', '📫|sanduce',
			'📝|beleska pisanje', '📖|knjiga otvorena', '📚|knjige', '📰|novine', '🗞️|novine', '📅|kalendar', '📌|pribadaca', '📎|spajalica',
			'✂️|makaze', '🔒|katanac', '🔑|kljuc', '🗝️|stari kljuc'
		]],
		['Simboli', '❤️', [
			'❤️|srce crveno ljubav', '🧡|srce narandzasto', '💛|srce zuto', '💚|srce zeleno', '💙|srce plavo', '💜|srce ljubicasto', '🖤|srce crno',
			'🤍|srce belo', '🤎|srce braon', '💔|slomljeno srce', '❣️|srce uzvicnik', '💕|dva srca', '💞|srca vrte', '💓|srce kuca', '💗|srce raste',
			'💖|srce sjaj', '💘|srce strela', '💝|srce poklon', '💟|srce ukras', '☮️|mir', '✝️|krst', '☦️|pravoslavni krst', '☪️|polumesec',
			'🕉️|om', '☸️|dharma', '✡️|davidova zvezda', '🔯|heksagram', '♈|ovan', '♉|bik', '♊|blizanci', '♋|rak', '♌|lav', '♍|devica',
			'♎|vaga', '♏|skorpija', '♐|strelac', '♑|jarac', '♒|vodolija', '♓|ribe', '⛎|zmijonosac', '🆔|id', '⚛️|atom', '🉑|prihvatljivo',
			'☢️|radioaktivno', '☣️|biohazard', '📴|iskljuceno', '📳|vibracija', '🈶|japanski', '✅|kvacica zeleno tacno', '❌|iks crveno netacno',
			'❎|iks kvadrat', '✔️|kvacica', '☑️|kvacica kvadrat', '➕|plus', '➖|minus', '➗|podeljeno', '✖️|puta', '♾️|beskonacno', '💯|sto poena',
			'‼️|dva uzvicnika', '⁉️|uzvicnik upitnik', '❓|upitnik', '❔|upitnik beli', '❗|uzvicnik', '❕|uzvicnik beli', '⚠️|upozorenje', '🚸|deca',
			'🔱|trozubac', '⚜️|ljiljan', '🔰|pocetnik', '♻️|reciklaza', '💲|dolar', '💱|menjacnica', '©️|autorsko pravo', '®️|registrovano', '™️|zastitni znak',
			'🔴|crveni krug', '🟠|narandzasti krug', '🟡|zuti krug', '🟢|zeleni krug', '🔵|plavi krug', '🟣|ljubicasti krug', '⚫|crni krug',
			'⚪|beli krug', '🟥|crveni kvadrat', '🟩|zeleni kvadrat', '🟦|plavi kvadrat', '⬛|crni kvadrat', '⬜|beli kvadrat', '🔶|narandzasti romb',
			'🔷|plavi romb', '🔸|mali romb', '🔹|mali romb plavi', '🔺|trougao gore', '🔻|trougao dole', '💠|romb cvet', '🔘|radio dugme',
			'⬆️|strelica gore', '⬇️|strelica dole', '⬅️|strelica levo', '➡️|strelica desno', '↗️|strelica gore desno', '↘️|strelica dole desno',
			'↙️|strelica dole levo', '↖️|strelica gore levo', '↕️|strelica gore dole', '↔️|strelica levo desno', '🔄|osvezi strelice', '🔃|strelice',
			'🔀|nasumicno', '🔁|ponavljanje', '▶️|plej', '⏸️|pauza', '⏹️|stop', '⏺️|snimanje', '⏭️|sledece', '⏮️|prethodno', '🔊|zvuk glasno',
			'🔇|bez zvuka', '🔔|zvono', '🔕|zvono iskljuceno', '📢|megafon', '💬|oblacic govor', '💭|oblacic misao', '🗨️|oblacic', '♨️|vruci izvor',
			'🕐|jedan sat', '🕑|dva sata', '🕒|tri sata', '🕓|cetiri sata', '🕔|pet sati', '🕕|sest sati', '🕖|sedam sati', '🕗|osam sati',
			'🕘|devet sati', '🕙|deset sati', '🕚|jedanaest sati', '🕛|dvanaest sati'
		]]
	];

	function norm(s) {
		return (s || '').toLowerCase()
			.replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj');
	}

	function getRecent() {
		try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
	}

	function pushRecent(ch) {
		var r = getRecent().filter(function (x) { return x !== ch; });
		r.unshift(ch);
		try { localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, RECENT_MAX))); } catch (e) {}
	}

	/* host = element u kome birač lebdi (position: relative), insert(ch) = upis, anchor = dugme koje ga otvara */
	function create(host, insert, anchor) {
		var pop = document.createElement('div');
		pop.className = 'rk-qt-emoji';
		pop.setAttribute('role', 'dialog');
		pop.setAttribute('aria-label', L.emoji || 'Emodži');
		pop.hidden = true;

		var tabs = document.createElement('div');
		tabs.className = 'rk-qt-emoji__tabs';
		var search = document.createElement('input');
		search.type = 'search';
		search.className = 'rk-qt-emoji__search';
		search.placeholder = L.emojiSearch || 'Pretraga (npr. srce, kafa, pica)…';
		search.setAttribute('aria-label', L.emojiSearch || 'Pretraga');
		var body = document.createElement('div');
		body.className = 'rk-qt-emoji__body';

		pop.appendChild(tabs);
		pop.appendChild(search);
		pop.appendChild(body);
		host.appendChild(pop);

		var RECENT = L.emojiRecent || 'Nedavno';
		var cats = [];
		var recent = getRecent();
		if (recent.length) {
			cats.push([RECENT, '🕘', recent.map(function (c) { return c + '|'; })]);
		}
		cats = cats.concat(DATA);

		function renderTabs() {
			tabs.innerHTML = '';
			cats.forEach(function (cat, i) {
				var b = document.createElement('button');
				b.type = 'button';
				b.className = 'rk-qt-emoji__tab';
				b.title = cat[0];
				b.textContent = cat[1];
				b.setAttribute('data-cat', String(i));
				b.addEventListener('click', function () {
					if (search.value.trim().length >= 2) { search.value = ''; renderAll(); }
					var sec = body.querySelector('[data-sec="' + i + '"]');
					if (sec) { body.scrollTop = sec.offsetTop - body.offsetTop; }
					setActive(i);
				});
				tabs.appendChild(b);
			});
		}

		function setActive(i) {
			tabs.querySelectorAll('.rk-qt-emoji__tab').forEach(function (t) {
				t.classList.toggle('is-active', t.getAttribute('data-cat') === String(i));
			});
		}

		function grid(items) {
			var g = document.createElement('div');
			g.className = 'rk-qt-emoji__grid';
			items.forEach(function (it) {
				var parts = it.split('|'), ch = parts[0];
				var b = document.createElement('button');
				b.type = 'button';
				b.className = 'rk-qt-emoji__item';
				b.textContent = ch;
				b.title = parts[1] || '';
				b.setAttribute('data-emoji', ch);
				g.appendChild(b);
			});
			return g;
		}

		function renderAll() {
			body.innerHTML = '';
			cats.forEach(function (cat, i) {
				var sec = document.createElement('div');
				sec.className = 'rk-qt-emoji__sec';
				sec.setAttribute('data-sec', String(i));
				var h = document.createElement('div');
				h.className = 'rk-qt-emoji__title';
				h.textContent = cat[0];
				sec.appendChild(h);
				sec.appendChild(grid(cat[2]));
				body.appendChild(sec);
			});
			setActive(0);
		}

		function renderSearch(q) {
			var nq = norm(q), hits = [];
			DATA.forEach(function (cat) {
				cat[2].forEach(function (it) {
					if (norm(it.split('|')[1]).indexOf(nq) !== -1) { hits.push(it); }
				});
			});
			body.innerHTML = '';
			var sec = document.createElement('div');
			sec.className = 'rk-qt-emoji__sec';
			var h = document.createElement('div');
			h.className = 'rk-qt-emoji__title';
			h.textContent = hits.length ? (L.emojiResults || 'Rezultati') + ' (' + hits.length + ')' : (L.emojiNone || 'Nema rezultata');
			sec.appendChild(h);
			sec.appendChild(grid(hits.slice(0, 120)));
			body.appendChild(sec);
		}

		search.addEventListener('input', function () {
			var q = search.value.trim();
			if (q.length >= 2) { renderSearch(q); } else { renderAll(); }
		});

		/* mousedown + preventDefault: da polje za komentar ne izgubi kursor pre upisa */
		body.addEventListener('mousedown', function (e) {
			var b = e.target.closest('.rk-qt-emoji__item');
			if (!b) { return; }
			e.preventDefault();
			var ch = b.getAttribute('data-emoji');
			insert(ch);
			pushRecent(ch);
			if (!e.shiftKey) { close(); }
		});

		body.addEventListener('scroll', function () {
			if (search.value.trim().length >= 2) { return; }
			var top = body.scrollTop + 8, cur = 0;
			body.querySelectorAll('.rk-qt-emoji__sec').forEach(function (s, i) {
				if (s.offsetTop - body.offsetTop <= top) { cur = i; }
			});
			setActive(cur);
		});

		function open() {
			var r = getRecent();
			if (r.length) {
				if (cats[0][0] === RECENT) { cats[0][2] = r.map(function (c) { return c + '|'; }); }
				else { cats.unshift([RECENT, '🕘', r.map(function (c) { return c + '|'; })]); }
			}
			renderTabs();
			renderAll();
			search.value = '';
			/* ispod trake u kojoj je dugme */
			var bar = anchor.parentNode;
			pop.style.top = (bar.offsetTop + bar.offsetHeight + 4) + 'px';
			pop.hidden = false;
			requestAnimationFrame(function () { pop.classList.add('is-open'); search.focus(); });
			document.addEventListener('mousedown', outside, true);
			document.addEventListener('keydown', esc, true);
		}

		function close() {
			pop.classList.remove('is-open');
			setTimeout(function () { pop.hidden = true; }, 150);
			document.removeEventListener('mousedown', outside, true);
			document.removeEventListener('keydown', esc, true);
		}

		function outside(e) {
			if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { close(); }
		}

		function esc(e) {
			if (e.key === 'Escape') { e.preventDefault(); close(); }
		}

		function toggle() { if (pop.hidden) { open(); } else { close(); } }

		return { open: open, close: close, toggle: toggle, el: pop };
	}

	window.rkQtEmoji = { create: create };
})();
