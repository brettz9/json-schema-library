/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
    additionalItemsError: createCustomError("AdditionalItemsError"),
    additionalPropertiesError: createCustomError("AdditionalPropertiesError"),
    anyOfError: createCustomError("AnyOfError"),
    enumError: createCustomError("EnumError"),
    formatUrlError: createCustomError("FormatUrlError"),
    formatUriError: createCustomError("FormatUriError"),
    formatDateTimeError: createCustomError("FormatDateTimeError"),
    formatEmailError: createCustomError("FormatEmailError"),
    formatHostnameError: createCustomError("FormatHostnameError"),
    formatIPV4Error: createCustomError("FormatIPV4Error"),
    formatIPV6Error: createCustomError("FormatIPV6Error"),
    formatRegExError: createCustomError("FormatRegExError"),
    invalidSchemaError: createCustomError("InvalidSchemaError"),
    invalidTypeError: createCustomError("InvalidTypeError"),
    maximumError: createCustomError("MaximumError"),
    maxItemsError: createCustomError("MaxItemsError"),
    maxLengthError: createCustomError("MaxLengthError"),
    maxPropertiesError: createCustomError("MaxPropertiesError"),
    minimumError: createCustomError("MinimumError"),
    minItemsError: createCustomError("MinItemsError"),
    minLengthError: createCustomError("MinLengthError"),
    minPropertiesError: createCustomError("MinPropertiesError"),
    missingDependencyError: createCustomError("MissingDependencyError"),
    missingOneOfPropertyError: createCustomError("MissingOneOfPropertyError"),
    multipleOfError: createCustomError("MultipleOfError"),
    multipleOneOfError: createCustomError("MultipleOneOfError"),
    noAdditionalPropertiesError: createCustomError("NoAdditionalPropertiesError"),
    notError: createCustomError("NotError"),
    oneOfError: createCustomError("OneOfError"),
    oneOfPropertyError: createCustomError("OneOfPropertyError"),
    patternError: createCustomError("PatternError"),
    patternPropertiesError: createCustomError("PatternPropertiesError"),
    requiredPropertyError: createCustomError("RequiredPropertyError"),
    typeError: createCustomError("TypeError"),
    undefinedValueError: createCustomError("UndefinedValueError"),
    uniqueItemsError: createCustomError("UniqueItemsError"),
    unknownPropertyError: createCustomError("UnknownPropertyError"),
    valueNotEmptyError: createCustomError("ValueNotEmptyError")
};


module.exports = errors;
