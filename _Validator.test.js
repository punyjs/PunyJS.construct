/**
* @test
*   @title PunyJS.construct._Validator
*/
function validatorTest1(
    controller
    , mock_callback
) {
    var validatorManager, construct_validators, validators
    , result1, result2, result3
    ;

    arrange(
        async function arrangeFn() {
            validators = {
                "regexp1": /test/i
                , "func1": (value)=>{return value === "test";}
                , "list1": [
                    "test1"
                    , "test2"
                    , "TEST3"
                ]
            };
            construct_validators = mock_callback(
                await function mockValidatorResolver(namespace) {
                    return validators[namespace];
                }
            );
            validatorManager = await controller(
                [
                    ":PunyJS.construct._Validator"
                    , [
                        construct_validators
                    ]
                ]
            );
        }
    );

    act(
        async function actFn() {
            result1 = await validatorManager(
                "regexp1"
                , "test"
            );
            result2 = await validatorManager(
                ["regexp1", "func1"]
                , "test1"
            );
            result3 = await validatorManager(
                ["list1", "regexp1"]
                , "test1"
            );
        }
    );

    assert(
        function assertFn(test) {
            test("result1 should be")
            .value(result1)
            .isTrue()
            ;

            test("result2 should be")
            .value(result2)
            .isFalse()
            ;

            test("result3 should be")
            .value(result3)
            .isTrue()
            ;
        }
    );
}