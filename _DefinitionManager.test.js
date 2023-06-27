/**
* @test
*   @title PunyJS.construct._DefinitionManager
*/
function definitionManagerTest1(
    controller
    , mock_callback
) {
    var definitions, definitions$, definitionManager
    , resolvedPerson, resolvedPhysicality, resolvedMixed
    ;

    arrange(
        async function arrangeFn() {
            definitions = {
                "person": {
                    "prototype": "animal"
                    , "properties": {
                        "fname": {
                            "required": true
                            , "type": "string"
                        }
                        , "sname": {
                            "required": false
                            , "type": "string"
                        }
                        , "birthday": {
                            "required": false
                            , "type": "date"
                            , "readonly": true
                        }
                        , "ssn": {
                            "required": false
                            , "type": "string"
                            , "validator": "std.us.ssn"
                        }
                        , "physicality": {
                            "required": false
                            , "type": "interface"
                            , "namespace": "physicality"
                        }
                        , "accessLevel": {
                            "default": "user"
                            , "validator": "app.auth.accessLevels"
                            , "required": true
                            , "type": "string"
                        }
                    }
                }
                , "physicality": {
                    "properties": {
                        "heightCm": {
                            "required": true
                            , "type": "number"
                        }
                        , "weightKg": {
                            "required": false
                            , "type": "number"
                        }
                    }
                }
            };
            definitions$ = mock_callback(
                async function mockResolveDefinitions(namespace) {
                    return definitions[namespace];
                }
            );
            definitionManager = await controller(
                [
                    ":PunyJS.construct._DefinitionManager"
                    , [
                        definitions$
                    ]
                ]
            );
        }
    );

    act(
        async function actFn() {
            resolvedPerson = await definitionManager.resolve(
                "person"
            );
            resolvedPhysicality = await definitionManager.resolve(
                "physicality"
            );
            resolvedMixed = await definitionManager.resolve(
                [
                    "physicality"
                    , "person"
                ]
            );
        }
    );

    assert(
        function assertFn(test) {
            test("resolved person should be")
            .value(resolvedPerson)
            .equals(definitions.person)
            ;

            test("resolved physicality should be")
            .value(resolvedPhysicality)
            .equals(definitions.physicality)
            ;

            test("resolved mixed should be")
            .value(resolvedMixed)
            .stringify()
            .equals('{"namespace":["physicality","person"],"prototype":["animal"],"properties":{"heightCm":{"required":true,"type":"number"},"weightKg":{"required":false,"type":"number"},"fname":{"required":true,"type":"string"},"sname":{"required":false,"type":"string"},"birthday":{"required":false,"type":"date","readonly":true},"ssn":{"required":false,"type":"string","validator":"std.us.ssn"},"physicality":{"required":false,"type":"interface","namespace":"physicality"},"accessLevel":{"default":"user","validator":"app.auth.accessLevels","required":true,"type":"string"}}}')
            ;
        }
    );
}