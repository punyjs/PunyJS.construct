/**
* The prototype manager resolves 1..n prototype namespaces. If there is more
* than 1 namespace, each is resolved and combined to make a hybrid prototype.
* Each namespace must point to a sub branch of the `construct.prototypes`
* abstract branch.
* @factory
*/
function _PrototypeManager(
    construct_prototypes$
    , promise
    , proxy
    , utils_apply
    , is_array
    , reporter
    , infos
    , errors
) {

    return PrototypeManager;

    /**
    * @worker
    * @function
    *   @async
    *   @param {string|array<string>} namespace The namespace, or an array of
    *   namespaces, to return. An array of namespaces creates a hybrid prototype
    *   , which is a combination of the namespaces.
    */
    async function PrototypeManager(namespace) {
        //create a hybrid prototype if the namespace val is an array
        if (is_array(namespace)) {
            return createHybridPrototype(
                namespace //as namespaces
            );
        }
        //otherwise resolve the namespace
        return resolvePrototypeNamespace(
            namespace
        );
    }
    /**
    * Resolves each namespace and creates a hybrid prototype with the resolved
    * prototypes
    * @function
    */
    async function createHybridPrototype(namespaces) {
        var prototypes =
            await promise.all(
                namespaces.map(
                    resolvePrototypeNamespace
                )
            )
        , hybridPrototype = {}
        ;
        //add property descriptors to the prototype
        addAllPropertyDescriptors(
            prototypes
            , hybridPrototype
        );

        return hybridPrototype;
    }
    /**
    * @function
    */
    async function resolvePrototypeNamespace(namespace) {
        var prototype = await construct_prototypes$(
            namespace
            , {"quiet":true}
        );
        if (!prototype) {
            throw new Error(
                `${errors.construct.prototype.invalid_prototype_namespace} (${namespace})`
            );
        }
        return prototype;
    }
    /**
    * @function
    */
    function addAllPropertyDescriptors(prototypes, target) {
        //
        prototypes.forEach(
            appendPrototypePropertyDescriptors.bind(
                null
                , target
            )
        );
    }
    /**
    * @function
    */
    function appendPrototypePropertyDescriptors(target, prototype) {
        Object.keys(prototype)
        .forEach(
            function forEachKey(key) {
                addPropertyDescriptor(
                    target
                    , prototype
                    , key
                );
            }
        );
    }
    /**
    * @function
    */
    function addPropertyDescriptor(target, prototype, propName) {
        Object.defineProperty(
            target
            , propName
            , {
                "enumerable": true
                , "writable": true
                , "value": prototype[propName]
            }
        );
    }
}