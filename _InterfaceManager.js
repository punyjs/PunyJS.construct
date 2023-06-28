/**
* The interface manager provides a mechanism to validate objects against
* definitions and generate objects that fit definition(s).
* @factory
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
    , construct_definitionManager
    , construct_validator
    , is_object
    , is_empty
    , utils_copy
    , utils_getType
    , errors
) {
    /**
    * A symbol pointing to a function that returns the interface's definition
    * @field
    */
    const GetDefinitionSymbol = Symbol("getDefinition")
    /**
    * @alias
    */
    , prototypeManager = construct_prototypeManager
    /**
    * @alias
    */
    , definitionManager = construct_definitionManager
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
    * Generates an object that fits the interface definition for the provided
    * namespace(s)
    * @function
    */
    async function lookupDefinition(namespace) {
        return definitionManager.resolve(
            namespace
        );
    }


    /**
    * Generates an object that fits the interface definition for the provided
    * namespace(s)
    * @function
    */
    async function generateInterface(namespace, target) {
        //remove external references to the target
        if (is_object(target)) {
            target = utils_copy(
                target
            );
        }
        //or create the target if missing
        else {
            target = {};
        }
        //get the definition for the namespace or namespaces
        const definition = await definitionManager
            .resolve(
                namespace
                , target
            )
        //get the prototype for the definition
        , prototype = !!definition.prototype
            ? prototypeManager(
                definition.prototype
            )
            : null
        ;
        //create the interface from the definition
        return await createInterface(
            definition
            , prototype
            , target
        );
    }


    /**
    * @function
    */
    async function createInterface(definition, prototype, target) {
        var {isValid, violations} = await validateDefinition(
            definition
            , target
        )
        , descriptors = isValid
            && await createDescriptors(
                definition
                , target
            )
        , obj = isValid
            && Object.create(
                prototype
                , descriptors
            )
        ;
        //throw if invalid target
        if (!isValid) {
            throw new Error(
                `${errors.construct.interface.invalid_target}\tviolations:${violations}`
            );
        }
        //create the proxy
        return new Proxy(
            obj
            , {
                "set": handleSet.bind(
                    null
                    , definition.properties
                )
                , "deleteProperty": handleDelete.bind(
                    null
                    , definition.properties
                )
                , "setPrototypeOf": handleSetPrototypeOf.bind(
                    null
                    , definition.properties
                )
            }
        );
    }
    /**
    * @function
    */
    async function createDescriptors(definition, target) {
        var descriptors = {
            [GetDefinitionSymbol]: {
                "enumerable": true
                , "value": definitionManager.resolve
                    .bind(
                        null
                        , target
                    )
            }
        };

        await Promise.all(
            Object.keys(definition.properties)
            .map(
                forEachPropertyKey.bind(
                    null
                    , descriptors
                    , definition
                    , target
                )
            )
        );

        return descriptors;
    }
    /**
    * @function
    */
    async function forEachPropertyKey(descriptors, definition, target, key) {
        descriptors[key] = await createDescriptor(
            key
            , definition.properties[key]
            , target
        );
    }
    /**
    * @function
    */
    async function createDescriptor(propName, property, target) {
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
        };
        //create interface for the descriptor's value
        if (property.type === "interface") {
            descriptor.value = await generateInterface(
                property.namespace
                , target[propName]
            );
            descriptor.writable = false;
        }
        //add getter/setter
        else {
            descriptor.value = target[propName];
            descriptor.writable = descriptor.configurable = !property.readonly;
        }

        return descriptor;
    }
    
    /**
    * @function
    */
    function handleSet(properties, target, propName, newValue) {
        var property = properties[propName]
        , violations = []
        , isValid, error
        ;
        //validate the new value
        validateProperty(
            property
            , violations
            , target
            , propName
            , newValue
        );
        //target does not have a property with this name
        if (newValue === undefined) {
            //if there is a default
            if (Object.hasOwn(property, "default")) {
                target[propName] = property.default;
            }
        }
        //try to coerce the type if not the same as the property
        if (utils_getType(newValue) !== property.type) {
            ({"coercedValue": newValue, error} = coerceValue(
                newValue
                , property.type
            ));
            if (!!error) {
                throw new Error(
                    error
                );
            }
        }

        target[propName] = newValue;

        return true;
    }
    /**
    * @function
    */
    function handleDelete(properties, target, propName) {
        var property = properties[propName];
        if (property?.required === true) {
            throw new Error(
                `${errors.construct.interface.prop_required}\tnamespace:${target[GetDefinitionSymbol]().namespace},propName:${propName}`
            );
        }
        delete target[propName];

        return true;
    }
    /**
    * @function
    */
    function handleSetPrototypeOf(target, prototype) {
        throw new Error(
            `${errors.construct.interface.no_set_prototype}\tnamespace:${target[GetDefinitionSymbol]().namespace}`
        );
    }

    
    /**
    * @function
    */
    async function validateInterface(namespace, target) {
        //get the definition for the namespace or namespaces
        const definition = await lookupDefinition(
            namespace
        );
        return validateDefinition(
            definition
            , target
        );
    }
    /**
    * @function
    */
    async function validateDefinition(definition, target) {
        var violations = []
        //loop through the definition properties
        , procs = Object.keys(definition.properties)
            .map(
                validateProperty.bind(
                    null
                    , definition.properties
                    , violations
                    , target
                )
            )
        ;

        await Promise.all(procs);

        return {
            "isValid": is_empty(violations)
            , "violations": violations
        };
    }
    /**
    * @function
    */
    async function validateProperty(properties, violations, target, propName, ...rest) {
        var property = properties[propName]
        , propertyValue = target[propName]
        , error
        ;
        //see if we are testing a new value
        if (rest.length === 1) {
            propertyValue = rest[0];
        }
        //target does not have a property with this name
        if (!Object.hasOwn(target, propName)) {
            //check required and value
            if (property.required === true) {
                //if there isn't a default
                if (!Object.hasOwn(property, "default")) {
                    violations.push(
                        `${errors.construct.interface.missing_required_property}\tpropName:${propName}`
                    );
                    return false;
                }
            }
            return true;
        }
        //if the property is an interface then run the validator recursaively
        if (property.type === "interface") {
            let {"isValid": isInterfaceValid, "violations": interfaceViolations} =
                await validateInterface(
                    property.namespace
                    , target[propName]
                )
            ;
            //combine the violations
            for (let violation of interfaceViolations) {
                violations.push(violation);
            }
            return isInterfaceValid;
        }
        //do type check
        //try to coerce the type if not the same as the property
        else if (utils_getType(propertyValue) !== property.type) {
            ({"coercedValue": propertyValue, error} = coerceValue(
                propertyValue
                , property.type
            ));
            //if there was an error add that to the violations
            if (!!error) {
                violations.push(
                    `${errors.construct.interface.failed_coerce}\tpropName:${propName},error:${error}`
                );
                return false;
            }
            //see if we failed to coerce the value
            if (utils_getType(propertyValue) !== property.type) {
                violations.push(
                    `${errors.construct.interface.failed_coerce}\tpropName:${propName},type:${utils_getType(propertyValue)}`
                );
                return false;
            }
        }
        //run the validator if there is one
        if (Object.hasOwn(property, "validator")) {
            ({isValid, error} = construct_validator(
                property.validator
                , propertyValue
            ));
            if (!!error) {
                violations.push(
                    error
                );
                return false;
            }
            if (!isValid) {
                violations.push(
                    `${errors.construct.interface.failed_validator}\tpropName:${propName},validator:${property.validator}`
                );
                return false;
            }
        }

        return true;
    }
    /**
    * @function
    */
    function coerceValue(value, type) {
        var coercedValue
        , error
        ;

        try {
            switch(type) {
                case "bigint":
                    coercedValue = BigInt(value);
                break;
                case "string":
                    if (value === null || value === undefined) {
                        coercedValue = "";
                    }
                    else {
                        coercedValue = String(value);
                    }
                break;
                case "number":
                    coercedValue = Number(value);
                    if (isNaN(coercedValue)) {
                        error = "Invalid Number";
                    }
                break;
                case "date":
                    coercedValue = new Date(value);
                    if (coercedValue.toString() === "Invalid Date") {
                        error = "Invalid Date";
                    }
                break;
                case "bool":
                    coercedValue = !!value;
                break;
            }
        }
        catch(ex) {
            error = ex.message;
        }
       
        return {
            "coercedValue": coercedValue
            , "error": error
        };
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