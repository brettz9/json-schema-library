/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const iterateSchema = require("../../lib/iterateSchema");


describe("iterateSchema", () => {

    it("should execute callback on root-schema", () => {
        let firstCall;
        const rootSchema = {
            type: "object",
            properties: {}
        };

        iterateSchema(rootSchema, (schema) => (firstCall = firstCall || schema));

        expect(firstCall).to.eq(rootSchema);
    });

    it("should call on each property schema", () => {
        const calls = [];
        const rootSchema = {
            type: "object",
            properties: {
                first: { type: "string" },
                second: { type: "number" }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.properties.first);
        expect(calls[2]).to.eq(rootSchema.properties.second);
    });

    it("should call on each item schema", () => {
        const calls = [];
        const rootSchema = {
            type: "array",
            items: [
                { type: "string" },
                { type: "number" }
            ]
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.items[0]);
        expect(calls[2]).to.eq(rootSchema.items[1]);
    });

    it("should call on each item property", () => {
        const calls = [];
        const rootSchema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    first: { type: "string" },
                    second: { type: "number" }
                }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(4);
        expect(calls[2]).to.eq(rootSchema.items.properties.first);
        expect(calls[3]).to.eq(rootSchema.items.properties.second);
    });

    it("should call on each oneOf-schema", () => {
        const calls = [];
        const rootSchema = {
            oneOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.oneOf[0]);
        expect(calls[2]).to.eq(rootSchema.oneOf[1]);
    });

    it("should call on each oneOf-schema in items", () => {
        const calls = [];
        const rootSchema = {
            type: "array",
            items: {
                oneOf: [
                    { type: "string" },
                    { type: "number" }
                ]
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.items.oneOf[0]);
        expect(calls[2]).to.eq(rootSchema.items.oneOf[1]);
    });

    it("should call on each anyOf-schema", () => {
        const calls = [];
        const rootSchema = {
            anyOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.anyOf[0]);
        expect(calls[2]).to.eq(rootSchema.anyOf[1]);
    });

    it("should call on each allOf-schema", () => {
        const calls = [];
        const rootSchema = {
            allOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.allOf[0]);
        expect(calls[2]).to.eq(rootSchema.allOf[1]);
    });

    it("should call on definitions", () => {
        const calls = [];
        const rootSchema = {
            definitions: {
                image: {
                    type: "string", format: "url"
                }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(2);
        expect(calls[1]).to.eq(rootSchema.definitions.image);
    });

    it("should call on additionalProperties", () => {
        const calls = [];
        const rootSchema = {
            additionalProperties: {
                type: "object",
                properties: {
                    url: { type: "string" }
                }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.additionalProperties);
    });

    it("should ignore depedency list", () => {
        const calls = [];
        const rootSchema = {
            dependencies: {
                url: ["title"]
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(1);
    });

    it("should call on each depedency schema", () => {
        const calls = [];
        const rootSchema = {
            dependencies: {
                url: ["title"],
                target: {
                    type: "string"
                }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(2);
        expect(calls[1]).to.eq(rootSchema.dependencies.target);
    });

    it("should iterate over nested definitions", () => {
        const calls = [];
        const rootSchema = {
            definitions: {
                anotherScope: {
                    definitions: {
                        bar: { type: "array" }
                    }
                }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[0]).to.eq(rootSchema);
        expect(calls[1]).to.eq(rootSchema.definitions.anotherScope);
        expect(calls[2]).to.eq(rootSchema.definitions.anotherScope.definitions.bar);
    });
});
