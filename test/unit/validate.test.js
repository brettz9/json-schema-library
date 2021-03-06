const expect = require("chai").expect;
const validate = require("../../lib/validate");
const Core = require("../../lib/cores/Draft04");


describe("validate", () => {

    let core;
    before(() => (core = new Core()));

    describe("integer", () => {

        it("should support type 'integer'", () => {
            const errors = validate(core, { type: "integer" }, 1);
            expect(errors).to.have.length(0);
        });

        it("should throw error if type 'integer' received a float", () => {
            const errors = validate(core, { type: "integer" }, 1.1);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        describe("oneOf", () => {

            it("should validate on a matching oneOf definition", () => {
                const errors = validate(core, { oneOf: [{ type: "integer" }, { type: "string" }] }, 3);
                expect(errors).to.have.length(0);
            });

            it("should return an error for multiple matching oneOf schemas", () => {
                const errors = validate(core, { oneOf: [{ type: "integer" }, { minimum: 2 }] }, 3);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MultipleOneOfError");
            });
        });

        describe("allOf", () => {

            it("should validate if all allOf-schemas are valid", () => {
                const errors = validate(core, { allOf: [{ type: "integer" }, { minimum: 2 }] }, 3);
                expect(errors).to.have.length(0);
            });

            it("should return error if not all schemas match", () => {
                const errors = validate(core, { allOf: [{ type: "integer" }, { minimum: 4 }] }, 3);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinimumError");
            });

            it("should return all errors for each non-matching schemas", () => {
                const errors = validate(core, { allOf: [{ type: "integer" }, { minimum: 4 }, { maximum: 2 }] }, 3);
                expect(errors).to.have.length(2);
                expect(errors[0].name).to.eq("MinimumError");
                expect(errors[1].name).to.eq("MaximumError");
            });
        });

        describe("anyOf", () => {

            it("should validate if one schemas in anyOf validates", () => {
                const errors = validate(core, { anyOf: [{ minimum: 4 }, { maximum: 4 }] }, 3);
                expect(errors).to.have.length(0);
            });

            it("should return error if not all schemas match", () => {
                const errors = validate(core, { anyOf: [{ minimum: 4 }, { maximum: 2 }] }, 3);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AnyOfError");
            });

            it("should validate null", () => {
                const errors = validate(core, { anyOf: [{ type: "null" }] }, null);
                expect(errors).to.have.length(0);
            });

            it("should return error if invalid null", () => {
                const errors = validate(core, { anyOf: [{ type: "null" }] }, 3);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AnyOfError");
            });

            it("should resolve references", () => {
                core.rootSchema = {
                    definitions: { integer: { type: "integer" } }
                };

                const errors = validate(core, { anyOf: [{ type: "null" }, { $ref: "#/definitions/integer" }] }, 3);
                expect(errors).to.have.length(0);
            });
        });
    });


    describe("object", () => {

        it("should still be valid for missing type", () => {
            const errors = validate(core, { maxProperties: 1, minProperties: 1 }, { a: 1 });
            expect(errors).to.have.length(0);
        });

        it("should return all errors", () => {
            const errors = validate(core,
                {
                    type: "object", additionalProperties: false,
                    properties: { a: { type: "string" }, id: { type: "string", pattern: /^first$/ } }
                },
                { id: "first", a: "correct", b: "notallowed", c: false }
            );

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
            expect(errors[1].name).to.eq("NoAdditionalPropertiesError");
        });


        describe("required", () => {

            it("shoud return errors for missing `required` properties", () => {
                const errors = validate(core,
                    {
                        type: "object", required: ["id", "a", "aa", "aaa"]
                    },
                    { id: "first", a: "correct", b: "ignored" }
                );

                expect(errors).to.have.length(2);
                expect(errors[0].name).to.eq("RequiredPropertyError");
                expect(errors[1].name).to.eq("RequiredPropertyError");
            });
        });


        describe("min/maxProperties", () => {

            it("should return MinPropertiesError for too few properties", () => {
                const errors = validate(core, { type: "object", minProperties: 2 }, { a: 1 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinPropertiesError");
            });

            it("should return MaxPropertiesError for too many properties", () => {
                const errors = validate(core, { type: "object", maxProperties: 1 }, { a: 1, b: 2 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MaxPropertiesError");
            });

            it("should be valid if property count is within range", () => {
                const errors = validate(core, { type: "object", maxProperties: 1, minProperties: 1 }, { a: 1 });
                expect(errors).to.have.length(0);
            });
        });


        describe("not", () => {

            it("should be invalid if 'not' keyword does match", () => {
                const errors = validate(core,
                    { type: "object", not: { type: "object", properties: { a: { type: "number" } } } },
                    { a: 1 }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("NotError");
            });
        });


        describe("oneOf", () => {

            it("should validate matching oneOf", () => {
                const errors = validate(core, {
                    oneOf: [
                        { type: "object", properties: { value: { type: "string" } } },
                        { type: "object", properties: { value: { type: "integer" } } }
                    ] },
                    { value: "a string" }
                );
                expect(errors).to.have.length(0);
            });

            it("should return error for non-matching oneOf", () => {
                const errors = validate(core, {
                    type: "object",
                    oneOf: [
                        { type: "object", properties: { value: { type: "string" } } },
                        { type: "object", properties: { value: { type: "integer" } } }
                    ] },
                    { value: [] }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("OneOfError");
            });
        });


        describe("additionalProperties", () => {

            it("should return AdditionalPropertiesError for an additional property", () => {
                const errors = validate(core, { type: "object", additionalProperties: false }, { a: 1 });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
            });

            it("should return all AdditionalPropertiesErrors", () => {
                const errors = validate(core, { type: "object", additionalProperties: false }, { a: 1, b: 2 });
                expect(errors).to.have.length(2);
                expect(errors[0].name).to.eq("NoAdditionalPropertiesError");
                expect(errors[1].name).to.eq("NoAdditionalPropertiesError");
            });

            it("should be valid if 'additionalProperties' is 'true'", () => {
                const errors = validate(core, { type: "object", additionalProperties: true }, { a: 1 });
                expect(errors).to.have.length(0);
            });

            it("should be valid if value matches 'additionalProperties' schema", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    additionalProperties: { type: "number" } },
                    { a: 1 }
                );
                expect(errors).to.have.length(0);
            });

            it("should only validate existing definition in 'properties'", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    additionalProperties: { type: "number" }
                }, { b: "i am valid" });
                expect(errors).to.have.length(0);
            });

            it("should return error if value does not match 'additionalProperties' schema", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    additionalProperties: { type: "string" } },
                    { a: 1 }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AdditionalPropertiesError");
            });

            it("should be valid if value matches 'additionalProperties' oneOf schema", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    additionalProperties: {
                        oneOf: [
                            { type: "number" }
                        ]
                    } },
                    { a: 1 }
                );
                expect(errors).to.have.length(0);
            });

            it("should be invalid if value does not match 'additionalProperties' in oneOf schema", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    additionalProperties: {
                        oneOf: [
                            { type: "string" }
                        ]
                    } },
                    { a: 1 }
                );
                expect(errors).to.have.length(1);
            });

            it("should be ignore properties that are matched by patternProperties", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    patternProperties: {
                        "^.$": { type: "number" }
                    },
                    additionalProperties: {
                        oneOf: [
                            { type: "string" }
                        ]
                    } },
                    { a: 1 }
                );
                expect(errors).to.have.length(0);
            });

            it("should be invalid if value does match multiple 'additionalProperties' in oneOf schema", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: { b: { type: "string" } },
                    additionalProperties: {
                        oneOf: [
                            { type: "string" },
                            { type: "string" }
                        ]
                    } },
                    { a: "a string" }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AdditionalPropertiesError");
            });
        });


        describe("patternProperties", () => {

            it("should return an error for matching pattern and failed validation", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        test: { type: "number" }
                    }
                },
                    { test: "invalid type" }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should validate a correct matching pattern", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        test: { type: "number" }
                    }
                },
                    { test: 10 }
                );
                expect(errors).to.have.length(0);
            });

            it("should return an error for matching regex pattern and failed validation", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        "^.est?": { type: "number" }
                    }
                },
                    { test: "invalid type" }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should invalidate defined property", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        test: { type: "string" }
                    },
                    patternProperties: {
                        "^.est?": { type: "number" }
                    }
                },
                    { test: "invalid type" }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should return 'PatternPropertiesError' if additional properties are not allowed", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        test: { type: "string" }
                    },
                    patternProperties: {
                        "^.est?$": { type: "number" }
                    },
                    additionalProperties: false
                },
                    { tester: "invalid property" }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("PatternPropertiesError");
            });

            it("should return an error if one of the matching patterns does not validate", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        "^.est?$": { type: "number" },
                        "^.est$": { type: "string" }
                    },
                    additionalProperties: false
                },
                    { test: 10 }
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should return no error if additional properties are not allowed but valid in patterns", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        "^.est?$": { type: "number" }
                    },
                    additionalProperties: false
                },
                    { tes: 10 }
                );
                expect(errors).to.have.length(0);
            });

            it("should return no error if additional properties validate value", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        "^.est?$": { type: "number" }
                    },
                    additionalProperties: { type: "string" }
                },
                    { anAddedProp: "valid" }
                );

                expect(errors).to.have.length(0);
            });

            it("should return an AdditionalPropertiesError if additional properties do not validate", () => {
                const errors = validate(core, {
                    type: "object",
                    patternProperties: {
                        "^.est?$": { type: "number" }
                    },
                    additionalProperties: { type: "string" }
                },
                    { anAddedProp: 100 }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AdditionalPropertiesError");
            });
        });

        describe("dependencies", () => {

            it("should ignore any dependencies if the property is no set", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        target: { type: "string" }
                    },
                    dependencies: {
                        url: ["target"]
                    }
                },
                    { title: "Check this out" }
                );

                expect(errors).to.have.length(0);
            });

            it("should return a 'MissingDependencyError' if the dependent property is missing", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        target: { type: "string" }
                    },
                    dependencies: {
                        url: ["target"]
                    }
                },
                    { title: "Check this out", url: "http://example.com" }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MissingDependencyError");
            });

            it("should return a 'MissingDependencyError' if the dependent counterpart is missing", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        target: { type: "string" }
                    },
                    dependencies: {
                        url: ["target"],
                        target: ["url"]
                    }
                },
                    { title: "Check this out", target: "_blank" }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MissingDependencyError");
            });

            it("should be valid for a matching schema dependency", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        target: { type: "string" }
                    },
                    dependencies: {
                        url: {
                            properties: {
                                target: { type: "string" }
                            }
                        }
                    }
                },
                    { title: "Check this out", url: "http://example.com", target: "_blank" }
                );

                expect(errors).to.have.length(0);
            });

            it("should return validation error for a non-matching schema dependency", () => {
                const errors = validate(core, {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        target: { type: "string" }
                    },
                    dependencies: {
                        url: {
                            required: ["target"],
                            properties: {
                                target: { type: "string" }
                            }
                        }
                    }
                },
                    { title: "Check this out", url: "http://example.com" }
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("RequiredPropertyError");
            });
        });
    });


    describe("array", () => {

        it("should return error for invalid index", () => {
            const errors = validate(core, { type: "array", items: [{ type: "string" }] }, [1]);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should be valid for matching indices", () => {
            const errors = validate(core, { type: "array", items: [{ type: "string" }, { type: "number" }] }, ["1", 2]);
            expect(errors).to.have.length(0);
        });

        it("should return all errors", () => {
            const errors = validate(core, { type: "array", items: { type: "string" }, maxItems: 1 }, ["1", 2]);

            expect(errors).to.have.length(2);
            expect(errors[0].name).to.eq("TypeError");
            expect(errors[1].name).to.eq("MaxItemsError");
        });


        describe("min/maxItems", () => {

            it("should return MinItemsError for too few items", () => {
                const errors = validate(core, { type: "array", minItems: 2 }, [1]);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinItemsError");
            });

            it("should return MaxItemsError for too many items", () => {
                const errors = validate(core, { type: "array", maxItems: 1 }, [1, 2]);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MaxItemsError");
            });

            it("should be valid if item count is within range", () => {
                const errors = validate(core, { type: "array", minItems: 2, maxItems: 2 }, [1, 2]);
                expect(errors).to.have.length(0);
            });

            it("should still be valid for missing type", () => {
                const errors = validate(core, { minItems: 2, maxItems: 2 }, [1, 2]);
                expect(errors).to.have.length(0);
            });
        });

        describe("additionalItems", () => {

            it("should return error for prohibited additional items", () => {
                const errors = validate(core, { type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: false
                }, ["1", 2, "a"]);

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("AdditionalItemsError");
            });

            it("should be valid if 'additionalItems' is true", () => {
                const errors = validate(core, { type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: true
                }, ["1", 2, "a"]);

                expect(errors).to.have.length(0);
            });

            it("should also be valid if 'additionalItems' is undefined", () => {
                const errors = validate(core, { type: "array",
                    items: [{ type: "string" }, { type: "number" }]
                }, ["1", 2, "a"]);

                expect(errors).to.have.length(0);
            });

            it("should return error for mismatching 'additionalItems' schema", () => {
                const errors = validate(core, { type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: { type: "object" }
                }, ["1", 2, "a"]);

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should be valid for matching 'additionalItems' schema", () => {
                const errors = validate(core, { type: "array",
                    items: [{ type: "string" }, { type: "number" }],
                    additionalItems: { type: "object" }
                }, ["1", 2, {}]);

                expect(errors).to.have.length(0);
            });
        });


        describe("not", () => {

            it("should be invalid if 'not' keyword does match", () => {
                const errors = validate(core,
                    { type: "array",
                        items: [{ type: "string" }, { type: "number" }],
                        additionalItems: { type: "object" },
                        not: { items: {} }
                    },
                    ["1", 2, {}]
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("NotError");
            });
        });


        describe("uniqueItems", () => {

            it("should not validate for duplicated values", () => {
                const errors = validate(core, { type: "array", uniqueItems: true }, [1, 2, 3, 4, 3]);

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("UniqueItemsError");
            });

            it("should not validate for duplicated objects", () => {
                const errors = validate(core, { type: "array", uniqueItems: true },
                    [{ id: "first" }, { id: "second" }, { id: "first" }]
                );

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("UniqueItemsError");
            });

            it("should validate for mismatching objects with equal properties", () => {
                const errors = validate(core, { type: "array", uniqueItems: true },
                    [{ id: "first", val: 1 }, { id: "first", val: 2 }, { id: "first", val: 3 }]
                );

                expect(errors).to.have.length(0);
            });
        });


        describe("oneOf", () => {

            it("should return no error for valid oneOf items", () => {
                const errors = validate(core,
                    {
                        type: "array", items: { oneOf: [
                            { type: "number" },
                            { type: "object", properties: { a: { type: "string" } }, additionalProperties: false }
                        ] }
                    },
                    [100, { a: "string" }]
                );

                expect(errors).to.have.length(0);
            });

            it("should return OneOfError if no item does match", () => {
                const errors = validate(core,
                    {
                        type: "array", items: { oneOf: [
                            { type: "number" },
                            { type: "object", properties: { a: { type: "string" } }, additionalProperties: false }
                        ] }
                    },
                    [100, { a: "correct", b: "not correct" }]
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("OneOfError");
            });

            it("should return MultipleOneOfError if multiple oneOf definitions match the given value", () => {
                const errors = validate(core,
                    {
                        type: "array", items: { oneOf: [
                            { type: "integer" },
                            { minimum: 2 }
                        ] }
                    },
                    [3]
                );
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MultipleOneOfError");
            });
        });
    });

    describe("string", () => {

        it("should return MinLengthError if string is too short", () => {
            const errors = validate(core, { type: "string", minLength: 2 }, "a");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinLengthError");
        });

        it("should return MaxLengthError if string is too long", () => {
            const errors = validate(core, { type: "string", maxLength: 2 }, "abc");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxLengthError");
        });

        it("should be valid if string is within range", () => {
            const errors = validate(core, { type: "string", minLength: 2, maxLength: 2 }, "ab");
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(core, { minLength: 2, maxLength: 2 }, "ab");
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate(core, { type: "string", "enum": ["a", "c"] }, "b");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate(core, { type: "string", "enum": ["a", "b", "c"] }, "b");
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(core, { type: "string", not: { type: "string", pattern: "^b$" } }, "b");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("number", () => {

        it("should return MinimumError if number is too small", () => {
            const errors = validate(core, { type: "number", minimum: 2 }, 1);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MinimumError if number is equal and exclusiveMinimum is set", () => {
            const errors = validate(core, { type: "number", minimum: 2, exclusiveMinimum: true }, 2);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinimumError");
        });

        it("should return MaximumError if number is too large", () => {
            const errors = validate(core, { type: "number", maximum: 1 }, 2);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should return MaximumError if number same and exclusiveMaximum is set", () => {
            const errors = validate(core, { type: "number", maximum: 2, exclusiveMaximum: true }, 2);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaximumError");
        });

        it("should be valid if number is within range", () => {
            const errors = validate(core, { type: "number", minimum: 1, maximum: 1 }, 1);
            expect(errors).to.have.length(0);
        });

        it("should still be valid for missing type", () => {
            const errors = validate(core, { minimum: 1, maximum: 1 }, 1);
            expect(errors).to.have.length(0);
        });

        it("should return EnumError if value is not within enum list", () => {
            const errors = validate(core, { type: "number", "enum": [21, 27, 42] }, 13);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("EnumError");
        });

        it("should be valid if value is within enum list", () => {
            const errors = validate(core, { type: "number", "enum": [21, 27, 42] }, 27);
            expect(errors).to.have.length(0);
        });

        it("should return error if value is not multiple of 1.5", () => {
            const errors = validate(core, { type: "number", multipleOf: 1.5 }, 4);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MultipleOfError");
        });

        it("should be valid if value if a multiple of 1.5", () => {
            const errors = validate(core, { type: "number", multipleOf: 1.5 }, 4.5);
            expect(errors).to.have.length(0);
        });

        it("should be valid if 'multipleOf' is not a number", () => {
            const errors = validate(core, { type: "number", multipleOf: "non-number" }, 4.5);
            expect(errors).to.have.length(0);
        });

        it("should be invalid if 'not' keyword does match", () => {
            const errors = validate(core,
                { type: "number", not: { type: "number", minimum: 4 } }, 4.5
            );
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("NotError");
        });
    });

    describe("arrays of types", () => {

        it("should not return an error for a valid type", () => {
            let errors = validate(core, { type: ["object", "null"] }, {});
            expect(errors).to.have.length(0);
            errors = validate(core, { type: ["object", "null"] }, null);
            expect(errors).to.have.length(0);
        });

        it("should return a TypeError if passed type is not within array", () => {
            const errors = validate(core, { type: ["object", "null"] }, []);
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        });

        it("should support 'integer' as a valid type within array", () => {
            const errors = validate(core, { type: ["integer", "null"] }, 1);
            expect(errors).to.have.length(0);
        });
    });

    describe("heterogeneous types", () => {

        describe("enum", () => {

            it("should validate a matching value within enum", () => {
                const errors = validate(core, { "enum": [1, "second", []] }, "second");
                expect(errors).to.have.length(0);
            });

            it("should validate a matching array within enum", () => {
                const errors = validate(core, { "enum": [1, "second", []] }, []);
                expect(errors).to.have.length(0);
            });

            it("should validate a matching object within enum", () => {
                const errors = validate(core, { "enum": [1, "second", { id: "third" }] }, { id: "third" });
                expect(errors).to.have.length(0);
            });

            it("should return error for non-matching object", () => {
                const errors = validate(core, { "enum": [1, "second", { id: "third" }] }, { id: "first" });
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("EnumError");
            });

            it("should return error for invalid null", () => {
                const errors = validate(core, { "enum": [1, "second", { id: "third" }] }, null);
                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("EnumError");
            });
        });

        describe("$ref", () => {

            it("should correctly validate data through nested $ref", () => {
                const schema = {
                    $ref: "#/definitions/c",
                    definitions: {
                        a: { type: "integer" },
                        b: { $ref: "#/definitions/a" },
                        c: { $ref: "#/definitions/b" }
                    }
                };
                core.rootSchema = schema;
                const errors = validate(core, schema, "a");

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });

            it("should correctly validate combination of remote, allOf, and allOf-$ref", () => {
                const schema = { $ref: "http://json-schema.org/draft-04/schema#", _id: "input" };
                core.rootSchema = schema;
                const errors = validate(core, schema, { minLength: -1 });

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("MinimumError");
            });

            it("should correctly resolve local remote url", () => {
                const remotes = require("../../remotes");
                remotes["http://localhost:1234/integer.json"] = require("json-schema-test-suite/remotes/integer.json");

                const schema = { $ref: "http://localhost:1234/integer.json", _id: "input" };
                core.rootSchema = schema;
                const errors = validate(core, schema, "not an integer");

                expect(errors).to.have.length(1);
                expect(errors[0].name).to.eq("TypeError");
            });
        });
    });
});
