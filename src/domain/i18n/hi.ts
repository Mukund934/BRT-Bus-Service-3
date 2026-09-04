/**
 * The interface in Hindi.
 *
 * Loaded on demand rather than bundled: see `strings.ts`. Nothing here is a
 * published transit name - stop names, route names and headlines stay in the
 * form the operator publishes them in, in both languages, because their
 * official Devanagari forms are the operator's to supply and a transliteration
 * reads as wrong to somebody who lives on the corridor.
 *
 * Typed as a `Catalogue`, so a key added in English and forgotten here is a
 * compile error rather than a screen that silently falls back.
 *
 * THIS HAS NOT BEEN REVIEWED BY A NATIVE SPEAKER. It uses the plain civic
 * register Indian transit signage uses, and it should be read by somebody
 * from Raipur before it is put in front of passengers. That is recorded as a
 * founder action rather than assumed away.
 */

import type { Catalogue } from "./en";

export const hi: Catalogue = {
  "nav.home": "होम",
  "nav.plan": "यात्रा योजना",
  "nav.routes": "मार्ग",
  "nav.nearby": "आसपास",
  "nav.nearbyPlaces": "आसपास की जगहें",
  "nav.map": "लाइव मैप",
  "nav.timetable": "समय सारणी",
  "nav.fares": "किराया",
  "nav.contact": "संपर्क",
  "nav.help": "सहायता",
  "nav.search": "खोज",
  "nav.about": "परिचय",
  "nav.dashboard": "डैशबोर्ड",
  /*
    One word, not two. "लॉग इन" wraps inside the fixed-width login button and
    spills out of the header - a break that only appears once it is rendered,
    which is why the header was measured in a browser rather than trusted to
    jsdom. "लॉगिन" is the ordinary spelling anyway.
  */
  "nav.login": "लॉगिन",
  "nav.logout": "लॉगआउट",
  "nav.menu": "मेन्यू",
  "nav.openMenu": "मेन्यू खोलें",
  "nav.closeMenu": "मेन्यू बंद करें",
  "nav.primary": "मुख्य",

  "footer.location": "स्थान",
  "footer.explore": "और देखें",
  "footer.rights": "© BRT Bus Services. सर्वाधिकार सुरक्षित।",

  "language.label": "भाषा",
  "language.change": "भाषा बदलें",

  "state.loading": "लोड हो रहा है…",
  "state.retry": "फिर कोशिश करें",
  "state.none": "अभी दिखाने के लिए कुछ नहीं है।",
  "state.offline": "आप ऑफ़लाइन लग रहे हैं।",

  "action.search": "खोजें",
  "action.cancel": "रद्द करें",
  "action.close": "बंद करें",
  "action.back": "वापस",

  "skip.toContent": "मुख्य सामग्री पर जाएँ",

  "home.headline.1": "बेहतरीन BRT सेवा का अनुभव करें",
  "home.headline.2": "अपनी यात्रा आसानी से बनाएँ",
  "home.headline.3": "मार्ग और किराए की जानकारी पाएँ",
  "home.headline.4": "बस ट्रैकर में आपका स्वागत है",
  "home.strapline": "आपकी यात्रा, हमारी प्राथमिकता — तेज़, सुरक्षित और भरोसेमंद",
  "home.search.label": "स्टॉप, मार्ग और जगहें खोजें",
  "home.search.placeholder": "स्टॉप, मार्ग या जगह खोजें",

  "home.why": "हमारे साथ क्यों चलें",
  "home.feature.timetable.title": "प्रकाशित समय सारणी",
  "home.feature.timetable.body":
    "प्रस्थान संचालक की प्रकाशित समय सारणी से आते हैं, और आज की सेवा के लिए दिखाए जाते हैं।",
  "home.feature.live.title": "साझा होने पर लाइव",
  "home.feature.live.body":
    "बस मानचित्र पर तभी दिखती है जब उसका चालक अपनी स्थिति साझा कर रहा हो। कोई अनुमान नहीं लगाया जाता।",
  "home.feature.fares.title": "आधिकारिक किराया",
  "home.feature.fares.body":
    "किराया आधिकारिक BRTS किराया सूची से आता है, मानचित्र पर मापी गई दूरी से कभी नहीं।",
  "home.feature.plan.title": "योजना एक ही जगह",
  "home.feature.plan.body":
    "दो स्टॉप चुनिए और प्रस्थान, किराया तथा यात्रा का समय एक साथ देखिए।",

  "home.places.title": "देखने लायक जगहें",
  "home.places.body":
    "नवा रायपुर के परिसर, अस्पताल, सरकारी कार्यालय और दर्शनीय स्थल — हर एक के पास का BRT स्टॉप साथ में।",
  "home.places.cta": "आसपास की जगहें देखें",

  "home.next.title": "आज अभी बाकी",
  "home.next.finished": "आज की सेवा समाप्त हो चुकी है।",
  "home.next.checkTimetable": "समय सारणी देखें",
  "home.next.forWhenItStarts": "कि यह दोबारा कब शुरू होगी।",

  "fares.title": "आधिकारिक किराया जानकारी",
  "fares.intro":
    "आधिकारिक BRTS किराया संरचना के साथ निश्चिंत होकर यात्रा कीजिए। किन्हीं दो स्टॉप के बीच का किराया देखिए, या पूरी सूची पढ़िए।",
  "fares.sameStop": "दो अलग-अलग स्टॉप चुनिए।",
  "fares.findDepartures": "प्रस्थान देखें और बुक करें",
  "fares.noFare":
    "आधिकारिक सूची में इस यात्रा के लिए कोई किराया प्रकाशित नहीं है, इसलिए इसे अभी बुक नहीं किया जा सकता।",
  "fares.popular": "लोकप्रिय यात्राएँ",
  "fares.chart": "आधिकारिक किराया सूची",
  "fares.openFullScreen": "पूरी स्क्रीन पर खोलें",
  "fares.cannotDisplay": "आपका ब्राउज़र किराया सूची यहीं नहीं दिखा सकता।",
  "fares.openNewTab": "इसे नए टैब में खोलें",
  "fares.notes": "किराए की जानकारी",
  "fares.note.1":
    "किराया Nava Raipur Atal Nagar के लिए आधिकारिक Tatpar BRTS किराया सूची के अनुसार है।",
  "fares.note.2":
    "किराया इस पर निर्भर करता है कि आप किस स्टॉप से चढ़े और किस स्टॉप पर उतरे, बस में तय की गई दूरी पर नहीं।",
  "fares.note.3": "किन्हीं दो स्टॉप के बीच दोनों दिशाओं में एक ही किराया लगता है।",
  "fares.note.4":
    "जिस जोड़ी के लिए आधिकारिक सूची में किराया प्रकाशित नहीं है, वह यात्रा बुक नहीं की जा सकती।",

  "timetable.title": "बस समय सारणी",
  "timetable.nextFrom": "{stop} से अगली बस",
  "timetable.scheduled": "निर्धारित · मार्ग {route}",
  "timetable.then": "फिर",
  "timetable.finished": "आज की सेवा समाप्त हो चुकी है",
  "timetable.resumes": "{weekday} को फिर शुरू —",
  "timetable.onThe": "({service})।",
  "timetable.showing":
    "{shown} दिखाई जा रही है। बुकिंग आज की {today} पर ही रहेगी।",

  "service.weekday": "सप्ताह के दिनों की सेवा",
  "service.weekend": "सप्ताहांत की सेवा",
  "service.weekday.short": "सप्ताह के दिन",
  "service.weekend.short": "सप्ताहांत",
  "timetable.today": " (आज)",
  "timetable.towards": "{terminus} की ओर",
  "timetable.fromStop": "{stop} से · ",
  "timetable.alsoToday": " · आज",
  "timetable.now": "अभी {time}",
  "timetable.noneForDirection":
    "इस दिशा के लिए {service} पर कोई सेवा प्रकाशित नहीं है।",

  "plan.title": "अपनी यात्रा की योजना बनाइए",
  "plan.intro":
    "चुनिए कि आप कहाँ से चढ़ेंगे और कहाँ जाना है। किराया आधिकारिक BRTS किराया सूची से आता है।",
  "plan.browseNearby": "तय नहीं कि कहाँ जाएँ? आसपास की जगहें देखिए",
  "plan.from": "कहाँ से",
  "plan.to": "कहाँ तक",
  "plan.date": "यात्रा की तारीख",
  "plan.leavingAfter": "इसके बाद निकलना है",
  "plan.search": "यात्राएँ खोजें",
  "plan.swap": "अदला-बदली",
  "plan.sameStop": "दो अलग-अलग स्टॉप चुनिए।",
  "plan.unresolved":
    "दोनों स्टॉप सुझावों में से चुनिए, तभी किराया बताया जा सकता है।",
  "plan.notPublished": "प्रकाशित नहीं",
  "plan.noFare":
    "आधिकारिक किराया सूची में इस यात्रा का किराया नहीं है, इसलिए इसे अभी बुक नहीं किया जा सकता।",
  "plan.noService": "इस यात्रा के लिए कोई निर्धारित सेवा नहीं है",
  "plan.unservedStop":
    "{stop} प्रकाशित नेटवर्क में है, पर वहाँ से अभी कोई प्रस्थान नहीं है। समय सारणी किन स्टॉप को कवर करती है, यह देखने के लिए मार्ग देखिए।",
  "stopField.placeholder": "स्टॉप खोजने के लिए लिखिए",



  "booking.title": "अपना टिकट बुक कीजिए",
  "booking.description":
    "मार्ग {route}, प्रस्थान {time}। चुनिए कि आप कहाँ से चढ़ेंगे और कहाँ तक जाएँगे।",
  "booking.fromStop": "किस स्टॉप से",
  "booking.toStop": "किस स्टॉप तक",
  "booking.selectDestination": "गंतव्य चुनिए",
  "journey.from": "कहाँ से",
  "journey.to": "कहाँ तक",
  "journey.departure": "प्रस्थान",
  "journey.arrival": "आगमन",
  "booking.fare": "किराया",
  "booking.departed": "यह बस जा चुकी है। कृपया बाद की कोई सेवा चुनिए।",
  "booking.unpriced":
    "इस यात्रा के लिए अभी कोई किराया प्रकाशित नहीं है, इसलिए इसे बुक नहीं किया जा सकता। कृपया कोई दूसरा गंतव्य चुनिए।",
  "booking.conflict":
    "आपके पास पहले से {from} से {to} तक का टिकट है, जो इस यात्रा से टकराता है।",
  "booking.proceed": "भुगतान के लिए आगे बढ़ें",


  "booking.failure.notAuthenticated": "टिकट बुक करने के लिए साइन इन कीजिए।",
  "booking.failure.alreadyDeparted":
    "यह सेवा जा चुकी है। कृपया बाद की कोई बस चुनिए।",
  "booking.failure.overlapping":
    "आपके पास पहले से एक ऐसी यात्रा का टिकट है जो इससे टकराती है।",
  "booking.failure.invalidJourney":
    "यह यात्रा मान्य नहीं है। कृपया अपने स्टॉप दोबारा चुनिए।",
  "booking.failure.storageFailed":
    "आपका टिकट सहेजा नहीं जा सका। आपके डिवाइस की मेमोरी भरी हो सकती है।",

  "payment.failure.declined":
    "भुगतान अस्वीकार कर दिया गया। आपके खाते से कोई राशि नहीं गई है।",
  "payment.failure.unavailable":
    "अभी भुगतान उपलब्ध नहीं है। कृपया थोड़ी देर बाद कोशिश कीजिए।",

  "payment.title": "भुगतान",
  "payment.description":
    "अपनी यात्रा देख लीजिए, फिर पुष्टि कीजिए और वर्चुअल टिकट पाइए।",
  "payment.srTo": "से",
  "payment.srUntil": "तक",

  /* Must stay as plain as the English. Softening it would mislead. */
  "payment.noMoney.title": "कोई भुगतान नहीं लिया जाएगा",
  "payment.noMoney.body":
    "यह सेवा किसी भुगतान प्रदाता से जुड़ी नहीं है। पुष्टि करने पर केवल एक प्रदर्शन टिकट बनता है और कोई राशि नहीं जाती। किराया हमेशा की तरह बस में कंडक्टर को दीजिए।",

  "payment.pay": "₹{fare} का भुगतान करें",
  "payment.payDemo": "₹{fare} का प्रदर्शन टिकट बनाएँ",

  "payment.processing.title": "भुगतान हो रहा है",
  "payment.processing.description":
    "इसमें बस एक पल लगेगा। कृपया यह विंडो बंद न कीजिए।",
  "payment.processing.status": "भुगतान हो रहा है…",

  "payment.success.title": "भुगतान सफल",
  "payment.success.description": "{from} से {to} तक का आपका टिकट पक्का हो गया है।",
  "payment.success.demo": "प्रदर्शन टिकट। कोई भुगतान नहीं लिया गया।",
  "payment.success.notSaved":
    "आपका टिकट इस डिवाइस पर सहेजा नहीं जा सका, इसलिए बाद में यह यहाँ न मिले।",
  "payment.viewTicket": "मेरा टिकट देखें",

  "payment.failed.title": "भुगतान असफल",
  "payment.failed.generic": "भुगतान करते समय कुछ गड़बड़ हो गई।",
  "payment.error.signedOut": "यह भुगतान पूरा करने के लिए साइन इन करना ज़रूरी है।",
  "payment.error.unknown":
    "आपका भुगतान पूरा नहीं हो सका। कृपया फिर कोशिश कीजिए।",

  "payment.announce.signedOut": "भुगतान असफल। साइन इन करना ज़रूरी है।",
  "payment.announce.bookingFailed": "बुकिंग असफल। {reason}",
  "payment.announce.processing": "आपका भुगतान हो रहा है, कृपया प्रतीक्षा कीजिए।",
  "payment.announce.paymentFailed": "भुगतान असफल। {reason}",
  "payment.announce.success":
    "भुगतान सफल। {from} से {to} तक का आपका टिकट पक्का हो गया है।",
  "payment.announce.retry": "भुगतान असफल। कृपया फिर कोशिश कीजिए।",



  "ticket.expired": "समाप्त",
  "ticket.heading": "मार्ग {route} · {from} से {to}",
  "ticket.statusPrefix": "टिकट की स्थिति: ",
  "ticket.farePaid": "चुकाया किराया",
  "ticket.validFor": "इतनी देर मान्य",
  "ticket.qrLabel": "बुकिंग {id} के लिए बोर्डिंग QR कोड",
  "ticket.qrLabelExpired": "बुकिंग {id} के लिए समाप्त हो चुका बोर्डिंग QR कोड",
  "ticket.copied": "बुकिंग संदर्भ कॉपी हो गया",
  "ticket.copy": "बुकिंग संदर्भ {id} कॉपी करें",
  "ticket.saveQr": "QR सहेजें",
  "ticket.cancel": "टिकट रद्द करें",
  "ticket.cancelFor": " {from} से {to} के लिए",

  /* Hindi does not inflect "मिनट" for number, so both read the same. */
  "ticket.announce.validForOne": "आपका टिकट लगभग {minutes} मिनट और मान्य है।",
  "ticket.announce.validForMany": "आपका टिकट लगभग {minutes} मिनट और मान्य है।",
  "ticket.announce.copied": "बुकिंग संदर्भ क्लिपबोर्ड पर कॉपी हो गया।",
  "ticket.announce.copyFailed": "बुकिंग संदर्भ कॉपी नहीं हो सका।",
  "ticket.announce.qrFailed": "QR कोड डाउनलोड के लिए तैयार नहीं हो सका।",
  "ticket.announce.qrDownloaded": "QR कोड डाउनलोड हो गया।",


  "dashboard.avatarAlt": "उपयोगकर्ता",
  "dashboard.passenger": "यात्री",
  "dashboard.tripsCompleted": "पूरी हुई यात्राएँ",
  "dashboard.totalSpent": "कुल ख़र्च",
  "dashboard.favouriteRoute": "पसंदीदा मार्ग",

  "dashboard.yourTicket": "आपका टिकट",
  "dashboard.noActiveTickets": "कोई चालू टिकट नहीं",
  "dashboard.bookPrompt":
    "समय सारणी से सीट बुक कीजिए, आपका टिकट यहाँ दिखने लगेगा।",
  "dashboard.bookCta": "टिकट बुक करें",

  "dashboard.alerts.title": "आगमन सूचनाएँ",
  "dashboard.alerts.body":
    "आपकी बस जब आपके चढ़ने वाले स्टॉप के पास पहुँचती है, तब बताती हैं।",
  "dashboard.alerts.on": "चालू",
  "dashboard.alerts.off": "बंद",
  "dashboard.alerts.suffix": " — आगमन सूचनाएँ",
  "dashboard.alerts.switchedOn": "आगमन सूचनाएँ चालू कर दी गईं।",
  "dashboard.alerts.switchedOff": "आगमन सूचनाएँ बंद कर दी गईं।",
  "dashboard.alerts.failed": "आपकी सूचना सेटिंग नहीं बदली जा सकी।",

  "dashboard.history.title": "टिकट इतिहास",
  "dashboard.history.filterLabel": "टिकट इतिहास छाँटें",
  "dashboard.filter.all": "सभी",
  "dashboard.history.emptyAll": "अभी तक कोई पिछली यात्रा नहीं",
  "dashboard.history.emptyCompleted": "कोई पूरी हुई यात्रा का टिकट नहीं",
  "dashboard.history.emptyCancelled": "कोई रद्द किया गया टिकट नहीं",

  "dashboard.cancel.failed":
    "यह टिकट रद्द नहीं हो सका। हो सकता है बस जा चुकी हो।",
  "dashboard.cancel.done": "टिकट रद्द हो गया।",
  "dashboard.cancel.announced": "आपका टिकट रद्द कर दिया गया है।",


  "fleet.sharing.idle": "साझा नहीं हो रहा",
  "fleet.sharing.sharing": "आपकी लाइव स्थिति साझा हो रही है",
  "fleet.sharing.interrupted": "आपकी स्थिति यात्रियों तक नहीं पहुँच रही",
  /* Names only the cause that can be observed; stays general otherwise. */
  "fleet.interruption.background":
    "यह टैब पीछे चला गया था, और ब्राउज़र पीछे चल रहे टैब को स्थिति पढ़ने नहीं देते। शिफ़्ट के दौरान यह स्क्रीन खुली और जागती रखिए।",
  "fleet.interruption.signal":
    "पिछला अपडेट हम तक नहीं पहुँचा। अपना सिग्नल जाँचिए।",

  "driver.title": "चालक लाइव ट्रैकिंग",
  "driver.broadcastingAs": "इस रूप में प्रसारित",
  "driver.checking": "आपकी ड्यूटी देखी जा रही है…",
  "driver.noAssignment.lead": "अभी आपको कोई बस नहीं सौंपी गई है।",
  "driver.noAssignment.body":
    "स्थिति साझा करने के लिए संचालक की ओर से ड्यूटी मिलनी ज़रूरी है, और हर ड्यूटी एक शिफ़्ट के लिए होती है। उनसे बस सौंपने को कहिए।",
  "driver.routeLabel": "आप कौन सा मार्ग चला रहे हैं",
  "driver.stopToChange": "मार्ग बदलने के लिए साझा करना रोकिए।",
  "driver.sharingOn": " — {route}",
  "driver.interrupted.title": "आपकी स्थिति यात्रियों तक नहीं पहुँच रही।",
  "driver.latitude": "अक्षांश",
  "driver.longitude": "देशांतर",
  "driver.start": "साझा करना शुरू करें",
  "driver.stop": "साझा करना रोकें",
  "driver.privacy":
    "केवल आपके निर्देशांक और यह बस लेबल साझा होते हैं। आपका नाम और ईमेल पता कभी प्रकाशित नहीं होता।",
  "driver.error.permission":
    "अपनी स्थिति प्रसारित करने के लिए लोकेशन की अनुमति ज़रूरी है।",
  "driver.error.readFailed":
    "आपकी स्थिति पढ़ी नहीं जा सकी। कृपया फिर कोशिश कीजिए।",
  "driver.error.unavailable": "लाइव ट्रैकिंग अभी उपलब्ध नहीं है।",
  "driver.announce.interrupted":
    "आपकी स्थिति यात्रियों तक नहीं पहुँच रही। {reason}",

  "driver.dashboard.role": "चालक",
  "driver.dashboard.title": "लाइव स्थिति साझा करें",
  "driver.dashboard.body":
    "प्रसारण लाइव ट्रैकिंग पेज पर चलता है और आपके वहाँ से हटते ही रुक जाता है, इसलिए शिफ़्ट के दौरान वह पेज खुला रखिए।",
  "driver.dashboard.cta": "लाइव ट्रैकिंग खोलें",

  "ticket.status.pending": "बाकी",
  "ticket.status.active": "चालू",
  "ticket.status.boardingSoon": "चढ़ने का समय",
  "ticket.status.inTransit": "यात्रा में",
  "ticket.status.completed": "पूरी हुई",
  "ticket.status.cancelled": "रद्द",

  "login.signIn.title": "साइन इन करें",
  "login.signUp.title": "खाता बनाएँ",
  "login.reset.title": "पासवर्ड रीसेट करें",

  "login.email": "ईमेल",
  "login.password": "पासवर्ड",
  "login.name": "पूरा नाम",
  "field.required": " (ज़रूरी)",

  "login.signIn.action": "साइन इन",
  "login.signIn.pending": "साइन इन हो रहा है…",
  "login.signUp.action": "साइन अप",
  "login.signUp.pending": "खाता बनाया जा रहा है…",
  "login.google": "Google से जारी रखें",
  "login.forgot": "पासवर्ड भूल गए?",
  "login.backToSignIn": "साइन इन पर वापस",
  "login.passwordHint": "कम से कम 6 अक्षर।",

  "login.reset.intro":
    "अपना ईमेल भरिए, हम आपको नया पासवर्ड बनाने का लिंक भेजेंगे।",
  /* "अगर", not "जब" - the sentence must not confirm that the account exists. */
  "login.reset.sent":
    "अगर {email} के लिए कोई खाता है, तो पासवर्ड रीसेट लिंक भेजा जा रहा है। अपना इनबॉक्स और स्पैम फ़ोल्डर देखिए।",
  "login.reset.action": "रीसेट लिंक भेजें",
  "login.reset.pending": "भेजा जा रहा है…",

  "login.haveAccount": "पहले से खाता है?",
  "login.noAccount": "खाता नहीं है?",
  "login.showPassword": "पासवर्ड दिखाएँ",
  "login.hidePassword": "पासवर्ड छिपाएँ",

  "login.aside.newTitle": "नमस्ते!",
  "login.aside.newBody":
    "खाता नहीं है? अभी साइन अप कीजिए और बस टिकट बुक करके आसान यात्रा कीजिए।",
  "login.aside.returningTitle": "फिर से स्वागत है!",
  "login.aside.returningBody":
    "पहले से खाता है? टिकट बुक करना जारी रखने के लिए साइन इन कीजिए।",

  "login.announce.signInProblem": "साइन इन फ़ॉर्म में कोई समस्या है।",
  "login.announce.signUpProblem": "साइन अप फ़ॉर्म में कोई समस्या है।",
  "login.announce.resetProblem": "रीसेट फ़ॉर्म में कोई समस्या है।",
  "login.announce.signingIn": "आपको साइन इन किया जा रहा है…",
  "login.announce.creating": "आपका खाता बनाया जा रहा है…",
  "login.announce.resetSent":
    "अगर उस ईमेल पर खाता है, तो रीसेट लिंक भेजा जा रहा है।",


  "boundary.title": "कुछ गड़बड़ हो गई",
  "boundary.body":
    "यह पेज दिखाया नहीं जा सका। दोबारा लोड करने से आमतौर पर ठीक हो जाता है, ख़ासकर तब जब यह टैब खुला रहते हुए ऐप अपडेट हुआ हो।",
  "boundary.offlineTitle": "इस पेज के लिए कनेक्शन चाहिए",
  "boundary.offlineBody":
    "आप ऑफ़लाइन लग रहे हैं, और यह पेज इस डिवाइस पर पहले कभी नहीं खोला गया। जो पेज आप पहले देख चुके हैं, वे अब भी चलते हैं।",
  "boundary.reload": "पेज दोबारा लोड करें",
  "boundary.home": "होम पर वापस",

  "notification.dismiss": "सूचना हटाएँ",
  /* Must carry the same force: the app never claims an arrival time. */
  "notification.positionOnly": "केवल स्थिति — आगमन का समय नहीं",

  "error.generic": "कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।",
  "error.noPermission": "आपके पास यह काम करने की अनुमति नहीं है।",
  "error.signInRequired": "जारी रखने के लिए साइन इन कीजिए।",
  "error.network":
    "नेटवर्क उपलब्ध नहीं है। अपना कनेक्शन जाँचकर फिर कोशिश कीजिए।",
  "error.loadUsers": "उपयोगकर्ता लोड नहीं हो सके।",
  "error.updateRole": "वह भूमिका नहीं बदली जा सकी।",
  "error.loadAnnouncements": "घोषणाएँ लोड नहीं हो सकीं।",
  "error.shareLocation": "आपकी स्थिति साझा नहीं की जा सकी।",

  "validation.generic": "कृपया अपनी जानकारी जाँचिए।",
  "validation.email.required": "ईमेल भरना ज़रूरी है",
  "validation.email.tooLong": "ईमेल बहुत लंबा है",
  "validation.email.invalid": "कृपया सही ईमेल पता भरिए",
  "validation.password.tooShort": "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",
  "validation.password.tooLong": "पासवर्ड 128 अक्षरों से ज़्यादा नहीं हो सकता",
  "validation.name.required": "नाम भरना ज़रूरी है",
  "validation.name.tooLong": "नाम बहुत लंबा है",
  "validation.name.invalid": "नाम में अमान्य अक्षर हैं",

  /*
    One string for every credential failure, exactly as in English. A more
    natural Hindi rendering that distinguished "यह खाता मौजूद नहीं है" from
    "पासवर्ड ग़लत है" would be better prose and a security defect.
  */
  "auth.error.credentials": "ईमेल या पासवर्ड ग़लत है।",
  "auth.error.tooManyAttempts":
    "बहुत बार कोशिश हो चुकी है। कुछ मिनट रुककर फिर कोशिश कीजिए।",
  "auth.error.disabled": "यह खाता बंद कर दिया गया है।",
  "auth.error.emailInUse": "इस ईमेल पते से पंजीकरण नहीं हो सकता।",
  "auth.error.weakPassword": "कम से कम 6 अक्षरों का पासवर्ड चुनिए।",
  "auth.error.cancelled": "साइन इन रद्द कर दिया गया।",
  "auth.error.popupBlocked":
    "आपके ब्राउज़र ने साइन इन विंडो रोक दी। कृपया पॉपअप की अनुमति देकर फिर कोशिश कीजिए।",
  "auth.error.network":
    "नेटवर्क उपलब्ध नहीं है। अपना कनेक्शन जाँचकर फिर कोशिश कीजिए।",
  "auth.error.generic": "साइन इन नहीं हो सका। कृपया फिर कोशिश कीजिए।",
  "auth.error.resetFailed":
    "रीसेट ईमेल नहीं भेजा जा सका। कृपया फिर कोशिश कीजिए।",
};
