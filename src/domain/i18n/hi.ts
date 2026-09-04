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
};
