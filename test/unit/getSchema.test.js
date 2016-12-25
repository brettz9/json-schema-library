const expect = require("chai").expect;
const getSchema = require("../../lib/getSchema");
const Core = require("../../lib/cores/draft04");

describe("getSchema", () => {

    let core;
    before(() => (core = new Core()));

    describe("value", () => {

        it("should return schema of any value", () => {
            core.rootSchema = { id: "target", type: "*" };
            const schema = getSchema(core, core.rootSchema, undefined, "#");
            expect(schema).to.deep.equal({ id: "target", type: "*" });
        });
    });

    describe("object", () => {

        it("should return schema of the given property", () => {
            core.rootSchema = {
                type: "object",
                properties: {
                    title: { id: "title", type: "string" }
                }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/title");
            expect(schema).to.deep.equal({ id: "title", type: "string" });
        });

        it("should return schema for property within nested object", () => {
            core.rootSchema = {
                type: "object",
                properties: {
                    image: {
                        type: "object",
                        properties: {
                            title: { id: "title", type: "string" }
                        }
                    }
                }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/image/title");
            expect(schema).to.deep.equal({ id: "title", type: "string" });
        });

        it("should resolve $ref as property", () => {
            core.rootSchema = {
                type: "object",
                definitions: {
                    target: {
                        id: "target"
                    }
                },
                properties: {
                    image: {
                        $ref: "#/definitions/target"
                    }
                }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/image");
            expect(schema).to.deep.equal({ id: "target" });
        });

        it("should return correct 'oneOf' object definition", () => {
            core.rootSchema = {
                type: "object",
                oneOf: [
                    {
                        type: "object",
                        properties: { first: { type: "string" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { second: { type: "string", id: "target" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { third: { type: "string" } },
                        additionalProperties: false
                    }
                ]
            };
            const schema = getSchema(core, core.rootSchema, { second: "string" }, "#/second");
            expect(schema).to.deep.equal({ id: "target", type: "string" });
        });
    });

    describe("array", () => {

        it("should return item schema", () => {
            core.rootSchema = {
                type: "array",
                items: { id: "title", type: "string" }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/0");
            expect(schema).to.deep.equal({ id: "title", type: "string" });
        });

        it("should return item schema based on index", () => {
            core.rootSchema = {
                type: "array",
                items: [
                    { type: "number" },
                    { id: "target", type: "string" },
                    { type: "number" }
                ]
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/1");
            expect(schema).to.deep.equal({ id: "target", type: "string" });
        });

        it("should return schema for matching 'oneOf' item", () => {
            core.rootSchema = {
                type: "array",
                items: {
                    oneOf: [
                        {
                            type: "object",
                            properties: { first: { type: "string" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { second: { type: "string", id: "target" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { third: { type: "string" } },
                            additionalProperties: false
                        }
                    ]
                }
            };
            const schema = getSchema(core, core.rootSchema, [{ second: "second" }], "#/0/second");
            expect(schema).to.deep.equal({ type: "string", id: "target" });
        });
    });
});
