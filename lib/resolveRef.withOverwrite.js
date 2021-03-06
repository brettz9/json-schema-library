const gp = require("gson-pointer");
const getTargetSchema = require("./utils/getTargetSchema");
const ref = require("./utils/ref");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        return {};
    }

    if (rootSchema == null) {
        throw new Error("Missing rootschema for", schema);
    }

    if (schema.$ref == null) {
        return schema;
    }

    const target = ref.getPointer(schema.$ref);
    const targetSchema = getTargetSchema(schema.$ref, rootSchema, rootSchema);
    let reference = gp.get(targetSchema, target);
    reference = resolveRef(reference, targetSchema); // resolve ref until completely resolved

    // @todo use this for forms. in draft04 any value in schema MUST be ignored
    const result = Object.assign({}, reference, schema);
    delete result.$ref;

    return result;
};
