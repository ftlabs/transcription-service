const validLanguageCodes = ['af-za', 'id-id', 'ms-my', 'ca-es', 'cs-cz', 'da-dk', 'de-de', 'en-au', 'en-ca', 'en-gb', 'en-in', 'en-ie', 'en-nz', 'en-ph', 'en-za', 'en-us', 'es-ar', 'es-bo', 'es-cl', 'es-co', 'es-cr', 'es-ec', 'es-sv', 'es-es', 'es-us', 'es-gt', 'es-hn', 'es-mx', 'es-ni', 'es-pa', 'es-py', 'es-pe', 'es-pr', 'es-do', 'es-uy', 'es-ve', 'eu-es', 'fil-ph', 'fr-fr', 'gl-es', 'hr-hr', 'zu-za', 'is-is', 'it-it', 'lt-lt', 'hu-hu', 'nl-nl', 'nb-no', 'pl-pl', 'pt-br', 'pt-pt', 'ro-ro', 'sk-sk', 'sl-si', 'fi-fi', 'sv-se', 'vi-vn', 'tr-tr', 'el-gr', 'bg-bg', 'ru-ru', 'sr-rs', 'uk-ua', 'he-il', 'ar-il', 'ar-jo', 'ar-ae', 'ar-bh', 'ar-dz', 'ar-sa', 'ar-iq', 'ar-kw', 'ar-ma', 'ar-tn', 'ar-om', 'ar-ps', 'ar-qa', 'ar-lb', 'ar-eg', 'fa-ir', 'hi-in', 'th-th', 'ko-kr', 'cmn-hant-tw', 'yue-hant-hk', 'ja-jp', 'cmn-hans-hk', 'cmn-hans-cn']

function isLanguageValid(l){
	return validLanguageCodes.indexOf(l.toLowerCase()) > -1;
}

module.exports = {
	check : isLanguageValid,
	list : validLanguageCodes
};