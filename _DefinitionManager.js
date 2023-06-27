/**
* Resolves an interface definition using the namespace. If there are multiple
* namespaces, each is resolved and combined into a hybrid definition.
* @factory
* @interface interface_definition
*   @property {string|array} [prototype] The abstract namespace, or array of
*   namespaces of the object to use as a the prototype when generating objects
*   @property {string|array} [extends] The abstract path, or array of paths,
*   that point to interface(s) that will be used to extend this interface.
*   @property {interface<interface_property>} properties An object mapping a
*   field names to field definitions.
* @interface interface_property
*   @property {boolean} [required] Default false, when true an error will be
*   thrown if the property is not present and there is no default.
*   @property {string} type The data type
*/
function _DefinitionManager(
    construct_definitions$
    , is_array
    , utils_apply
) {

    /**
    * @worker
    */
    const self = Object.create(
        Object
        , {
            "resolve": {
                "enumerable": true
                , "value": resolveDefinition
            }
        }
    );

    return self;

    /**
    * @function
    *   @param {string|array} namespace A path, or array of paths pointing to the definition
    *   @param {object} target The target object that will be used to hold a weak reference to the definition
    */
    async function resolveDefinition(namespace) {
        //if there are more than 1 namespace, resolve and combine them
        if (is_array(namespace)) {
            return await combineDefinitions(
                await resolveDefinitionNamespaces(
                    namespace //as namespaces
                )
            );
        }
        //otherwise resolve the single namespace
        else {
            return await resolveDefinitionNamespace(
                namespace
            );
        }
    }
    /**
    * @function
    */
    async function resolveDefinitionNamespaces(namespaces) {
        return await Promise.all(
            namespaces
            .map(
                resolveDefinitionNamespace
            )
        );
    }
    /**
    * @function
    */
    async function resolveDefinitionNamespace(namespace) {
        //pull the definition from the definitions catalog
        var definition = await construct_definitions$(
            namespace
            , {"quiet":true}
        );

        if (!definition) {
            throw new Error(
                `${errors.construct.interface.invalid_interface_namespace} (${namespace})`
            );
        }
        //set the namespace
        if (!definition.namespace) {
            definition.namespace = namespace;
            //freeze the definition so it can't be changed
            Object.freeze(
                definition
            );
        }

        return definition;
    }
    /**
    * Creates a new definition which is
    * @function
    */
    async function combineDefinitions(definitions) {
        var combinedDefinition = {
            "namespace": []
            , "prototype": []
            , "properties": {}
        };
        //loop through the definitions and combine their protos and properties
        definitions.forEach(
            addEachDefinition.bind(
                null
                , combinedDefinition
            )
        );

        return combinedDefinition;
    }
    /**
    * Adds the definition's namespace, properties and prototypes to the combined
    * definition, preserving the references to the definition.
    * @function
    */
    function addEachDefinition(combinedDefinition, definition) {
        combinedDefinition.namespace
            .push(
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
        //shallow copy so the properties retain their references
        utils_apply(
            definition.properties
            , combinedDefinition.properties
        );
    }
}