/**
* @test
*   @title PunyJS.construct._PrototypeManager
*/
function prototypeManagerTest1(
    controller
    , mock_callback
) {
    var prototypeManager, prototypes, prototypeResolver, result1, result2;

    arrange(
        async function arrangeFn() {
            prototypes = {
                "prototype1": {
                    "proto1Prop1": "value1"
                    , "proto1Prop2": "value2"
                    , "proto1Prop3": "value3"
                }
                , "prototype2": {
                    "proto2Prop1": "value4"
                    , "proto2Prop2": "value5"
                    , "proto2Prop3": "value6"
                }
            };
            prototypeResolver = mock_callback(
                async function mockPrototypeResolver(namespace) {
                    return prototypes[namespace];
                }
            );
            prototypeManager = await controller(
                [
                    ":PunyJS.construct._PrototypeManager"
                    , [
                        prototypeResolver
                    ]
                ]
            );
        }
    );

    act(
        async function actFn() {
            result1 = await prototypeManager(
                "prototype1"
            );
            result2 = await prototypeManager(
                [
                    "prototype1"
                    , "prototype2"
                ]
            );
            prototypes.prototype1.proto1Prop3 = "new3";
            result2.proto1Prop3 = "new3.5";
        }
    );

    assert(
        function assertFn(test) {
            test("prototypeResolver should be called")
            .value(prototypeResolver)
            .hasBeenCalled(3)
            .hasBeenCalledWithArg(0, 0, "prototype1")
            .hasBeenCalledWithArg(1, 0, "prototype1")
            .hasBeenCalledWithArg(2, 0, "prototype2")
            ;

            test("result1.proto1Prop3 should be")
            .value(result1, "proto1Prop3")
            .equals("new3")
            ;

            test("result2.proto1Prop3 should be")
            .value(result2, "proto1Prop3")
            .equals("new3.5")
            ;
        }
    );
}