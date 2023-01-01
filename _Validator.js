/**
* The validator resolves validator namspaces and uses the resolved item
* to inspect the provided value. The resolved item can be either a function, a
* regular expression, or a list of valid values. The namespace must point to a
* sub branch of the `construct.validators` abstract branch.
* @factory
*/
function _Validator(
    construct_validators$
    , promise
    , is_regexp
    , is_array
    , is_func
    , reporter
    , infos
    , errors
) {

    return Validator;

    /**
    * @worker
    */
    function Validator(namespace, value) {
        if (!is_array(namespace)) {
            return executeValidator(
                namespace
                , value
            );
        }
        //test each validator
        return executeValidators(
            namespace //as namespaces
            , value
        );
    }
    /**
    * @function
    */
    async function executeValidators(namespaces, value) {
        var procs = namespaces
        .map(
            function executeEachValidator(namespace) {
                return executeValidator(
                    namespace
                    , value
                );
            }
        )
        , results = await promise.all(
            procs
        );

        return results.every(
            function testEachResult(result) {
                return result;
            }
        );
    }
    /**
    * @function
    */
    async function executeValidator(namespace, value) {
        return validateValue(
            await resolveValidatorNamespace(
                namespace
            )
            , value
        );
    }
    /**
    * @function
    */
    function validateValue(validator, value) {
        if (is_regexp(validator)) {
            return validator.test(value);
        }
        else if (is_func(validator)) {
            return !!validator(value);
        }
        else if (is_array(validator)) {
            return validator.indexOf(value) !== -1;
        }
        throw new Error(
            `${errors.construct.validator.invalid_validator} (${typeof validator})`
        );
    }
    /**
    * @function
    */
    async function resolveValidatorNamespace(namespace) {
        var validator = await construct_validators$(
            namespace
            , {"quiet":true}
        );
        if (!validator) {
            throw new Error(
                `${errors.construct.validator.invalid_validator_namespace} (${namespace})`
            );
        }
        return validator;
    }
}