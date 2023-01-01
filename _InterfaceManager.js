/**
* The interface manager provides a mechanism to validate objects against
* definitions and generate objects that fit definition(s).
* @factory
* @interface interface_definition
*   @property {string|array} [prototype] The abstract namespace, or array of
*   namespaces of the object to use as a the prototype when generating objects
*   @property {object} properties An object mapping a field names to field
*   definitions.
* @interface interface_property
*   @property {string} name The name of the property
*   @property {string} type The property data type; string, number, bigint, date
*   bool.
*   @property {mixed} [default] The default value to use when generating objects
*   @property {boolean} [required] If true, the field must be given a value at
*   the time of generation. Not needed if there is a default.
*   @property {string} [validator] The abstract namespace of a validating
*   function or a regular expression
*/
function _InterfaceManager(
    construct_prototypeManager
    , construct_validator
    , construct_definitions$
    , promise
    , is_array
    , utils_apply
    , reporter
    , infos
    , errors
) {
    /**
    *
    * @field
    */
    const DefinitionSymbol = Symbol("Definition")
    /**
    * @worker
    */
    , self  = Object.create(
        Object
        , {
            "validate": {
                "enumerable": true
                , "value": validateInterface
            }
            , "generate": {
                "enumerable": true
                , "value": generateInterface
            }
            , "lookup": {
                "enumerable": true
                , "value": lookupDefinition
            }
            , "definition": {
                "enumerable": true
                , "value": getDefinition
            }
        }
    );

    return self;

    /**
    * @function
    */
    function validateInterface(namespace, target) {

    }


    /**
    * Generates an object that fits the interface namespace(s)
    * @function
    */
    async function generateInterface(namespace, target = {}) {
        //get the definition for the namespace or namespaces
        const definition = await lookupDefinition(
            namespace
        )
        , descriptors = createDescriptors(
            namespace
            , definition
            , target
        )
        , prototype = !!definition.prototype
            ? construct_prototypeManager(
                definition.prototype
            )
            : null
        , interface = Object.create(
            prototype
            , descriptors
        );
        //validate

        return interface;
    }


    /**
    * @function
    */
    async function lookupDefinition(namespace) {
        var definition;
        //if there are more than 1 namespace, resolve and combine them
        if (is_array(namespace)) {
            definition = await combineDefinitions(
                await resolveDefinitionNamespaces(
                    namespace //as namespaces
                )
            );
        }
        //otherwise resolve the single namespace
        else {
            definition = await resolveDefinitionNamespace(
                namespace
            );
        }
        //resolve any properties that are interfaces
        await resolvePropertyInterfaces(
            definition.properties
        );

        return definition;
    }
    /**
    * @function
    */
    async function resolveDefinitionNamespaces(namespaces) {
        return await promise.all(
            namespaces.map(
                resolveDefinitionNamespace
            )
        );
    }
    /**
    * @function
    */
    async function resolveDefinitionNamespace(namespace) {
        var definition = construct_definitions$(
            namespace
            , {"quiet":true}
        );

        if (!definition) {
            throw new Error(
                `${errors.construct.interface.invalid_interface_namespace} (${namespace})`
            );
        }

        definition.namespace = namespace;

        return definition;
    }
    /**
    * @function
    */
    async function combineDefinitions(definitions) {
        var combinedDefinition = {
            "namespace": []
            , "prototype": []
            , "properties": {}
        }
        ;
        //loop through the definitions and combine their protos and properties
        definitions.forEach(
            function addEachDefinition(definition) {
                combinedDefinition.namespace
                    .concat(
                        definition.namespace
                    )
                ;
                if (!!definition.prototype) {
                    combinedDefinition.prototype =
                        combinedDefinition.prototype.concat(
                            definition.prototype
                        )
                    ;
                }
                utils_apply(
                    definition.properties
                    , combinedDefinition.properties
                );
            }
        );

        return combinedDefinition;
    }
    /**
    * @function
    */
    async function resolvePropertyInterfaces(properties) {
        //identify the properties that are of type interface
        var interfaceProperties =
            Object.keys(properties)
            .filter(
                function checkForInterface(propertyName) {
                    return properties[propertyName].type === "interface";
                }
            )
            .map(
                function mapProperty(propertyName) {
                    return properties[propertyName];
                }
            )
        ;
        //get the definition for each interface property
        await promise.all(
            interfaceProperties
            .map(
                async function defineEachProperty(property) {
                    property.definition = await lookupDefinition(
                        property.namespace
                    );
                }
            )
        );
    }



    /**
    * @function
    */
    function createDescriptors(namespace, definition, target) {
        var descriptors = {
            [DefinitionSymbol]: {
                "enumerable": true
                , "value": definition
            }
        };

        Object.keys(definition.properties)
        .forEach(
            function forEachKey(key) {
                descriptors[key] = createDescriptor(
                    key
                    , definition.properties[key]
                    , target
                );
            }
        );

        return descriptors;
    }
    /**
    * @function
    */
    function createDescriptor(propName, property, target) {
        //set the default value if missing fropm the target
        if (!target.hasOwnProperty(propName)) {
            if (property.hasOwnProperty("default")) {
                target[propName] = property.default;
            }
            else if (property.required === true) {
                throw new Error(
                    `${errors.construct.interface.missing_required_property} (${propName})`
                );
            }
        }
        //add the getter
        var descriptor = {
            "enumerable": true
            , "writable": property.readonly !== true
        };
        //add the setter if not readonly
        if (property.readonly !== true) {
            descriptor.set = setterFn.bind(
                null
                , propName
                , property
                , target
            );
        }
        //create interface descriptors
        if (property.type === "interface") {
            descriptor.descriptors = createDescriptors(
                property.namespace
                , property.definition
                , target[propName]
            );
        }

        return descriptor;
    }
    /**
    * @function
    */
    function getterFn(propName, target) {
        console.log("get", propName)
        return target[propName];
    }
    /**
    * @function
    */
    function setterFn(propName, property, target, newValue) {
        console.log("set", propName)
        //determine the type of the new value to ensure it fits the property
        var newValueType = typeof newValue;
        //if interface, create the interface
        if (property.type === "interface") {
            // newValue = generateInterface(
            //     propName
            //     , newValue
            // );
        }
        //coerce the type if not the same as the property
        else if (property.type !== newValueType) {
            newValue = coerceValue(
                newValue
                , property.type
            );
        }
        //run the validator if there is one
        if (property.hasOwnProperty("validator")) {
            // construct_validator(
            //     property.validator
            //     , newValue
            // );
        }

        target[propName] = newValue;

        return true;
    }
    /**
    * @function
    */
    function coerceValue(value, type) {
        switch(type) {
            case "bigint":
                return BigInt(value);
            break;
            case "string":
                return String(value);
            break;
            case "number":
                return Number(value);
            break;
            case "date":
                return new Date(value);
            break;
            case "bool":
                return !!value;
            break;
        }
    }


    /**
    * Returns an array of interface namespaces that the object was
    * generated with
    * @function
    */
    function getDefinition(obj) {
        return obj[DefinitionSymbol];
    }
}